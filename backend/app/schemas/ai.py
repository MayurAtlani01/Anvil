from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict, Field


class SummarizeRequest(BaseModel):
    text: str
    title: Optional[str] = None


class SummarizeResponse(BaseModel):
    summary: str
    bulletPoints: List[str] = Field(default_factory=list, serialization_alias="bulletPoints")
    keyEntities: List[str] = Field(default_factory=list, serialization_alias="keyEntities")
    readTimeMin: int = Field(..., serialization_alias="readTimeMin")


class ExplainRequest(BaseModel):
    text: str
    context: Optional[str] = None


class ExplainResponse(BaseModel):
    explanation: str
    simplified: str
    practicalExample: str = Field(..., serialization_alias="practicalExample")
    relatedConcepts: List[str] = Field(default_factory=list, serialization_alias="relatedConcepts")


class TranslateRequest(BaseModel):
    text: str
    targetLang: str = Field(..., alias="targetLang")

    model_config = ConfigDict(populate_by_name=True)


class TranslateResponse(BaseModel):
    original: str
    translated: str
    sourceLang: str = Field(..., serialization_alias="sourceLang")
    targetLang: str = Field(..., serialization_alias="targetLang")


class FlashcardGenerateRequest(BaseModel):
    text: str
    count: Optional[int] = 2


class GeneratedFlashcardItem(BaseModel):
    front: str
    back: str
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class EvaluateAnswerRequest(BaseModel):
    questionTitle: str = Field(..., alias="questionTitle")
    questionPrompt: str = Field(..., alias="questionPrompt")
    answerText: str = Field(..., alias="answerText")
    rubrics: Optional[List[str]] = None

    model_config = ConfigDict(populate_by_name=True)


class AnswerFeedbackResponse(BaseModel):
    score: int
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    keyTakeaway: str = Field(..., serialization_alias="keyTakeaway")
    suggestedAnswerSnippet: Optional[str] = Field(None, serialization_alias="suggestedAnswerSnippet")
