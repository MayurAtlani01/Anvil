from typing import Any, Dict, List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.exam import QuestionResponse

DifficultyLevel = Literal["easy", "medium", "hard"]
InterviewCategory = Literal["dsa", "technical", "hr", "system_design", "general"]


class InterviewRoundResponse(BaseModel):
    """Retained for backward compatibility with frontend practice track listings."""
    id: str
    title: str
    category: str
    description: str
    estimatedDurationMin: int = Field(..., serialization_alias="estimatedDurationMin")
    totalQuestions: int = Field(0, serialization_alias="totalQuestions")
    difficulty: str = "medium"
    iconName: Optional[str] = Field(None, serialization_alias="iconName")


class SessionStartRequest(BaseModel):
    category: Optional[str] = "technical"
    topic: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = "medium"
    title: Optional[str] = None
    questionIds: Optional[List[str]] = Field(None, alias="questionIds")
    roundId: Optional[str] = Field(None, alias="roundId")  # for backward-compatibility
    context: Optional[str] = None  # optional screen, document, or role context

    model_config = ConfigDict(populate_by_name=True)


class AnswerFeedback(BaseModel):
    score: Optional[int] = None
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    keyTakeaway: Optional[str] = Field(None, serialization_alias="keyTakeaway")
    suggestedAnswerSnippet: Optional[str] = Field(None, serialization_alias="suggestedAnswerSnippet")


class AnswerEntry(BaseModel):
    questionId: str = Field(..., alias="questionId", serialization_alias="questionId")
    answerText: str = Field(..., alias="answerText", serialization_alias="answerText")
    feedback: Optional[AnswerFeedback] = None

    model_config = ConfigDict(populate_by_name=True)


class OverallFeedback(BaseModel):
    totalScore: Optional[int] = Field(None, serialization_alias="totalScore")
    summary: str
    strengths: List[str] = Field(default_factory=list)
    focusAreas: List[str] = Field(default_factory=list, serialization_alias="focusAreas")
    recommendation: Optional[str] = None


class AnswerSubmitRequest(BaseModel):
    questionId: str = Field(..., alias="questionId")
    answerText: str = Field(..., alias="answerText")

    model_config = ConfigDict(populate_by_name=True)


class InterviewSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    roundId: str = Field(..., alias="round_id", serialization_alias="roundId")
    roundTitle: str = Field(..., alias="round_title", serialization_alias="roundTitle")
    status: str = "in_progress"
    startTime: datetime = Field(..., alias="start_time", serialization_alias="startTime")
    endTime: Optional[datetime] = Field(None, alias="end_time", serialization_alias="endTime")
    currentQuestionIndex: int = Field(0, alias="current_question_index", serialization_alias="currentQuestionIndex")
    questions: List[Dict[str, Any]] = Field(default_factory=list)
    answers: List[Dict[str, Any]] = Field(default_factory=list)
    overallFeedback: Optional[Dict[str, Any]] = Field(None, alias="overall_feedback", serialization_alias="overallFeedback")


class ResumeAnalyzeRequest(BaseModel):
    fileName: str = Field(..., alias="fileName")
    fileContent: str = Field(..., alias="fileContent")
    targetRole: Optional[str] = Field(None, alias="targetRole")

    model_config = ConfigDict(populate_by_name=True)


class ResumeAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    fileName: str = Field(..., alias="file_name", serialization_alias="fileName")
    uploadedAt: datetime = Field(..., alias="uploaded_at", serialization_alias="uploadedAt")
    overallFitScore: int = Field(..., alias="overall_fit_score", serialization_alias="overallFitScore")
    targetRole: str = Field(..., alias="target_role", serialization_alias="targetRole")
    keyStrengths: List[str] = Field(default_factory=list, alias="key_strengths", serialization_alias="keyStrengths")
    skillGaps: List[str] = Field(default_factory=list, alias="skill_gaps", serialization_alias="skillGaps")
    recommendedRounds: List[str] = Field(default_factory=list, alias="recommended_rounds", serialization_alias="recommendedRounds")
    matchingKeywords: List[str] = Field(default_factory=list, alias="matching_keywords", serialization_alias="matchingKeywords")
    suggestedActionItems: List[str] = Field(default_factory=list, alias="suggested_action_items", serialization_alias="suggestedActionItems")
    sampleQuestions: List[str] = Field(default_factory=list, alias="sample_questions", serialization_alias="sampleQuestions")


class QuestionGenerateRequest(BaseModel):
    content: Optional[str] = None  # Text/document context or prompt
    imageBase64: Optional[str] = Field(None, alias="imageBase64")  # Base64 screen capture or image
    category: Optional[str] = "technical"
    difficulty: Optional[DifficultyLevel] = "medium"
    count: Optional[int] = 3

    model_config = ConfigDict(populate_by_name=True)


class InterviewCategoryMetric(BaseModel):
    totalQuestionsAnswered: int = Field(0, serialization_alias="totalQuestionsAnswered")
    averageScore: Optional[float] = Field(None, serialization_alias="averageScore")


class InterviewStatsResponse(BaseModel):
    totalSessions: int = Field(0, serialization_alias="totalSessions")
    completedSessions: int = Field(0, serialization_alias="completedSessions")
    totalQuestionsAnswered: int = Field(0, serialization_alias="totalQuestionsAnswered")
    averageScore: Optional[float] = Field(None, serialization_alias="averageScore")
    categoryMetrics: Dict[str, InterviewCategoryMetric] = Field(default_factory=dict, serialization_alias="categoryMetrics")
    recentSessions: List[Dict[str, Any]] = Field(default_factory=list, serialization_alias="recentSessions")
