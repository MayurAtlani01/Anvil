def test_mode_isolation_exam_vs_interview(client):
    # 1. Create an Exam question
    exam_q = client.post(
        "/api/exam/pyqs",
        json={
            "title": "Solve Recurrence Relation via Master Theorem",
            "prompt": "T(n) = 2T(n/2) + O(n). Find asymptotic complexity.",
            "category": "math",
            "subject": "Computer Science",
            "topic": "Algorithms",
            "difficulty": "medium",
            "year": 2024,
            "tags": ["dsa", "recurrence"],
        },
    )
    assert exam_q.status_code == 201
    exam_q_id = exam_q.json()["id"]

    # 2. Create an Interview question
    interview_q = client.post(
        "/api/interview/questions",
        json={
            "title": "Design a Distributed Rate Limiter",
            "prompt": "Design a low-latency rate limiter handling 100k requests/sec across 5 global regions.",
            "category": "system_design",
            "difficulty": "hard",
            "tags": ["system_design", "redis", "concurrency"],
        },
    )
    assert interview_q.status_code == 201
    interview_q_id = interview_q.json()["id"]

    # 3. Query Exam PYQs: MUST contain exam question, MUST NOT contain interview question
    exam_list = client.get("/api/exam/pyqs").json()
    exam_ids = [q["id"] for q in exam_list]
    assert exam_q_id in exam_ids
    assert interview_q_id not in exam_ids

    # 4. Query Interview Questions: MUST contain interview question, MUST NOT contain exam question
    interview_list = client.get("/api/interview/questions").json()
    interview_ids = [q["id"] for q in interview_list]
    assert interview_q_id in interview_ids
    assert exam_q_id not in interview_ids


def test_exam_formulas_and_revision_notes(client):
    # Add formula
    f_res = client.post(
        "/api/exam/formulas",
        json={
            "name": "Bayes' Theorem",
            "subject": "Probability",
            "topic": "Bayesian Inference",
            "formula": "P(A|B) = [P(B|A) * P(A)] / P(B)",
            "explanation": "Calculates conditional probability of event A given event B.",
            "variables": [
                {"symbol": "P(A|B)", "meaning": "Posterior probability"},
                {"symbol": "P(B|A)", "meaning": "Likelihood"},
            ],
            "example": "Medical diagnostic screening test accuracy calculation.",
            "difficulty": "medium",
        },
    )
    assert f_res.status_code == 201
    assert f_res.json()["name"] == "Bayes' Theorem"

    # Query formulas
    f_list = client.get("/api/exam/formulas").json()
    assert any(f["name"] == "Bayes' Theorem" for f in f_list)

    # Query subjects and topics
    subjects = client.get("/api/exam/subjects").json()
    assert "Probability" in subjects

    topics = client.get("/api/exam/topics").json()
    assert "Bayesian Inference" in topics


def test_interview_session_flow(client):
    # Start interview session
    start_res = client.post(
        "/api/interview/sessions",
        json={"roundId": "round-dsa", "difficulty": "medium"},
    )
    assert start_res.status_code == 201
    sess = start_res.json()
    sess_id = sess["id"]
    assert sess["status"] == "in_progress"
    assert len(sess["questions"]) > 0

    first_q_id = sess["questions"][0]["id"]

    # Submit answer
    ans_res = client.post(
        f"/api/interview/sessions/{sess_id}/answer",
        json={
            "questionId": first_q_id,
            "answerText": "I would use a two-pointer sliding window technique maintaining an invariant where left pointer advances whenever window constraint violates.",
        },
    )
    assert ans_res.status_code == 200
    updated_sess = ans_res.json()
    assert len(updated_sess["answers"]) == 1
    assert "feedback" in updated_sess["answers"][0]

    # Finish session
    fin_res = client.post(f"/api/interview/sessions/{sess_id}/finish")
    assert fin_res.status_code == 200
    fin_sess = fin_res.json()
    assert fin_sess["status"] == "completed"
    assert "overallFeedback" in fin_sess
    assert fin_sess["overallFeedback"]["totalScore"] > 0


def test_progress_stats_recording(client):
    # Record learning activity
    act_res = client.post(
        "/api/progress/activity",
        json={
            "mode": "reading",
            "activityType": "read_article",
            "durationSec": 300,
            "score": 100,
            "metadata": {"title": "Distributed Systems Primer"},
        },
    )
    assert act_res.status_code == 201

    # Get stats
    stats_res = client.get("/api/progress/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["totalStudyTimeMinutes"] >= 5
    assert len(stats["recentActivity"]) >= 1
