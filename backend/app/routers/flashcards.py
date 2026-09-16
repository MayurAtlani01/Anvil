from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Flashcard, User
from app.dependencies.auth import get_optional_user
from app.schemas.flashcards import (
    FlashcardCreate,
    FlashcardUpdate,
    FlashcardResponse,
    FlashcardReviewInput,
)
from app.services.sm2_service import calculate_sm2

router = APIRouter(prefix="/api/flashcards", tags=["Flashcards"])


@router.get("", response_model=List[FlashcardResponse])
def list_flashcards(
    deckId: Optional[str] = Query(None, alias="deckId"),
    sourceMode: Optional[str] = Query(None, alias="sourceMode"),
    dueOnly: Optional[bool] = Query(False, alias="dueOnly"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """List flashcards with optional filtering by deck, source mode, or due status."""
    query = db.query(Flashcard)
    if current_user:
        query = query.filter(Flashcard.user_id == current_user.id)

    if deckId:
        query = query.filter(Flashcard.deck_id == deckId)
    if sourceMode:
        query = query.filter(Flashcard.source_mode == sourceMode)
    if dueOnly:
        now = datetime.now(timezone.utc)
        query = query.filter(Flashcard.next_review_date <= now)

    return query.order_by(Flashcard.next_review_date.asc()).all()


@router.get("/review-queue", response_model=List[FlashcardResponse])
def get_review_queue(
    deckId: Optional[str] = Query(None, alias="deckId"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get the queue of cards currently due for review."""
    query = db.query(Flashcard)
    if current_user:
        query = query.filter(Flashcard.user_id == current_user.id)

    if deckId:
        query = query.filter(Flashcard.deck_id == deckId)

    now = datetime.now(timezone.utc)
    return query.filter(Flashcard.next_review_date <= now).order_by(Flashcard.next_review_date.asc()).all()


@router.post("", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
def create_flashcard(
    fc_in: FlashcardCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Create a new flashcard with initial SM-2 defaults."""
    card = Flashcard(
        user_id=current_user.id if current_user else None,
        front=fc_in.front,
        back=fc_in.back,
        deck_id=fc_in.deckId or "default",
        source_url=fc_in.sourceUrl,
        source_mode=fc_in.sourceMode or "reading",
        content_type=fc_in.contentType or "note",
        difficulty=fc_in.difficulty or "medium",
        interval=1,
        repetition=0,
        ease_factor=2.5,
        next_review_date=datetime.now(timezone.utc),
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.post("/{id}/review", response_model=FlashcardResponse)
def record_flashcard_review(
    id: str,
    review_in: FlashcardReviewInput,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Record a review rating (1-5) and calculate next review interval using SuperMemo SM-2."""
    query = db.query(Flashcard).filter(Flashcard.id == id)
    if current_user:
        query = query.filter(Flashcard.user_id == current_user.id)
    card = query.first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    new_rep, new_int, new_ease, next_date = calculate_sm2(
        repetition=card.repetition,
        interval=card.interval,
        ease_factor=card.ease_factor,
        rating=review_in.rating,
    )

    card.repetition = new_rep
    card.interval = new_int
    card.ease_factor = new_ease
    card.next_review_date = next_date

    db.commit()
    db.refresh(card)
    return card


@router.get("/{id}", response_model=FlashcardResponse)
def get_flashcard(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Flashcard).filter(Flashcard.id == id)
    if current_user:
        query = query.filter(Flashcard.user_id == current_user.id)
    card = query.first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return card


@router.put("/{id}", response_model=FlashcardResponse)
def update_flashcard(
    id: str,
    fc_in: FlashcardUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Flashcard).filter(Flashcard.id == id)
    if current_user:
        query = query.filter(Flashcard.user_id == current_user.id)
    card = query.first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    if fc_in.front is not None:
        card.front = fc_in.front
    if fc_in.back is not None:
        card.back = fc_in.back
    if fc_in.deckId is not None:
        card.deck_id = fc_in.deckId
    if fc_in.difficulty is not None:
        card.difficulty = fc_in.difficulty

    db.commit()
    db.refresh(card)
    return card


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flashcard(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Flashcard).filter(Flashcard.id == id)
    if current_user:
        query = query.filter(Flashcard.user_id == current_user.id)
    card = query.first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    db.delete(card)
    db.commit()
    return None
