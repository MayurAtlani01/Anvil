from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Flashcard, ProgressEntry, User
from app.dependencies.auth import get_optional_user
from app.schemas.progress import (
    ProgressEntryCreate,
    ProgressEntryResponse,
    ProgressStatsResponse,
    TopicPerformance,
)

router = APIRouter(prefix="/api/progress", tags=["Progress & Analytics"])


@router.get("/stats", response_model=ProgressStatsResponse)
def get_progress_stats(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Aggregate real study analytics across Reading, Exam, and Interview modes."""
    query = db.query(ProgressEntry)
    if current_user:
        query = query.filter(ProgressEntry.user_id == current_user.id)

    entries = query.order_by(ProgressEntry.date.desc()).all()

    # Flashcards due today
    now = datetime.now(timezone.utc)
    fc_query = db.query(Flashcard)
    if current_user:
        fc_query = fc_query.filter(Flashcard.user_id == current_user.id)
    cards_due_today = fc_query.filter(Flashcard.next_review_date <= now).count()

    total_study_time_min = 0
    cards_reviewed = 0
    questions_solved = 0
    interviews_completed = 0
    scores = []
    topic_map = {}

    for e in entries:
        if e.duration_sec:
            total_study_time_min += round(e.duration_sec / 60)

        if e.activity_type == "flashcard_reviewed":
            cards_reviewed += 1
        elif e.activity_type in ("pyq_solved", "interview_question_answered"):
            questions_solved += 1
        elif e.activity_type == "interview_session_completed":
            interviews_completed += 1

        if e.score is not None:
            scores.append(e.score)

        # Topic performance
        if e.metadata_json and isinstance(e.metadata_json, dict):
            topic = e.metadata_json.get("topic")
            if topic:
                cat = e.metadata_json.get("category", e.mode)
                if topic not in topic_map:
                    topic_map[topic] = {"category": cat, "total": 0, "correct": 0}
                topic_map[topic]["total"] += 1
                if e.score and e.score >= 70:
                    topic_map[topic]["correct"] += 1

    # Calculate streak days from activity dates
    streak_days = 0
    last_active_str = ""
    if entries:
        last_active = entries[0].date
        last_active_str = last_active.isoformat()
        dates = sorted(list({e.date.date() for e in entries}), reverse=True)
        today = datetime.now(timezone.utc).date()
        
        # Check if active today or yesterday to maintain streak
        if dates and (dates[0] == today or (today - dates[0]).days == 1):
            streak_days = 1
            curr = dates[0]
            for next_date in dates[1:]:
                if (curr - next_date).days == 1:
                    streak_days += 1
                    curr = next_date
                else:
                    break

    accuracy_rate = round(sum(scores) / len(scores), 1) if scores else 0.0

    topic_performance = [
        TopicPerformance(
            topic=t,
            category=d["category"],
            total=d["total"],
            correct=d["correct"],
            accuracy=round((d["correct"] / d["total"]) * 100, 1) if d["total"] > 0 else 0.0,
        )
        for t, d in topic_map.items()
    ]

    recent = [ProgressEntryResponse.model_validate(e) for e in entries[:20]]

    return ProgressStatsResponse(
        totalStudyTimeMinutes=total_study_time_min,
        streakDays=streak_days,
        lastActiveDate=last_active_str,
        cardsReviewed=cards_reviewed,
        cardsDueToday=cards_due_today,
        questionsSolved=questions_solved,
        interviewsCompleted=interviews_completed,
        accuracyRate=accuracy_rate,
        recentActivity=recent,
        topicPerformance=topic_performance,
    )


@router.post("/activity", response_model=ProgressEntryResponse, status_code=status.HTTP_201_CREATED)
def record_activity(
    body: ProgressEntryCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Record an incremental learning action (article read, flashcard reviewed, question solved)."""
    entry = ProgressEntry(
        user_id=current_user.id if current_user else None,
        date=datetime.now(timezone.utc),
        mode=body.mode,
        activity_type=body.activityType,
        score=body.score,
        duration_sec=body.durationSec,
        metadata_json=body.metadata,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/reset", status_code=status.HTTP_204_NO_CONTENT)
def reset_progress(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Reset learning analytics."""
    query = db.query(ProgressEntry)
    if current_user:
        query = query.filter(ProgressEntry.user_id == current_user.id)
    query.delete(synchronize_session=False)
    db.commit()
    return None
