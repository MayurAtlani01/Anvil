from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NoteCreate(BaseModel):
    url: str
    pageTitle: Optional[str] = Field(None, alias="pageTitle")
    selectionText: Optional[str] = Field(None, alias="selectionText")
    content: str
    color: Optional[str] = "#e0e7ff"
    tags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class NoteUpdate(BaseModel):
    pageTitle: Optional[str] = Field(None, alias="pageTitle")
    selectionText: Optional[str] = Field(None, alias="selectionText")
    content: Optional[str] = None
    color: Optional[str] = None
    tags: Optional[List[str]] = None

    model_config = ConfigDict(populate_by_name=True)


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    url: str
    pageTitle: Optional[str] = Field(None, alias="page_title", serialization_alias="pageTitle")
    selectionText: Optional[str] = Field(None, alias="selection_text", serialization_alias="selectionText")
    content: str
    color: Optional[str] = "#e0e7ff"
    tags: List[str] = Field(default_factory=list)
    createdAt: datetime = Field(..., alias="created_at", serialization_alias="createdAt")
    updatedAt: datetime = Field(..., alias="updated_at", serialization_alias="updatedAt")
