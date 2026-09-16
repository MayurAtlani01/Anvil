from typing import Any, Dict, List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

DifficultyLevel = Literal["easy", "medium", "hard"]
ExamCategory = Literal["dsa", "technical", "hr", "system_design", "math", "physics", "cs", "general"]


class QuestionCreate(BaseModel):
    title: str
    prompt: str
    description: Optional[str] = None
    mode: Literal["interview", "exam"] = "exam"
    category: ExamCategory = "general"
    subject: Optional[str] = None
    topic: Optional[str] = None
    year: Optional[int] = None
    difficulty: DifficultyLevel = "medium"
    tags: List[str] = Field(default_factory=list)
    hints: Optional[List[str]] = None
    sampleAnswer: Optional[str] = Field(None, alias="sampleAnswer")
    rubrics: Optional[List[str]] = None
    formulas: Optional[List[str]] = None
    frequencyRank: Optional[int] = Field(None, alias="frequencyRank")
    options: Optional[List[str]] = None
    correctAnswer: Optional[str] = Field(None, alias="correctAnswer")
    codeSnippet: Optional[str] = Field(None, alias="codeSnippet")

    model_config = ConfigDict(populate_by_name=True)


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    prompt: str
    description: Optional[str] = None
    mode: str = "exam"
    category: str = "general"
    subject: Optional[str] = None
    topic: Optional[str] = None
    year: Optional[int] = None
    difficulty: str = "medium"
    tags: List[str] = Field(default_factory=list)
    hints: Optional[List[str]] = None
    sampleAnswer: Optional[str] = Field(None, alias="sample_answer", serialization_alias="sampleAnswer")
    rubrics: Optional[List[str]] = None
    formulas: Optional[List[str]] = None
    frequencyRank: Optional[int] = Field(None, alias="frequency_rank", serialization_alias="frequencyRank")
    options: Optional[List[str]] = None
    correctAnswer: Optional[str] = Field(None, alias="correct_answer", serialization_alias="correctAnswer")
    codeSnippet: Optional[str] = Field(None, alias="code_snippet", serialization_alias="codeSnippet")


class FormulaVariable(BaseModel):
    symbol: str
    meaning: str


class FormulaCreate(BaseModel):
    name: str
    subject: str
    topic: str
    formula: str
    explanation: str
    variables: List[FormulaVariable] = Field(default_factory=list)
    example: str
    difficulty: Optional[DifficultyLevel] = "medium"

    model_config = ConfigDict(populate_by_name=True)


class FormulaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    subject: str
    topic: str
    formula: str
    explanation: str
    variables: List[Dict[str, Any]] = Field(default_factory=list)
    example: str
    difficulty: Optional[str] = None


class RevisionNoteCreate(BaseModel):
    title: str
    subject: str
    topic: str
    summary: str
    keyPoints: List[str] = Field(default_factory=list, alias="keyPoints")
    codeOrSnippet: Optional[str] = Field(None, alias="codeOrSnippet")
    importantFormulas: Optional[List[str]] = Field(None, alias="importantFormulas")

    model_config = ConfigDict(populate_by_name=True)


class RevisionNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    subject: str
    topic: str
    summary: str
    keyPoints: List[str] = Field(default_factory=list, alias="key_points", serialization_alias="keyPoints")
    codeOrSnippet: Optional[str] = Field(None, alias="code_or_snippet", serialization_alias="codeOrSnippet")
    importantFormulas: Optional[List[str]] = Field(None, alias="important_formulas", serialization_alias="importantFormulas")


class FrequentlyAskedTopicResponse(BaseModel):
    topic: str
    subject: str
    count: int
    weight: int
