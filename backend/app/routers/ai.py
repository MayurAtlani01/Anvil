from typing import List
from fastapi import APIRouter
from app.schemas.ai import (
    SummarizeRequest,
    SummarizeResponse,
    ExplainRequest,
    ExplainResponse,
    TranslateRequest,
    TranslateResponse,
    FlashcardGenerateRequest,
    GeneratedFlashcardItem,
    EvaluateAnswerRequest,
    AnswerFeedbackResponse,
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api", tags=["AI Integration"])


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_content(body: SummarizeRequest):
    """Summarize text content with key takeaways and read time estimation.
    Returns 503 if AI is not configured.
    """
    return await ai_service.summarize(text=body.text, title=body.title)


@router.post("/explain", response_model=ExplainResponse)
async def explain_concept(body: ExplainRequest):
    """Generate technical explanation, ELI5 simplification, practical examples, and related concepts.
    Returns 503 if AI is not configured.
    """
    return await ai_service.explain(text=body.text, context=body.context)


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(body: TranslateRequest):
    """Translate text to target language.
    Returns 503 if AI is not configured.
    """
    return await ai_service.translate(text=body.text, target_lang=body.targetLang)


@router.post("/flashcards/generate", response_model=List[GeneratedFlashcardItem])
async def generate_flashcards(body: FlashcardGenerateRequest):
    """Extract key flashcards from text.
    Returns 503 if AI is not configured.
    """
    return await ai_service.generate_flashcards(text=body.text, count=body.count or 2)


@router.post("/interview/evaluate", response_model=AnswerFeedbackResponse)
async def evaluate_interview_answer(body: EvaluateAnswerRequest):
    """Evaluate candidate interview answer against rubrics.
    Returns 503 if AI is not configured.
    """
    return await ai_service.evaluate_answer(
        question_title=body.questionTitle,
        question_prompt=body.questionPrompt,
        answer_text=body.answerText,
        rubrics=body.rubrics,
    )
