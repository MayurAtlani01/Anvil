from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

ContentType = Literal["question", "article", "note", "formula"]


class BookmarkCreate(BaseModel):
    title: str
    url: str
    snippet: Optional[str] = None
    contentType: ContentType = Field(..., alias="contentType")
    contentId: Optional[str] = Field(None, alias="contentId")
    tags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class BookmarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    url: str
    snippet: Optional[str] = None
    contentType: str = Field(..., alias="content_type", serialization_alias="contentType")
    contentId: Optional[str] = Field(None, alias="content_id", serialization_alias="contentId")
    tags: List[str] = Field(default_factory=list)
    createdAt: datetime = Field(..., alias="created_at", serialization_alias="createdAt")


class BookmarkToggleResponse(BaseModel):
    bookmark: Optional[BookmarkResponse] = None
    isBookmarked: bool
