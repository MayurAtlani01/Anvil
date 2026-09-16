from datetime import datetime, timezone
import uuid
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


def generate_id(prefix: str = "") -> str:
    unique = uuid.uuid4().hex[:12]
    return f"{prefix}{unique}" if prefix else unique


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: generate_id("usr_"))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="user", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    progress_entries = relationship("ProgressEntry", back_populates="user", cascade="all, delete-orphan")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("bm_"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(500), nullable=False)
    url = Column(Text, nullable=False)
    snippet = Column(Text, nullable=True)
    content_type = Column(String(32), nullable=False, index=True)  # 'question' | 'article' | 'note' | 'formula'
    content_id = Column(String(64), nullable=True, index=True)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="bookmarks")


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("note_"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    url = Column(Text, nullable=False, index=True)
    page_title = Column(String(500), nullable=True)
    selection_text = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    color = Column(String(32), default="#e0e7ff")
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="notes")


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("ann_"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    url = Column(Text, nullable=False, index=True)
    text = Column(Text, nullable=False)
    note_id = Column(String(64), nullable=True)
    color = Column(String(32), default="yellow")  # 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
    range_info = Column(JSON, nullable=True)  # {startOffset, endOffset, textSnippet}
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="annotations")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("fc_"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    deck_id = Column(String(64), default="default", index=True)
    source_url = Column(Text, nullable=True)
    source_mode = Column(String(32), default="reading", index=True)  # 'reading' | 'interview' | 'exam'
    content_type = Column(String(32), default="note")  # 'question' | 'article' | 'note' | 'formula'
    difficulty = Column(String(32), default="medium")  # 'easy' | 'medium' | 'hard'
    interval = Column(Integer, default=1)  # in days
    repetition = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)  # SuperMemo default 2.5
    next_review_date = Column(DateTime(timezone=True), default=utc_now, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="flashcards")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("q_"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(500), nullable=False)
    prompt = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    mode = Column(String(32), nullable=False, index=True)  # 'interview' | 'exam'
    category = Column(String(64), nullable=False, index=True)  # 'dsa' | 'technical' | 'hr' | 'system_design' | 'math' | 'physics' | 'cs' | 'general'
    subject = Column(String(128), nullable=True, index=True)
    topic = Column(String(128), nullable=True, index=True)
    year = Column(Integer, nullable=True)
    difficulty = Column(String(32), default="medium")  # 'easy' | 'medium' | 'hard'
    tags = Column(JSON, default=list)
    hints = Column(JSON, nullable=True)
    sample_answer = Column(Text, nullable=True)
    rubrics = Column(JSON, nullable=True)
    formulas = Column(JSON, nullable=True)
    frequency_rank = Column(Integer, nullable=True)  # 1 to 10
    options = Column(JSON, nullable=True)  # for multiple choice
    correct_answer = Column(Text, nullable=True)
    code_snippet = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Formula(Base):
    __tablename__ = "formulas"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("f_"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(128), nullable=False, index=True)
    topic = Column(String(128), nullable=False, index=True)
    formula = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    variables = Column(JSON, default=list)  # list of {symbol, meaning}
    example = Column(Text, nullable=False)
    difficulty = Column(String(32), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class RevisionNote(Base):
    __tablename__ = "revision_notes"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("rev_"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(500), nullable=False)
    subject = Column(String(128), nullable=False, index=True)
    topic = Column(String(128), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    key_points = Column(JSON, default=list)
    code_or_snippet = Column(Text, nullable=True)
    important_formulas = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class InterviewRound(Base):
    __tablename__ = "interview_rounds"

    id = Column(String(64), primary_key=True)
    title = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False, index=True)  # 'dsa' | 'technical' | 'hr' | 'system_design'
    description = Column(Text, nullable=False)
    estimated_duration_min = Column(Integer, default=30)
    difficulty = Column(String(32), default="medium")
    icon_name = Column(String(64), nullable=True)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("sess_"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    round_id = Column(String(64), nullable=False, index=True)
    round_title = Column(String(255), nullable=False)
    status = Column(String(32), default="in_progress")  # 'in_progress' | 'completed'
    start_time = Column(DateTime(timezone=True), default=utc_now)
    end_time = Column(DateTime(timezone=True), nullable=True)
    current_question_index = Column(Integer, default=0)
    questions = Column(JSON, default=list)
    answers = Column(JSON, default=list)  # list of {questionId, answerText, feedback}
    overall_feedback = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="interview_sessions")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("res_"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    file_name = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=utc_now)
    overall_fit_score = Column(Integer, default=0)
    target_role = Column(String(255), nullable=False)
    key_strengths = Column(JSON, default=list)
    skill_gaps = Column(JSON, default=list)
    recommended_rounds = Column(JSON, default=list)
    matching_keywords = Column(JSON, default=list)
    suggested_action_items = Column(JSON, default=list)
    sample_questions = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ProgressEntry(Base):
    __tablename__ = "progress_entries"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("act_"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    date = Column(DateTime(timezone=True), default=utc_now, index=True)
    mode = Column(String(32), nullable=False, index=True)  # 'reading' | 'exam' | 'interview'
    activity_type = Column(String(64), nullable=False, index=True)
    score = Column(Integer, nullable=True)
    duration_sec = Column(Integer, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="progress_entries")
