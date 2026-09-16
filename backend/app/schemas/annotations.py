from typing import Any, Dict, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

AnnotationColor = Literal["yellow", "green", "blue", "purple", "pink"]


class AnnotationCreate(BaseModel):
    url: str
    text: str
    noteId: Optional[str] = Field(None, alias="noteId")
    color: Optional[AnnotationColor] = "yellow"
    rangeInfo: Optional[Dict[str, Any]] = Field(None, alias="rangeInfo")

    model_config = ConfigDict(populate_by_name=True)


class AnnotationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    url: str
    text: str
    noteId: Optional[str] = Field(None, alias="note_id", serialization_alias="noteId")
    color: str = "yellow"
    rangeInfo: Optional[Dict[str, Any]] = Field(None, alias="range_info", serialization_alias="rangeInfo")
    createdAt: datetime = Field(..., alias="created_at", serialization_alias="createdAt")
