from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Formula, Question, RevisionNote, User
from app.dependencies.auth import get_optional_user
from app.schemas.exam import (
    QuestionCreate,
    QuestionResponse,
    FormulaCreate,
    FormulaResponse,
    RevisionNoteCreate,
    RevisionNoteResponse,
    FrequentlyAskedTopicResponse,
)

router = APIRouter(prefix="/api/exam", tags=["Exam Mode"])


# ==========================================
# 1. PYQS (Previous Year Questions)
# ==========================================

@router.get("/pyqs", response_model=List[QuestionResponse])
def list_pyqs(
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve Exam Mode Previous Year Questions (PYQs) with isolation to exam mode only."""
    query = db.query(Question).filter(Question.mode == "exam")

    if subject and subject.lower() != "all":
        query = query.filter(Question.subject.ilike(subject.strip()))
    if topic and topic.lower() != "all":
        query = query.filter(Question.topic.ilike(topic.strip()))
    if year:
        query = query.filter(Question.year == year)
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


@router.get("/pyqs/{id}", response_model=QuestionResponse)
def get_pyq(id: str, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == id, Question.mode == "exam").first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


@router.post("/pyqs", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_pyq(
    pyq_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Add a new Exam Mode question / PYQ."""
    pyq = Question(
        user_id=current_user.id if current_user else None,
        title=pyq_in.title,
        prompt=pyq_in.prompt,
        description=pyq_in.description,
        mode="exam",  # Strict mode isolation
        category=pyq_in.category or "general",
        subject=pyq_in.subject,
        topic=pyq_in.topic,
        year=pyq_in.year,
        difficulty=pyq_in.difficulty or "medium",
        tags=pyq_in.tags,
        hints=pyq_in.hints,
        sample_answer=pyq_in.sampleAnswer,
        rubrics=pyq_in.rubrics,
        formulas=pyq_in.formulas,
        frequency_rank=pyq_in.frequencyRank,
        options=pyq_in.options,
        correct_answer=pyq_in.correctAnswer,
        code_snippet=pyq_in.codeSnippet,
    )
    db.add(pyq)
    db.commit()
    db.refresh(pyq)
    return pyq


# ==========================================
# 2. FORMULAS
# ==========================================

@router.get("/formulas", response_model=List[FormulaResponse])
def list_formulas(
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve Exam Mode Formula Repository."""
    query = db.query(Formula)

    if subject and subject.lower() != "all":
        query = query.filter(Formula.subject.ilike(subject.strip()))
    if topic and topic.lower() != "all":
        query = query.filter(Formula.topic.ilike(topic.strip()))
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            (Formula.name.ilike(term))
            | (Formula.formula.ilike(term))
            | (Formula.explanation.ilike(term))
            | (Formula.topic.ilike(term))
        )

    return query.order_by(Formula.created_at.desc()).all()


@router.post("/formulas", response_model=FormulaResponse, status_code=status.HTTP_201_CREATED)
def create_formula(
    f_in: FormulaCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Add a formula to the Exam Mode repository."""
    formula = Formula(
        user_id=current_user.id if current_user else None,
        name=f_in.name,
        subject=f_in.subject,
        topic=f_in.topic,
        formula=f_in.formula,
        explanation=f_in.explanation,
        variables=[v.model_dump() for v in f_in.variables],
        example=f_in.example,
        difficulty=f_in.difficulty,
    )
    db.add(formula)
    db.commit()
    db.refresh(formula)
    return formula


# ==========================================
# 3. REVISION NOTES
# ==========================================

@router.get("/revision-notes", response_model=List[RevisionNoteResponse])
def list_revision_notes(
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve high-yield revision notes."""
    query = db.query(RevisionNote)
    if subject and subject.lower() != "all":
        query = query.filter(RevisionNote.subject.ilike(subject.strip()))
    if topic and topic.lower() != "all":
        query = query.filter(RevisionNote.topic.ilike(topic.strip()))

    return query.order_by(RevisionNote.created_at.desc()).all()


@router.post("/revision-notes", response_model=RevisionNoteResponse, status_code=status.HTTP_201_CREATED)
def create_revision_note(
    note_in: RevisionNoteCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Add a revision note for exam preparation."""
    rev = RevisionNote(
        user_id=current_user.id if current_user else None,
        title=note_in.title,
        subject=note_in.subject,
        topic=note_in.topic,
        summary=note_in.summary,
        key_points=note_in.keyPoints,
        code_or_snippet=note_in.codeOrSnippet,
        important_formulas=note_in.importantFormulas,
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev


# ==========================================
# 4. SUBJECTS, TOPICS & FREQUENTLY ASKED
# ==========================================

@router.get("/subjects", response_model=List[str])
def list_subjects(db: Session = Depends(get_db)):
    """Get all distinct subjects across exam questions, formulas, and revision notes."""
    pyq_subjects = db.query(Question.subject).filter(Question.mode == "exam", Question.subject.isnot(None)).distinct().all()
    formula_subjects = db.query(Formula.subject).filter(Formula.subject.isnot(None)).distinct().all()
    rev_subjects = db.query(RevisionNote.subject).filter(RevisionNote.subject.isnot(None)).distinct().all()

    all_subs = set()
    for rows in (pyq_subjects, formula_subjects, rev_subjects):
        for (sub,) in rows:
            if sub and sub.strip():
                all_subs.add(sub.strip())

    return sorted(list(all_subs))


@router.get("/topics", response_model=List[str])
def list_topics(
    subject: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get all distinct topics, optionally scoped to a specific subject."""
    q_query = db.query(Question.topic).filter(Question.mode == "exam", Question.topic.isnot(None))
    f_query = db.query(Formula.topic).filter(Formula.topic.isnot(None))

    if subject and subject.lower() != "all":
        q_query = q_query.filter(Question.subject.ilike(subject.strip()))
        f_query = f_query.filter(Formula.subject.ilike(subject.strip()))

    all_topics = set()
    for (top,) in q_query.distinct().all():
        if top and top.strip():
            all_topics.add(top.strip())
    for (top,) in f_query.distinct().all():
        if top and top.strip():
            all_topics.add(top.strip())

    return sorted(list(all_topics))


@router.get("/frequently-asked-topics", response_model=List[FrequentlyAskedTopicResponse])
def get_frequently_asked_topics(db: Session = Depends(get_db)):
    """Calculate topic frequency weights from actual Exam questions in the database."""
    pyqs = db.query(Question).filter(Question.mode == "exam").all()
    if not pyqs:
        return []

    counts: Dict[str, Dict[str, Any]] = {}
    for p in pyqs:
        if p.topic:
            key = p.topic.strip()
            if key not in counts:
                counts[key] = {"subject": p.subject or "General", "count": 0}
            counts[key]["count"] += 1

    total = len(pyqs)
    result = []
    for topic, data in counts.items():
        weight = round((data["count"] / total) * 100) if total > 0 else 0
        result.append(
            FrequentlyAskedTopicResponse(
                topic=topic,
                subject=data["subject"],
                count=data["count"],
                weight=weight,
            )
        )

    return sorted(result, key=lambda x: x.count, reverse=True)
