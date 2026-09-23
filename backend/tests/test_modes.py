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


def test_anvil_library_vs_my_pyqs_and_formulas(client):
    # 1. Add PYQ
    pyq_res = client.post(
        "/api/exam/pyqs",
        json={
            "title": "Merge Sort Invariant",
            "prompt": "Explain divide-and-conquer invariant for 2-way merge sort.",
            "subject": "Algorithms",
            "topic": "Sorting",
            "difficulty": "easy",
        },
    )
    assert pyq_res.status_code == 201
    pyq_data = pyq_res.json()
    assert "isLibrary" in pyq_data

    # Library filter vs My filter
    lib_pyqs = client.get("/api/exam/pyqs?scope=library").json()
    assert isinstance(lib_pyqs, list)

    # 2. Add Formula
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
    f_data = f_res.json()
    assert "isLibrary" in f_data

    # Query formulas library endpoint
    lib_formulas = client.get("/api/exam/formulas/library").json()
    assert isinstance(lib_formulas, list)

    # Query subjects and topics
    subjects = client.get("/api/exam/subjects").json()
    assert "Probability" in subjects

    topics = client.get("/api/exam/topics").json()
    assert "Bayesian Inference" in topics


def test_student_owned_revision_notes(client):
    # Add revision note
    note_res = client.post(
        "/api/exam/revision-notes",
        json={
            "title": "CAP Theorem Cheat Sheet",
            "subject": "Distributed Systems",
            "topic": "Consistency",
            "summary": "Tradeoffs between Consistency, Availability, and Partition tolerance.",
            "keyPoints": ["Network partitions are inevitable in real networks.", "Choose CP or AP."],
        },
    )
    assert note_res.status_code == 201
    note_id = note_res.json()["id"]

    # List notes
    notes = client.get("/api/exam/revision-notes").json()
    assert any(n["id"] == note_id for n in notes)


def test_exam_and_interview_bookmarks_isolation(client):
    # 1. Create an Exam question
    eq = client.post(
        "/api/exam/pyqs",
        json={
            "title": "Dijkstra Shortest Path",
            "prompt": "Find shortest path from source to all vertices with non-negative weights.",
            "subject": "Computer Science",
            "topic": "Graphs",
        },
    ).json()

    # 2. Create an Interview question
    iq = client.post(
        "/api/interview/questions",
        json={
            "title": "Explain Consistent Hashing",
            "prompt": "How does consistent hashing minimize remapping during node failures?",
            "category": "system_design",
        },
    ).json()

    # 3. Bookmark Exam question
    bm_exam = client.post(
        "/api/bookmarks",
        json={
            "title": eq["title"],
            "url": f"anvil://exam/question/{eq['id']}",
            "snippet": eq["prompt"],
            "contentType": "question",
            "contentId": eq["id"],
        },
    )
    assert bm_exam.status_code == 201

    # 4. Bookmark Interview question
    bm_interview = client.post(
        "/api/bookmarks",
        json={
            "title": iq["title"],
            "url": f"anvil://interview/question/{iq['id']}",
            "snippet": iq["prompt"],
            "contentType": "question",
            "contentId": iq["id"],
        },
    )
    assert bm_interview.status_code == 201

    # 5. Check Exam isolated bookmarks
    exam_bookmarks = client.get("/api/exam/bookmarks").json()
    exam_bm_content_ids = [b["contentId"] for b in exam_bookmarks]
    assert eq["id"] in exam_bm_content_ids
    assert iq["id"] not in exam_bm_content_ids

    # 6. Check Interview isolated bookmarks
    interview_bookmarks = client.get("/api/interview/bookmarks").json()
    interview_bm_content_ids = [b["contentId"] for b in interview_bookmarks]
    assert iq["id"] in interview_bm_content_ids
    assert eq["id"] not in interview_bm_content_ids


def test_interview_question_generator_zero_mock_503(client):
    # Unconfigured AI key should cleanly raise 503, never returning mock questions
    gen_res = client.post(
        "/api/interview/generate-questions",
        json={
            "content": "A software engineer designing an in-memory key-value cache with LRU eviction.",
            "category": "technical",
            "difficulty": "medium",
            "count": 2,
        },
    )
    assert gen_res.status_code == 503
    assert "AI service is not configured" in gen_res.json()["detail"]


def test_interview_session_flow(client):
    # 1. Ensure at least one actual interview question exists
    q_res = client.post(
        "/api/interview/questions",
        json={
            "title": "Sliding Window Maximum",
            "prompt": "Given an array nums and sliding window size k, return the max sliding window.",
            "category": "dsa",
            "difficulty": "medium",
            "hints": ["Use a monotonic deque"],
        },
    )
    assert q_res.status_code == 201
    q_id = q_res.json()["id"]

    # 2. Start session on actual available questions
    start_res = client.post(
        "/api/interview/sessions",
        json={"category": "dsa", "difficulty": "medium"},
    )
    assert start_res.status_code == 201
    sess = start_res.json()
    sess_id = sess["id"]
    assert sess["status"] == "in_progress"
    assert len(sess["questions"]) > 0

    first_q_id = sess["questions"][0]["id"]

    # 3. Submit answer (without AI key, records cleanly without fake score)
    ans_res = client.post(
        f"/api/interview/sessions/{sess_id}/answer",
        json={
            "questionId": first_q_id,
            "answerText": "I would use a double-ended queue storing indices in decreasing order of element values.",
        },
    )
    assert ans_res.status_code == 200
    updated_sess = ans_res.json()
    assert len(updated_sess["answers"]) == 1

    # 4. Finish session
    fin_res = client.post(f"/api/interview/sessions/{sess_id}/finish")
    assert fin_res.status_code == 200
    fin_sess = fin_res.json()
    assert fin_sess["status"] == "completed"
    assert "overallFeedback" in fin_sess

    # 5. Improvement Stats
    stats_res = client.get("/api/interview/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["totalSessions"] >= 1
    assert stats["completedSessions"] >= 1
    assert stats["totalQuestionsAnswered"] >= 1


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
