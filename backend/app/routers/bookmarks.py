from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Bookmark, User
from app.dependencies.auth import get_optional_user
from app.schemas.bookmarks import (
    BookmarkCreate,
    BookmarkResponse,
    BookmarkToggleResponse,
)

router = APIRouter(prefix="/api/bookmarks", tags=["Bookmarks"])


@router.get("", response_model=List[BookmarkResponse])
def list_bookmarks(
    contentType: Optional[str] = Query(None, alias="contentType"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """List bookmarks with optional filtering by contentType and search term."""
    query = db.query(Bookmark)
    if current_user:
        query = query.filter(Bookmark.user_id == current_user.id)

    if contentType:
        query = query.filter(Bookmark.content_type == contentType)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            (Bookmark.title.ilike(term)) | (Bookmark.snippet.ilike(term))
        )

    bookmarks = query.order_by(Bookmark.created_at.desc()).all()
    return bookmarks


@router.post("", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    bookmark_in: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Create a new bookmark."""
    new_bookmark = Bookmark(
        user_id=current_user.id if current_user else None,
        title=bookmark_in.title,
        url=bookmark_in.url,
        snippet=bookmark_in.snippet,
        content_type=bookmark_in.contentType,
        content_id=bookmark_in.contentId,
        tags=bookmark_in.tags,
    )
    db.add(new_bookmark)
    db.commit()
    db.refresh(new_bookmark)
    return new_bookmark


@router.get("/check")
def check_bookmark(
    target: str = Query(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Check if a given URL or contentId is already bookmarked."""
    query = db.query(Bookmark)
    if current_user:
        query = query.filter(Bookmark.user_id == current_user.id)

    exists = query.filter(
        (Bookmark.content_id == target) | (Bookmark.url == target)
    ).first() is not None

    return {"isBookmarked": exists}


@router.post("/toggle", response_model=BookmarkToggleResponse)
def toggle_bookmark(
    bookmark_in: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Toggle a bookmark: removes it if it exists, otherwise creates it."""
    query = db.query(Bookmark)
    if current_user:
        query = query.filter(Bookmark.user_id == current_user.id)

    if bookmark_in.contentId:
        existing = query.filter(Bookmark.content_id == bookmark_in.contentId).first()
    else:
        existing = query.filter(
            (Bookmark.url == bookmark_in.url) & (Bookmark.title == bookmark_in.title)
        ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return BookmarkToggleResponse(bookmark=None, isBookmarked=False)
    else:
        created = Bookmark(
            user_id=current_user.id if current_user else None,
            title=bookmark_in.title,
            url=bookmark_in.url,
            snippet=bookmark_in.snippet,
            content_type=bookmark_in.contentType,
            content_id=bookmark_in.contentId,
            tags=bookmark_in.tags,
        )
        db.add(created)
        db.commit()
        db.refresh(created)
        return BookmarkToggleResponse(
            bookmark=BookmarkResponse.model_validate(created),
            isBookmarked=True,
        )


@router.get("/{id}", response_model=BookmarkResponse)
def get_bookmark(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Bookmark).filter(Bookmark.id == id)
    if current_user:
        query = query.filter(Bookmark.user_id == current_user.id)
    bookmark = query.first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return bookmark


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Bookmark).filter(Bookmark.id == id)
    if current_user:
        query = query.filter(Bookmark.user_id == current_user.id)
    bookmark = query.first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()
    return None
