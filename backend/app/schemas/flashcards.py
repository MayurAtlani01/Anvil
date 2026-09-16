from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

Mode = Literal["reading", "interview", "exam"]
DifficultyLevel = Literal["easy", "medium", "hard"]
ContentType = Literal["question", "article", "note", "formula"]


class FlashcardCreate(BaseModel):
    front: str
    back: str
    deckId: Optional[str] = Field("default", alias="deckId")
    sourceUrl: Optional[str] = Field(None, alias="sourceUrl")
    sourceMode: Optional[Mode] = Field("reading", alias="sourceMode")
    contentType: Optional[ContentType] = Field("note", alias="contentType")
    difficulty: Optional[DifficultyLevel] = "medium"

    model_config = ConfigDict(populate_by_name=True)


class FlashcardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    deckId: Optional[str] = Field(None, alias="deckId")
    difficulty: Optional[DifficultyLevel] = None

    model_config = ConfigDict(populate_by_name=True)


class FlashcardReviewInput(BaseModel):
    rating: Literal[1, 2, 3, 4, 5]


class FlashcardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    front: str
    back: str
    deckId: Optional[str] = Field(None, alias="deck_id", serialization_alias="deckId")
    sourceUrl: Optional[str] = Field(None, alias="source_url", serialization_alias="sourceUrl")
    sourceMode: str = Field(..., alias="source_mode", serialization_alias="sourceMode")
    contentType: Optional[str] = Field(None, alias="content_type", serialization_alias="contentType")
    difficulty: str = "medium"
    interval: int = 1
    repetition: int = 0
    easeFactor: float = Field(2.5, alias="ease_factor", serialization_alias="easeFactor")
    nextReviewDate: datetime = Field(..., alias="next_review_date", serialization_alias="nextReviewDate")
    createdAt: datetime = Field(..., alias="created_at", serialization_alias="createdAt")
    updatedAt: datetime = Field(..., alias="updated_at", serialization_alias="updatedAt")
