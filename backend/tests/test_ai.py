def test_unconfigured_ai_returns_clean_503_and_no_mock_data(client):
    """Verify that when AI_API_KEY is not configured in backend environment,

    endpoints return a clean HTTP 503 error rather than returning fake/mock data.
    """
    # 1. Summarize
    res_sum = client.post(
        "/api/summarize",
        json={"text": "A quick brown fox jumps over the lazy dog.", "title": "Fox"},
    )
    assert res_sum.status_code == 503
    assert "AI service is not configured" in res_sum.json()["detail"]

    # 2. Explain
    res_exp = client.post(
        "/api/explain",
        json={"text": "Quantum entanglement"},
    )
    assert res_exp.status_code == 503
    assert "AI service is not configured" in res_exp.json()["detail"]

    # 3. Translate
    res_trans = client.post(
        "/api/translate",
        json={"text": "Hello world", "targetLang": "French"},
    )
    assert res_trans.status_code == 503
    assert "AI service is not configured" in res_trans.json()["detail"]

    # 4. Flashcard generation
    res_fc = client.post(
        "/api/flashcards/generate",
        json={"text": "Spaced repetition is an evidence-based learning technique.", "count": 2},
    )
    assert res_fc.status_code == 503
    assert "AI service is not configured" in res_fc.json()["detail"]

    # 5. Resume analysis
    res_res = client.post(
        "/api/interview/resume/analyze",
        json={"fileName": "resume.pdf", "fileContent": "Sample text"},
    )
    assert res_res.status_code == 503
    assert "AI Service is not configured" in res_res.json()["detail"]
