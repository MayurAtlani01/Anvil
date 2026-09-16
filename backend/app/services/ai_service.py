import json
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
import httpx

from app.core.config import settings
from app.schemas.ai import (
    SummarizeResponse,
    ExplainResponse,
    TranslateResponse,
    GeneratedFlashcardItem,
    AnswerFeedbackResponse,
)
from app.schemas.interview import ResumeAnalysisResponse


class AIService:
    """Service abstraction for AI features (Summarization, Explanation, Translation, Flashcard generation,

    Interview Answer Evaluation, and Resume Analysis).

    Strict Rule: If AI_API_KEY is not configured, raises a clean HTTP 503 error.
    Zero fake or hardcoded mock data.
    """

    def __init__(self):
        self.api_key = settings.AI_API_KEY
        self.provider = settings.AI_PROVIDER.lower()
        self.model = settings.AI_MODEL

    def _ensure_configured(self) -> None:
        if not self.api_key or not self.api_key.strip():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured. Please provide AI_API_KEY in backend environment variables to enable real AI features.",
            )

    async def _call_llm(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Call external LLM provider if configured."""
        self._ensure_configured()

        if self.provider == "gemini":
            # Call Google Gemini API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
            headers = {"Content-Type": "application/json"}
            payload: Dict[str, Any] = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            if system_instruction:
                payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Gemini API returned error: {res.text}",
                    )
                data = res.json()
                try:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Unexpected response format from Gemini API",
                    )
        elif self.provider in ("openai", "custom"):
            # Call OpenAI-compatible API
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})

            payload = {
                "model": self.model or "gpt-4o-mini",
                "messages": messages,
                "temperature": 0.3,
            }
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"OpenAI API returned error: {res.text}",
                    )
                data = res.json()
                try:
                    return data["choices"][0]["message"]["content"]
                except (KeyError, IndexError):
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Unexpected response format from OpenAI API",
                    )
        else:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail=f"AI Provider '{self.provider}' is not supported yet.",
            )

    async def summarize(self, text: str, title: Optional[str] = None) -> SummarizeResponse:
        self._ensure_configured()
        prompt = (
            f"Please summarize the following article/document:\n\nTitle: {title or 'Document'}\n\n"
            f"Content:\n{text[:15000]}\n\n"
            "Respond ONLY with a JSON object in this exact format:\n"
            "{\n"
            '  "summary": "comprehensive summary string",\n'
            '  "bulletPoints": ["point 1", "point 2", "point 3"],\n'
            '  "keyEntities": ["entity 1", "entity 2"],\n'
            '  "readTimeMin": integer estimated read time\n'
            "}"
        )
        raw_text = await self._call_llm(prompt, "You are a concise academic synthesis AI. Output raw JSON only.")
        clean_json = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(clean_json)
        return SummarizeResponse(**data)

    async def explain(self, text: str, context: Optional[str] = None) -> ExplainResponse:
        self._ensure_configured()
        prompt = (
            f"Please explain this concept clearly:\n\nConcept/Selection:\n{text}\n\n"
            f"Context:\n{context or 'General Study'}\n\n"
            "Respond ONLY with a JSON object in this exact format:\n"
            "{\n"
            '  "explanation": "concise technical explanation",\n'
            '  "simplified": "ELI5 simple explanation",\n'
            '  "practicalExample": "real-world application example",\n'
            '  "relatedConcepts": ["concept A", "concept B"]\n'
            "}"
        )
        raw_text = await self._call_llm(prompt, "You are an expert tutor. Output raw JSON only.")
        clean_json = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(clean_json)
        return ExplainResponse(**data)

    async def translate(self, text: str, target_lang: str) -> TranslateResponse:
        self._ensure_configured()
        prompt = (
            f"Translate the following text into {target_lang}:\n\n{text}\n\n"
            "Respond ONLY with a JSON object in this exact format:\n"
            "{\n"
            f'  "original": "{text}",\n'
            '  "translated": "translated string",\n'
            '  "sourceLang": "detected source language",\n'
            f'  "targetLang": "{target_lang}"\n'
            "}"
        )
        raw_text = await self._call_llm(prompt, "You are a translation assistant. Output raw JSON only.")
        clean_json = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(clean_json)
        return TranslateResponse(**data)

    async def generate_flashcards(self, text: str, count: int = 2) -> List[GeneratedFlashcardItem]:
        self._ensure_configured()
        prompt = (
            f"Extract {count} high-yield flashcards from this text:\n\n{text[:10000]}\n\n"
            "Respond ONLY with a JSON array in this exact format:\n"
            "[\n"
            '  {"front": "question or concept prompt", "back": "concise answer", "difficulty": "medium"}\n'
            "]"
        )
        raw_text = await self._call_llm(prompt, "You are an educational spaced-repetition expert. Output raw JSON only.")
        clean_json = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        items = json.loads(clean_json)
        return [GeneratedFlashcardItem(**item) for item in items]

    async def evaluate_answer(
        self,
        question_title: str,
        question_prompt: str,
        answer_text: str,
        rubrics: Optional[List[str]] = None,
    ) -> AnswerFeedbackResponse:
        self._ensure_configured()
        prompt = (
            f"Evaluate the following candidate response to an interview question:\n\n"
            f"Question: {question_title}\nPrompt: {question_prompt}\n"
            f"Rubrics: {json.dumps(rubrics or [])}\n\n"
            f"Candidate Answer:\n{answer_text}\n\n"
            "Respond ONLY with a JSON object in this exact format:\n"
            "{\n"
            '  "score": integer 0 to 100,\n'
            '  "strengths": ["strength 1", "strength 2"],\n'
            '  "improvements": ["improvement 1"],\n'
            '  "keyTakeaway": "one sentence verdict",\n'
            '  "suggestedAnswerSnippet": "optional model answer excerpt"\n'
            "}"
        )
        raw_text = await self._call_llm(prompt, "You are an engineering interview evaluator. Output raw JSON only.")
        clean_json = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(clean_json)
        return AnswerFeedbackResponse(**data)


ai_service = AIService()
