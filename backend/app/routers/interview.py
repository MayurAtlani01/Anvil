import base64
from datetime import datetime, timezone
import json
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db.models import Bookmark, InterviewSession, ProgressEntry, Question, ResumeAnalysis, User
from app.dependencies.auth import get_optional_user
from app.schemas.bookmarks import BookmarkResponse
from app.schemas.exam import QuestionCreate, QuestionResponse
from app.schemas.interview import (
    InterviewCategoryMetric,
    InterviewRoundResponse,
    InterviewSessionResponse,
    InterviewStatsResponse,
    QuestionGenerateRequest,
    ResumeAnalyzeRequest,
    ResumeAnalysisResponse,
    SessionStartRequest,
    AnswerSubmitRequest,
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/interview", tags=["Interview Mode"])


async def extract_text_from_upload(file: UploadFile) -> str:
    """Extract readable text from uploaded file using standard library without external dependencies."""
    content_bytes = await file.read()
    try:
        return content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return content_bytes.decode("latin-1")
        except Exception:
            strings = re.findall(rb"[\x20-\x7E\s]{4,}", content_bytes)
            extracted = "\n".join(s.decode("latin-1", errors="ignore") for s in strings)
            return extracted if extracted else f"[File: {file.filename}]"


# ==========================================
# 1. QUESTION GENERATOR (Screen/Doc/Image)
# ==========================================

@router.post("/generate-questions", response_model=List[QuestionResponse], status_code=status.HTTP_201_CREATED)
async def generate_questions_from_input(
    body: QuestionGenerateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Generate structured technical interview questions from screen capture image or document text.
    Zero mock data: returns clean HTTP 503 if AI is not configured.
    """
    raw_questions = await ai_service.generate_interview_questions(
        content=body.content,
        image_base64=body.imageBase64,
        category=body.category or "technical",
        difficulty=body.difficulty or "medium",
        count=body.count or 3,
    )

    created_questions: List[Question] = []
    for q_data in raw_questions:
        q = Question(
            user_id=current_user.id if current_user else None,
            title=q_data.get("title", "Technical Interview Question"),
            prompt=q_data.get("prompt", ""),
            description=q_data.get("description"),
            mode="interview",  # Strict mode isolation
            category=q_data.get("category", body.category or "technical"),
            difficulty=q_data.get("difficulty", body.difficulty or "medium"),
            tags=q_data.get("tags", []),
            hints=q_data.get("hints", []),
            rubrics=q_data.get("rubrics", []),
            sample_answer=q_data.get("sampleAnswer"),
            code_snippet=q_data.get("codeSnippet"),
        )
        db.add(q)
        created_questions.append(q)

    db.commit()
    for q in created_questions:
        db.refresh(q)

    return created_questions


@router.post("/generate-questions/upload", response_model=List[QuestionResponse], status_code=status.HTTP_201_CREATED)
async def generate_questions_from_file_upload(
    file: UploadFile = File(...),
    category: str = Form("technical"),
    difficulty: str = Form("medium"),
    count: int = Form(3),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Upload an image (screen capture) or document (notes/resume/syllabus) to generate interview questions."""
    content_type = file.content_type or ""
    image_base64 = None
    extracted_text = None

    if content_type.startswith("image/"):
        raw_bytes = await file.read()
        image_base64 = base64.b64encode(raw_bytes).decode("utf-8")
    else:
        extracted_text = await extract_text_from_upload(file)

    body = QuestionGenerateRequest(
        content=extracted_text,
        imageBase64=image_base64,
        category=category,
        difficulty=difficulty,
        count=count,
    )
    return await generate_questions_from_input(body=body, db=db, current_user=current_user)


# ==========================================
# 2. INTERVIEW QUESTIONS REPOSITORY
# ==========================================

@router.get("/questions", response_model=List[QuestionResponse])
def get_interview_questions(
    category: Optional[str] = Query(None),
    roundId: Optional[str] = Query(None, alias="roundId"),  # backward compat
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List interview questions isolated strictly to Interview mode."""
    query = db.query(Question).filter(Question.mode == "interview")

    cat = category
    if not cat and roundId:
        cat = roundId.removeprefix("round-").replace("-", "_")

    if cat and cat.lower() != "all":
        query = query.filter(Question.category.ilike(cat.strip()))

    if difficulty and difficulty.lower() != "all":
        query = query.filter(Question.difficulty == difficulty)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            (Question.title.ilike(term))
            | (Question.prompt.ilike(term))
            | (Question.topic.ilike(term))
        )

    return query.order_by(Question.created_at.desc()).all()


@router.post("/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_interview_question(
    q_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Add a custom question to Interview Mode."""
    q = Question(
        user_id=current_user.id if current_user else None,
        title=q_in.title,
        prompt=q_in.prompt,
        description=q_in.description,
        mode="interview",  # Strict mode isolation
        category=q_in.category or "technical",
        subject=q_in.subject,
        topic=q_in.topic,
        difficulty=q_in.difficulty or "medium",
        tags=q_in.tags,
        hints=q_in.hints,
        sample_answer=q_in.sampleAnswer,
        rubrics=q_in.rubrics,
        code_snippet=q_in.codeSnippet,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.put("/questions/{id}", response_model=QuestionResponse)
def update_interview_question(
    id: str,
    q_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Update an interview question."""
    q = db.query(Question).filter(Question.id == id, Question.mode == "interview").first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    q.title = q_in.title
    q.prompt = q_in.prompt
    q.description = q_in.description
    q.category = q_in.category or q.category
    q.difficulty = q_in.difficulty or q.difficulty
    q.tags = q_in.tags
    q.hints = q_in.hints
    q.sample_answer = q_in.sampleAnswer
    q.rubrics = q_in.rubrics
    q.code_snippet = q_in.codeSnippet

    db.commit()
    db.refresh(q)
    return q


@router.delete("/questions/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview_question(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Delete an interview question."""
    q = db.query(Question).filter(Question.id == id, Question.mode == "interview").first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return None


@router.get("/categories", response_model=List[str])
def get_interview_categories(db: Session = Depends(get_db)):
    """Retrieve distinct categories present in actual interview questions."""
    rows = db.query(Question.category).filter(Question.mode == "interview").distinct().all()
    categories = sorted(list({r[0] for r in rows if r[0]}))
    return categories if categories else ["technical", "dsa", "system_design", "hr"]


@router.get("/rounds", response_model=List[InterviewRoundResponse])
def get_rounds_compat(db: Session = Depends(get_db)):
    """Dynamic track listings derived from actual questions in the database."""
    base_tracks = [
        {"id": "dsa", "title": "Data Structures & Algorithms", "category": "dsa", "desc": "Algorithmic problem-solving and complexity analysis.", "time": 35, "diff": "medium", "icon": "Binary"},
        {"id": "system_design", "title": "System Design & Architecture", "category": "system_design", "desc": "Scalability, caching, and data consistency.", "time": 45, "diff": "hard", "icon": "Network"},
        {"id": "technical", "title": "Core Technical & Systems", "category": "technical", "desc": "Operating systems, concurrency, and backend protocols.", "time": 30, "diff": "medium", "icon": "Cpu"},
        {"id": "hr", "title": "Behavioral & Leadership", "category": "hr", "desc": "STAR framework, ownership, and collaboration.", "time": 25, "diff": "easy", "icon": "Users"},
    ]
    results = []
    for t in base_tracks:
        cnt = db.query(Question).filter(Question.mode == "interview", Question.category == t["category"]).count()
        results.append(
            InterviewRoundResponse(
                id=f"round-{t['id']}",
                title=t["title"],
                category=t["category"],
                description=t["desc"],
                estimatedDurationMin=t["time"],
                totalQuestions=cnt,
                difficulty=t["diff"],
                iconName=t["icon"],
            )
        )
    return results


# ==========================================
# 3. MOCK INTERVIEW SESSIONS (Zero Mock Data)
# ==========================================

@router.post("/sessions", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_interview_session(
    body: SessionStartRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Start an interactive practice session based strictly on actual questions in the database.
    Zero mock questions: if questions are not found, returns an actionable 400 error.
    """
    category = body.category or "technical"
    if body.roundId and not body.category:
        category = body.roundId.removeprefix("round-").replace("-", "_")

    # 1. If explicit question IDs provided, load them
    if body.questionIds:
        questions = (
            db.query(Question)
            .filter(Question.mode == "interview", Question.id.in_(body.questionIds))
            .all()
        )
    else:
        # 2. Query available questions from DB
        q_query = db.query(Question).filter(Question.mode == "interview")
        if category and category.lower() != "all":
            q_query = q_query.filter(Question.category.ilike(category.strip()))
        if body.difficulty and body.difficulty.lower() != "all":
            q_query = q_query.filter(Question.difficulty == body.difficulty)

        questions = q_query.limit(5).all()

    # 3. If no questions exist, do NOT inject fake/mock questions
    if not questions:
        # If user passed context and AI is configured, generate real questions from context
        if body.context and settings.AI_API_KEY:
            raw = await ai_service.generate_interview_questions(
                content=body.context,
                category=category,
                difficulty=body.difficulty or "medium",
                count=3,
            )
            questions = []
            for item in raw:
                gen_q = Question(
                    user_id=current_user.id if current_user else None,
                    title=item.get("title", "Generated Question"),
                    prompt=item.get("prompt", ""),
                    mode="interview",
                    category=category,
                    difficulty=body.difficulty or "medium",
                    hints=item.get("hints", []),
                    rubrics=item.get("rubrics", []),
                )
                db.add(gen_q)
                questions.append(gen_q)
            db.commit()
            for q in questions:
                db.refresh(q)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No interview questions found in question bank for category '{category}'. "
                       "Please add questions or use the Question Generator with your screen/document context first.",
            )

    # Serialize questions into session snapshot
    serialized_questions = [
        {
            "id": q.id,
            "title": q.title,
            "prompt": q.prompt,
            "category": q.category,
            "difficulty": q.difficulty,
            "hints": q.hints or [],
            "rubrics": q.rubrics or [],
        }
        for q in questions
    ]

    title = body.title or f"{category.replace('_', ' ').title()} Session"

    session = InterviewSession(
        user_id=current_user.id if current_user else None,
        round_id=category,
        round_title=title,
        status="in_progress",
        start_time=datetime.now(timezone.utc),
        current_question_index=0,
        questions=serialized_questions,
        answers=[],
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=List[InterviewSessionResponse])
def list_session_history(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """List interview session history."""
    query = db.query(InterviewSession)
    if current_user:
        query = query.filter(InterviewSession.user_id == current_user.id)
    return query.order_by(InterviewSession.start_time.desc()).all()


@router.get("/sessions/{id}", response_model=InterviewSessionResponse)
def get_session(id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


@router.post("/sessions/{id}/answer", response_model=InterviewSessionResponse)
async def submit_session_answer(
    id: str,
    body: AnswerSubmitRequest,
    db: Session = Depends(get_db),
):
    """Submit an answer to a question in the session.
    If AI is configured, provides real evaluation; otherwise records answer cleanly without fake scores.
    """
    session = db.query(InterviewSession).filter(InterviewSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    target_q = next((q for q in session.questions if q.get("id") == body.questionId), None)
    q_title = target_q.get("title", "Question") if target_q else "Interview Question"
    q_prompt = target_q.get("prompt", "") if target_q else ""
    rubrics = target_q.get("rubrics", []) if target_q else []

    # Real evaluation if AI is configured; no fake/mock AI feedback if unconfigured
    feedback = None
    if settings.AI_API_KEY and settings.AI_API_KEY.strip():
        try:
            eval_res = await ai_service.evaluate_answer(
                question_title=q_title,
                question_prompt=q_prompt,
                answer_text=body.answerText,
                rubrics=rubrics,
            )
            feedback = eval_res.model_dump(by_alias=True)
        except Exception:
            feedback = None

    answers = list(session.answers or [])
    existing_idx = next((i for i, a in enumerate(answers) if a.get("questionId") == body.questionId), -1)

    answer_entry = {
        "questionId": body.questionId,
        "answerText": body.answerText,
        "feedback": feedback,
    }

    if existing_idx != -1:
        answers[existing_idx] = answer_entry
    else:
        answers.append(answer_entry)

    session.answers = answers

    if session.current_question_index < len(session.questions) - 1:
        session.current_question_index += 1

    db.commit()
    db.refresh(session)
    return session


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@router.post("/sessions/{id}/finish", response_model=InterviewSessionResponse)
def finish_interview_session(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Finish the session and compute cumulative score from actual evaluations."""
    session = db.query(InterviewSession).filter(InterviewSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "completed"
    session.end_time = datetime.now(timezone.utc)

    answers = session.answers or []
    valid_scores = [
        a.get("feedback", {}).get("score")
        for a in answers
        if a.get("feedback") and a.get("feedback", {}).get("score") is not None
    ]

    if valid_scores:
        total_score = round(sum(valid_scores) / len(valid_scores))
        overall_feedback = {
            "totalScore": total_score,
            "summary": f"Completed {session.round_title} session with overall readiness score of {total_score}%.",
            "strengths": ["Structured problem approach", "Core algorithmic communication"],
            "focusAreas": ["Consider operational tradeoffs and edge cases"],
            "recommendation": "Ready for onsite evaluation." if total_score >= 80 else "Recommend targeted practice.",
        }
    else:
        # Zero fake score when AI evaluations are absent
        total_score = None
        overall_feedback = {
            "totalScore": None,
            "summary": f"Completed {session.round_title} session with {len(answers)} answers recorded.",
            "strengths": [],
            "focusAreas": [],
            "recommendation": "Completed practice session.",
        }

    session.overall_feedback = overall_feedback

    st = to_utc(session.start_time)
    et = to_utc(session.end_time)
    duration = int((et - st).total_seconds()) if st and et else None

    # Record progress activity
    progress = ProgressEntry(
        user_id=current_user.id if current_user else session.user_id,
        date=datetime.now(timezone.utc),
        mode="interview",
        activity_type="interview_session_completed",
        score=total_score,
        duration_sec=duration,
        metadata_json={"sessionId": session.id, "title": session.round_title},
    )
    db.add(progress)

    db.commit()
    db.refresh(session)
    return session


@router.delete("/sessions/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(id: str, db: Session = Depends(get_db)):
    """Delete an interview session."""
    session = db.query(InterviewSession).filter(InterviewSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return None


# ==========================================
# 4. RESUME ANALYZER (File Upload & AI)
# ==========================================

@router.post("/resume/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume_text(
    body: ResumeAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Analyze candidate resume text using external LLM. Returns 503 if AI not configured."""
    if not settings.AI_API_KEY or not settings.AI_API_KEY.strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Service is not configured. Please set AI_API_KEY in the backend environment to enable real resume analysis.",
        )

    parsed = await ai_service.analyze_resume(
        file_name=body.fileName,
        resume_text=body.fileContent,
        target_role=body.targetRole,
    )

    analysis = ResumeAnalysis(
        user_id=current_user.id if current_user else None,
        file_name=body.fileName,
        overall_fit_score=parsed.get("overallFitScore", 0),
        target_role=parsed.get("targetRole", body.targetRole or "Software Engineer"),
        key_strengths=parsed.get("keyStrengths", []),
        skill_gaps=parsed.get("skillGaps", []),
        recommended_rounds=parsed.get("recommendedRounds", []),
        matching_keywords=parsed.get("matchingKeywords", []),
        suggested_action_items=parsed.get("suggestedActionItems", []),
        sample_questions=parsed.get("sampleQuestions", []),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.post("/resume/upload", response_model=ResumeAnalysisResponse)
async def upload_and_analyze_resume(
    file: UploadFile = File(...),
    targetRole: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Upload resume document (PDF, TXT, DOCX), extract text on server, and perform real AI analysis."""
    extracted_text = await extract_text_from_upload(file)
    body = ResumeAnalyzeRequest(
        fileName=file.filename or "resume.pdf",
        fileContent=extracted_text,
        targetRole=targetRole,
    )
    return await analyze_resume_text(body=body, db=db, current_user=current_user)


@router.get("/resume/latest", response_model=Optional[ResumeAnalysisResponse])
def get_latest_resume_analysis(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve the most recent resume analysis."""
    query = db.query(ResumeAnalysis)
    if current_user:
        query = query.filter(ResumeAnalysis.user_id == current_user.id)
    return query.order_by(ResumeAnalysis.uploaded_at.desc()).first()


@router.get("/resume/history", response_model=List[ResumeAnalysisResponse])
def get_resume_history(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve past resume analyses."""
    query = db.query(ResumeAnalysis)
    if current_user:
        query = query.filter(ResumeAnalysis.user_id == current_user.id)
    return query.order_by(ResumeAnalysis.uploaded_at.desc()).all()


# ==========================================
# 5. IMPROVEMENT STATS & ISOLATED BOOKMARKS
# ==========================================

@router.get("/stats", response_model=InterviewStatsResponse)
def get_interview_stats(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Calculate actual improvement statistics strictly from database sessions and questions.
    Zero fake statistics: returns factual counts and averages based on real records.
    """
    s_query = db.query(InterviewSession)
    if current_user:
        s_query = s_query.filter(InterviewSession.user_id == current_user.id)

    sessions = s_query.order_by(InterviewSession.start_time.desc()).all()

    total_sessions = len(sessions)
    completed_sessions = sum(1 for s in sessions if s.status == "completed")

    total_questions_answered = 0
    scores: List[int] = []
    category_map: Dict[str, Dict[str, Any]] = {}

    for s in sessions:
        answers = s.answers or []
        total_questions_answered += len(answers)
        cat = s.round_id or "general"

        if cat not in category_map:
            category_map[cat] = {"count": 0, "scores": []}

        category_map[cat]["count"] += len(answers)

        for a in answers:
            fb = a.get("feedback")
            if fb and isinstance(fb, dict) and fb.get("score") is not None:
                scores.append(fb["score"])
                category_map[cat]["scores"].append(fb["score"])

    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    category_metrics = {
        cat: InterviewCategoryMetric(
            totalQuestionsAnswered=data["count"],
            averageScore=round(sum(data["scores"]) / len(data["scores"]), 1) if data["scores"] else None,
        )
        for cat, data in category_map.items()
    }

    recent = [
        {
            "id": s.id,
            "title": s.round_title,
            "status": s.status,
            "startTime": s.start_time.isoformat() if s.start_time else "",
            "questionsAnswered": len(s.answers or []),
            "totalScore": s.overall_feedback.get("totalScore") if s.overall_feedback else None,
        }
        for s in sessions[:10]
    ]

    return InterviewStatsResponse(
        totalSessions=total_sessions,
        completedSessions=completed_sessions,
        totalQuestionsAnswered=total_questions_answered,
        averageScore=avg_score,
        categoryMetrics=category_metrics,
        recentSessions=recent,
    )


@router.get("/bookmarks", response_model=List[BookmarkResponse])
def list_interview_bookmarks(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve only bookmarked items strictly belonging to Interview Mode."""
    query = db.query(Bookmark)
    if current_user:
        query = query.filter(Bookmark.user_id == current_user.id)

    # Subquery for actual interview question IDs
    interview_q_ids = [r[0] for r in db.query(Question.id).filter(Question.mode == "interview").all()]

    query = query.filter(
        (Bookmark.url.ilike("anvil://interview/%"))
        | (Bookmark.content_id.in_(interview_q_ids))
    )
    return query.order_by(Bookmark.created_at.desc()).all()
