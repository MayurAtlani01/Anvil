def test_bookmarks_crud_flow(client):
    # Empty state returns empty list (NO MOCK DATA)
    empty_res = client.get("/api/bookmarks")
    assert empty_res.status_code == 200
    assert empty_res.json() == []

    # Create bookmark
    payload = {
        "title": "FastAPI Documentation",
        "url": "https://fastapi.tiangolo.com",
        "snippet": "High performance web framework",
        "contentType": "article",
        "tags": ["python", "fastapi"],
    }
    create_res = client.post("/api/bookmarks", json=payload)
    assert create_res.status_code == 201
    bm = create_res.json()
    assert bm["title"] == "FastAPI Documentation"
    assert bm["contentType"] == "article"
    bm_id = bm["id"]

    # Check bookmark
    check_res = client.get("/api/bookmarks/check", params={"target": "https://fastapi.tiangolo.com"})
    assert check_res.status_code == 200
    assert check_res.json()["isBookmarked"] is True

    # Get bookmark by id
    get_res = client.get(f"/api/bookmarks/{bm_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == bm_id

    # Toggle bookmark (should remove it)
    toggle_res = client.post("/api/bookmarks/toggle", json=payload)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["isBookmarked"] is False

    # Check again
    check_after = client.get("/api/bookmarks/check", params={"target": "https://fastapi.tiangolo.com"})
    assert check_after.json()["isBookmarked"] is False


def test_notes_crud_flow(client):
    # Empty state returns empty list
    assert client.get("/api/notes").json() == []

    # Create note
    note_payload = {
        "url": "https://en.wikipedia.org/wiki/Spaced_repetition",
        "pageTitle": "Spaced Repetition",
        "selectionText": "learning technique that incorporates increasing intervals",
        "content": "SM-2 is the foundational algorithm for flashcard spacing.",
        "color": "#e0e7ff",
        "tags": ["memory", "learning"],
    }
    create_res = client.post("/api/notes", json=note_payload)
    assert create_res.status_code == 201
    note = create_res.json()
    note_id = note["id"]
    assert note["content"] == note_payload["content"]

    # Search notes
    search_res = client.get("/api/notes/search", params={"q": "foundational"})
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1
    assert search_res.json()[0]["id"] == note_id

    # Update note
    update_res = client.put(f"/api/notes/{note_id}", json={"content": "Updated content."})
    assert update_res.status_code == 200
    assert update_res.json()["content"] == "Updated content."

    # Delete note
    del_res = client.delete(f"/api/notes/{note_id}")
    assert del_res.status_code == 204

    # Verify deleted
    get_res = client.get(f"/api/notes/{note_id}")
    assert get_res.status_code == 404


def test_flashcards_and_sm2_flow(client):
    # Create flashcard
    fc_payload = {
        "front": "What is Amdahl's Law?",
        "back": "Formula for maximum theoretical speedup of a system when using multiple processors.",
        "deckId": "systems",
        "sourceMode": "exam",
        "difficulty": "hard",
    }
    create_res = client.post("/api/flashcards", json=fc_payload)
    assert create_res.status_code == 201
    fc = create_res.json()
    fc_id = fc["id"]
    assert fc["interval"] == 1
    assert fc["repetition"] == 0
    assert fc["easeFactor"] == 2.5

    # Record successful review (rating 4)
    rev_res = client.post(f"/api/flashcards/{fc_id}/review", json={"rating": 4})
    assert rev_res.status_code == 200
    updated_fc = rev_res.json()
    assert updated_fc["repetition"] == 1
    assert updated_fc["interval"] == 1

    # Record second successful review (rating 4)
    rev_res2 = client.post(f"/api/flashcards/{fc_id}/review", json={"rating": 4})
    assert rev_res2.status_code == 200
    updated_fc2 = rev_res2.json()
    assert updated_fc2["repetition"] == 2
    assert updated_fc2["interval"] == 6

    # Delete flashcard
    assert client.delete(f"/api/flashcards/{fc_id}").status_code == 204
