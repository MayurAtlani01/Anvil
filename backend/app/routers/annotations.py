from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Annotation, User
from app.dependencies.auth import get_optional_user
from app.schemas.annotations import AnnotationCreate, AnnotationResponse

router = APIRouter(prefix="/api/annotations", tags=["Annotations"])


@router.get("", response_model=List[AnnotationResponse])
def list_annotations(
    url: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """List annotations, optionally filtered by URL."""
    query = db.query(Annotation)
    if current_user:
        query = query.filter(Annotation.user_id == current_user.id)

    if url and url.strip():
        clean_url = url.split("#")[0].split("?")[0].strip()
        query = query.filter(Annotation.url.contains(clean_url))

    return query.order_by(Annotation.created_at.desc()).all()


@router.post("", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
def create_annotation(
    ann_in: AnnotationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Create a new highlight/annotation."""
    new_ann = Annotation(
        user_id=current_user.id if current_user else None,
        url=ann_in.url,
        text=ann_in.text,
        note_id=ann_in.noteId,
        color=ann_in.color or "yellow",
        range_info=ann_in.rangeInfo,
    )
    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)
    return new_ann


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_annotations_for_url(
    url: str = Query(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Clear all annotations for a specific URL."""
    clean_url = url.split("#")[0].split("?")[0].strip()
    query = db.query(Annotation).filter(Annotation.url.contains(clean_url))
    if current_user:
        query = query.filter(Annotation.user_id == current_user.id)

    query.delete(synchronize_session=False)
    db.commit()
    return None


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_annotation(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Annotation).filter(Annotation.id == id)
    if current_user:
        query = query.filter(Annotation.user_id == current_user.id)
    ann = query.first()
    if not ann:
        raise HTTPException(status_code=404, detail="Annotation not found")
    db.delete(ann)
    db.commit()
    return None
