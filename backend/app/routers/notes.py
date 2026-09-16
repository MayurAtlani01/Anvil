from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Note, User
from app.dependencies.auth import get_optional_user
from app.schemas.notes import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter(prefix="/api/notes", tags=["Notes"])


@router.get("", response_model=List[NoteResponse])
def list_notes(
    url: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """List notes, optionally filtered by page URL."""
    query = db.query(Note)
    if current_user:
        query = query.filter(Note.user_id == current_user.id)

    if url and url.strip():
        clean_url = url.split("#")[0].split("?")[0].strip()
        query = query.filter(Note.url.contains(clean_url))

    notes = query.order_by(Note.created_at.desc()).all()
    return notes


@router.get("/search", response_model=List[NoteResponse])
def search_notes(
    q: str = Query(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Search notes by content, page title, or tags."""
    query = db.query(Note)
    if current_user:
        query = query.filter(Note.user_id == current_user.id)

    term = f"%{q.strip().lower()}%"
    query = query.filter(
        (Note.content.ilike(term))
        | (Note.page_title.ilike(term))
        | (Note.selection_text.ilike(term))
    )
    return query.order_by(Note.created_at.desc()).all()


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    note_in: NoteCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Create a new note."""
    new_note = Note(
        user_id=current_user.id if current_user else None,
        url=note_in.url,
        page_title=note_in.pageTitle or "Web Page Note",
        selection_text=note_in.selectionText,
        content=note_in.content,
        color=note_in.color or "#e0e7ff",
        tags=note_in.tags,
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


@router.get("/{id}", response_model=NoteResponse)
def get_note(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Note).filter(Note.id == id)
    if current_user:
        query = query.filter(Note.user_id == current_user.id)
    note = query.first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/{id}", response_model=NoteResponse)
def update_note(
    id: str,
    note_in: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Note).filter(Note.id == id)
    if current_user:
        query = query.filter(Note.user_id == current_user.id)
    note = query.first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note_in.pageTitle is not None:
        note.page_title = note_in.pageTitle
    if note_in.selectionText is not None:
        note.selection_text = note_in.selectionText
    if note_in.content is not None:
        note.content = note_in.content
    if note_in.color is not None:
        note.color = note_in.color
    if note_in.tags is not None:
        note.tags = note_in.tags

    db.commit()
    db.refresh(note)
    return note


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Note).filter(Note.id == id)
    if current_user:
        query = query.filter(Note.user_id == current_user.id)
    note = query.first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return None
