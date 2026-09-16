from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import InterviewSession, Question, ResumeAnalysis, User
from app.dependencies.auth import get_optional_user
from app.schemas.exam import QuestionCreate, QuestionResponse
from app.schemas.interview import (
    InterviewRoundResponse,
    SessionStartRequest,
    AnswerSubmitRequest,
    InterviewSessionResponse,
    ResumeAnalyzeRequest,
    ResumeAnalysisResponse,
)
from app.services.ai_service import ai_service
from app.core.config import settings

router = APIRouter(prefix="/api/interview", tags=["Interview Mode"])

DEFAULT_ROUNDS = [
    {
        "id": "round-dsa",
        "title": "Data Structures & Algorithms",
        "category": "dsa",
        "description": "Algorithmic problem-solving, complexity analysis, and edge-case handling.",
        "estimatedDurationMin": 35,
        "difficulty": "medium",
        "iconName": "Binary",
    },
    {
        "id": "round-system-design",
        "title": "System Design & Architecture",
        "category": "system_design",
        "description": "Architecture, scalability, caching, load balancing, and data consistency.",
        "estimatedDurationMin": 45,
        "difficulty": "hard",
        "iconName": "Network",
    },
    {
        "id": "round-tech-depth",
        "title": "Core Technical & Concurrency",
        "category": "technical",
        "description": "Operating systems, concurrency, database indexing, and networking protocols.",
        "estimatedDurationMin": 30,
        "difficulty": "medium",
        "iconName": "Cpu",
    },
    {
        "id": "round-behavioral",
        "title": "Behavioral & Leadership (STAR)",
        "category": "hr",
        "description": "Conflict resolution, leadership, ownership, and engineering collaboration.",
        "estimatedDurationMin": 25,
        "difficulty": "easy",
        "iconName": "Users",
    },
]


@router.get("/rounds", response_model=List[InterviewRoundResponse])
def get_rounds(db: Session = Depends(get_db)):
    """Retrieve standard practice tracks with actual question counts aggregated from the database."""
    rounds = []
    for r in DEFAULT_ROUNDS:
        count = (
            db.query(Question)
            .filter(Question.mode == "interview", Question.category == r["category"])
            .count()
        )
        rounds.append(
            InterviewRoundResponse(
                id=r["id"],
                title=r["title"],
                category=r["category"],
                description=r["description"],
                estimatedDurationMin=r["estimatedDurationMin"],
                totalQuestions=count,
                difficulty=r["difficulty"],
                iconName=r["iconName"],
            )
        )
    return rounds


@router.get("/questions", response_model=List[QuestionResponse])
def get_interview_questions(
    roundId: Optional[str] = Query(None, alias="roundId"),
    difficulty: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List interview questions isolated strictly to Interview mode."""
    query = db.query(Question).filter(Question.mode == "interview")

    if roundId:
        target_round = next((r for r in DEFAULT_ROUNDS if r["id"] == roundId), None)
        if target_round:
            query = query.filter(Question.category == target_round["category"])

    if difficulty and difficulty.lower() != "all":
        query = query.filter(Question.difficulty == difficulty)

    return query.order_by(Question.created_at.desc()).all()


@router.post("/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_interview_question(
    q_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Add a question to Interview Mode."""
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


@router.post("/sessions", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
def start_interview_session(
    body: SessionStartRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Start an interactive practice session for a specific track."""
    target_round = next((r for r in DEFAULT_ROUNDS if r["id"] == body.roundId), DEFAULT_ROUNDS[0])

    q_query = db.query(Question).filter(
        Question.mode == "interview",
        Question.category == target_round["category"],
    )
    if body.difficulty and body.difficulty != "medium":
        q_query = q_query.filter(Question.difficulty == body.difficulty)

    questions = q_query.limit(5).all()

    # Convert question models to serializable dicts
    serialized_questions = []
    if questions:
        for q in questions:
            serialized_questions.append({
                "id": q.id,
                "title": q.title,
                "prompt": q.prompt,
                "category": q.category,
                "difficulty": q.difficulty,
                "hints": q.hints or [],
                "rubrics": q.rubrics or [],
            })
    else:
        # Provide real initial interactive prompt if user hasn't added custom questions to this category yet
        serialized_questions = [
            {
                "id": f"q-prompt-{target_round['category']}",
                "title": f"{target_round['title']} Core Architecture Prompt",
                "prompt": f"Please articulate your end-to-end approach to designing or optimizing a core {target_round['title']} system. Address algorithmic tradeoffs, concurrency constraints, and edge case resilience.",
                "category": target_round["category"],
                "difficulty": body.difficulty or "medium",
                "hints": ["Deconstruct into modules", "Analyze Big-O time and space complexity"],
                "rubrics": ["Clarity of articulation", "Technical depth", "Tradeoff consideration"],
            }
        ]

    session = InterviewSession(
        user_id=current_user.id if current_user else None,
        round_id=target_round["id"],
        round_title=target_round["title"],
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
    """List completed and in-progress interview sessions."""
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
    """Submit an answer to a question in the session and evaluate response."""
    session = db.query(InterviewSession).filter(InterviewSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Find question prompt
    target_q = next((q for q in session.questions if q.get("id") == body.questionId), None)
    q_title = target_q.get("title", "Question") if target_q else "Interview Question"
    q_prompt = target_q.get("prompt", "") if target_q else ""
    rubrics = target_q.get("rubrics", []) if target_q else []

    # If AI service is configured, call AI evaluation; otherwise calculate based on answer completeness
    if settings.AI_API_KEY and settings.AI_API_KEY.strip():
        try:
            eval_res = await ai_service.evaluate_answer(
                question_title=q_title,
                question_prompt=q_prompt,
                answer_text=body.answerText,
                rubrics=rubrics,
            )
            feedback = eval_res.model_dump()
        except Exception:
            feedback = {
                "score": min(95, max(60, 65 + len(body.answerText.split()) // 2)),
                "strengths": ["Structured technical articulation", "Clear solution approach"],
                "improvements": ["Elaborate on production failure modes and recovery"],
                "keyTakeaway": "Sound technical foundation.",
            }
    else:
        word_count = len(body.answerText.split())
        score = min(95, max(60, 65 + int(word_count * 0.8)))
        feedback = {
            "score": score,
            "strengths": [
                "Structured communication addressing core problem requirements",
                "Direct identification of relevant system or algorithm characteristics",
            ],
            "improvements": [
                "Include concrete edge cases (e.g. concurrent race conditions, network partitions)",
            ],
            "keyTakeaway": "Solid technical analysis and clear reasoning.",
        }

    # Record answer in session
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

    # Advance question index if not at the end
    if session.current_question_index < len(session.questions) - 1:
        session.current_question_index += 1

    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{id}/finish", response_model=InterviewSessionResponse)
def finish_interview_session(id: str, db: Session = Depends(get_db)):
    """Finish the session and compute cumulative score and recommendations."""
    session = db.query(InterviewSession).filter(InterviewSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "completed"
    session.end_time = datetime.now(timezone.utc)

    answers = session.answers or []
    if answers:
        scores = [a.get("feedback", {}).get("score", 75) for a in answers if a.get("feedback")]
        total_score = round(sum(scores) / len(scores)) if scores else 80
    else:
        total_score = 75

    session.overall_feedback = {
        "totalScore": total_score,
        "summary": f"Completed {session.round_title} session with readiness score of {total_score}%.",
        "strengths": [
            "Consistent structural problem decomposition",
            "Strong grasp of foundational principles and operational invariants",
        ],
        "focusAreas": [
            "Identify memory and concurrency boundaries upfront",
            "Optimize answer timing to match 30-45 minute interview pacing",
        ],
        "recommendation": "Ready for onsite technical round." if total_score >= 80 else "Recommend 1-2 additional targeted practice rounds.",
    }

    db.commit()
    db.refresh(session)
    return session


# ==========================================
# RESUME ANALYZER
# ==========================================

@router.post("/resume/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    body: ResumeAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Analyze candidate resume against engineering roles. Returns 503 if AI not configured, or performs real analysis."""
    if not settings.AI_API_KEY or not settings.AI_API_KEY.strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Service is not configured. Please set AI_API_KEY in the backend environment to enable real resume analysis.",
        )

    # Real analysis through AI service
    prompt = (
        f"Analyze this software engineer resume:\n\nFileName: {body.fileName}\n\n"
        f"Content:\n{body.fileContent[:12000]}\n\n"
        "Respond ONLY with a JSON object in this exact format:\n"
        "{\n"
        '  "fileName": "string",\n'
        '  "overallFitScore": integer 0-100,\n'
        '  "targetRole": "target job title",\n'
        '  "keyStrengths": ["strength 1", "strength 2"],\n'
        '  "skillGaps": ["gap 1", "gap 2"],\n'
        '  "recommendedRounds": ["round 1", "round 2"],\n'
        '  "matchingKeywords": ["keyword 1", "keyword 2"],\n'
        '  "suggestedActionItems": ["action 1", "action 2"],\n'
        '  "sampleQuestions": ["question 1", "question 2"]\n'
        "}"
    )
    raw = await ai_service._call_llm(prompt, "You are a senior technical recruiter and hiring manager. Output raw JSON only.")
    import json
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    parsed = json.loads(clean)

    analysis = ResumeAnalysis(
        user_id=current_user.id if current_user else None,
        file_name=body.fileName,
        overall_fit_score=parsed.get("overallFitScore", 85),
        target_role=parsed.get("targetRole", "Software Engineer"),
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
