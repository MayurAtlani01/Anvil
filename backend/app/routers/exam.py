from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Bookmark, Formula, Question, RevisionNote, User
from app.dependencies.auth import get_optional_user
from app.schemas.bookmarks import BookmarkResponse
from app.schemas.exam import (
    QuestionCreate,
    QuestionResponse,
    FormulaCreate,
    FormulaResponse,
    RevisionNoteCreate,
    RevisionNoteResponse,
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
    scope: Optional[str] = Query("all", description="Filter by scope: 'all', 'library' (Anvil Library), or 'my' (My PYQs)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve Exam Mode Previous Year Questions (PYQs) with isolation to exam mode only.
    Supports separating Anvil Library (curated) and My PYQs (student-created).
    """
    query = db.query(Question).filter(Question.mode == "exam")

    # Scope separation: Anvil Library vs My PYQs
    if scope == "library":
        query = query.filter(Question.user_id.is_(None))
    elif scope in ("my", "mine"):
        if current_user:
            query = query.filter(Question.user_id == current_user.id)
        else:
            query = query.filter(Question.user_id.isnot(None))
    elif current_user:
        query = query.filter(
            (Question.user_id.is_(None)) | (Question.user_id == current_user.id)
        )

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


@router.get("/pyqs/library", response_model=List[QuestionResponse])
def list_library_pyqs(
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve curated Anvil Library PYQs only."""
    return list_pyqs(
        subject=subject,
        topic=topic,
        year=year,
        difficulty=difficulty,
        search=search,
        scope="library",
        db=db,
        current_user=None,
    )


@router.get("/pyqs/my", response_model=List[QuestionResponse])
def list_my_pyqs(
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve student-created PYQs (My PYQs) only."""
    return list_pyqs(
        subject=subject,
        topic=topic,
        year=year,
        difficulty=difficulty,
        search=search,
        scope="my",
        db=db,
        current_user=current_user,
    )


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
    """Add a new Exam Mode question / PYQ (assigned to student if logged in)."""
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
    scope: Optional[str] = Query("all", description="Filter by scope: 'all', 'library' (Anvil Formulas), or 'my' (My Formulas)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve Exam Mode Formula Repository.
    Supports separating curated Anvil Formulas from student My Formulas.
    """
    query = db.query(Formula)

    # Scope separation: Anvil Formulas vs My Formulas
    if scope == "library":
        query = query.filter(Formula.user_id.is_(None))
    elif scope in ("my", "mine"):
        if current_user:
            query = query.filter(Formula.user_id == current_user.id)
        else:
            query = query.filter(Formula.user_id.isnot(None))
    elif current_user:
        query = query.filter(
            (Formula.user_id.is_(None)) | (Formula.user_id == current_user.id)
        )

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


@router.get("/formulas/library", response_model=List[FormulaResponse])
def list_library_formulas(
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve curated Anvil Formulas only."""
    return list_formulas(
        subject=subject,
        topic=topic,
        search=search,
        scope="library",
        db=db,
        current_user=None,
    )


@router.get("/formulas/my", response_model=List[FormulaResponse])
def list_my_formulas(
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve student-created formulas (My Formulas) only."""
    return list_formulas(
        subject=subject,
        topic=topic,
        search=search,
        scope="my",
        db=db,
        current_user=current_user,
    )


@router.post("/formulas", response_model=FormulaResponse, status_code=status.HTTP_201_CREATED)
def create_formula(
    f_in: FormulaCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Add a formula to the Exam Mode repository (assigned to student if logged in)."""
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
# 3. REVISION NOTES (Student-Owned)
# ==========================================

@router.get("/revision-notes", response_model=List[RevisionNoteResponse])
def list_revision_notes(
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve high-yield revision notes. Strictly student-owned."""
    query = db.query(RevisionNote)
    if current_user:
        query = query.filter(RevisionNote.user_id == current_user.id)
    else:
        query = query.filter(RevisionNote.user_id.is_(None))

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
    """Add a revision note for exam preparation (strictly student-owned)."""
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
# 4. SUBJECTS & TOPICS
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


# ==========================================
# 5. EXAM BOOKMARKS ISOLATION
# ==========================================

@router.get("/bookmarks", response_model=List[BookmarkResponse])
def list_exam_bookmarks(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve only bookmarked items belonging strictly to Exam Mode."""
    query = db.query(Bookmark)
    if current_user:
        query = query.filter(Bookmark.user_id == current_user.id)

    # Subqueries for actual exam items
    exam_q_ids = [r[0] for r in db.query(Question.id).filter(Question.mode == "exam").all()]
    formula_ids = [r[0] for r in db.query(Formula.id).all()]
    rev_note_ids = [r[0] for r in db.query(RevisionNote.id).all()]
    valid_ids = set(exam_q_ids + formula_ids + rev_note_ids)

    query = query.filter(
        (Bookmark.url.ilike("anvil://exam/%"))
        | (Bookmark.content_id.in_(valid_ids))
    )
    return query.order_by(Bookmark.created_at.desc()).all()
