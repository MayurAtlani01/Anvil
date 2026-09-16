from typing import Any, Dict, List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

Mode = Literal["reading", "exam", "interview"]


class ProgressEntryCreate(BaseModel):
    mode: Mode
    activityType: str = Field(..., alias="activityType")
    score: Optional[int] = None
    durationSec: Optional[int] = Field(None, alias="durationSec")
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)


class ProgressEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    date: datetime
    mode: str
    activityType: str = Field(..., alias="activity_type", serialization_alias="activityType")
    score: Optional[int] = None
    durationSec: Optional[int] = Field(None, alias="duration_sec", serialization_alias="durationSec")
    metadata: Optional[Dict[str, Any]] = Field(None, alias="metadata_json", serialization_alias="metadata")


class TopicPerformance(BaseModel):
    topic: str
    category: str
    total: int
    correct: int
    accuracy: float


class ProgressStatsResponse(BaseModel):
    totalStudyTimeMinutes: int = Field(..., serialization_alias="totalStudyTimeMinutes")
    streakDays: int = Field(..., serialization_alias="streakDays")
    lastActiveDate: str = Field(..., serialization_alias="lastActiveDate")
    cardsReviewed: int = Field(..., serialization_alias="cardsReviewed")
    cardsDueToday: int = Field(..., serialization_alias="cardsDueToday")
    questionsSolved: int = Field(..., serialization_alias="questionsSolved")
    interviewsCompleted: int = Field(..., serialization_alias="interviewsCompleted")
    accuracyRate: float = Field(..., serialization_alias="accuracyRate")
    recentActivity: List[ProgressEntryResponse] = Field(default_factory=list, serialization_alias="recentActivity")
    topicPerformance: List[TopicPerformance] = Field(default_factory=list, serialization_alias="topicPerformance")
