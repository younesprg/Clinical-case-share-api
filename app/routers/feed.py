"""
Social Feed Router
==================
All endpoints under /feed/ prefix.

Covered features:
  - Posts   : CRUD + like/unlike + bookmark/unbookmark
  - Comments: Create top-level comment or threaded reply
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

import app.models as models
import app.schemas as schemas
import app.auth as auth
from app.db import get_db


router = APIRouter(
    prefix="/feed",
    tags=["Social Feed"],
)


# ══════════════════════════════════════════════════════════════
# POSTS
# ══════════════════════════════════════════════════════════════

@router.post(
    "/posts/",
    response_model=schemas.PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni sosyal paylaşım oluştur",
)
def create_post(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Bir tıp profesyoneli sosyal feed'e yeni paylaşım ekler.
    İsteğe bağlı olarak mevcut bir klinik vakaya (linked_case_id) bağlanabilir.
    """
    # Validate linked case if provided
    if post.linked_case_id:
        case = db.query(models.CasePost).filter(
            models.CasePost.id == post.linked_case_id
        ).first()
        if not case:
            raise HTTPException(
                status_code=404,
                detail="Bağlanmak istenen klinik vaka bulunamadı."
            )

    db_post = models.Post(
        author_id=current_user.id,
        linked_case_id=post.linked_case_id,
        content=post.content,
        image_url=post.image_url,
        category=post.category,
        tags=post.tags,
        status=post.status,
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


@router.get(
    "/posts/",
    response_model=List[schemas.PostResponse],
    summary="Feed'i listele",
)
def get_feed(
    category: Optional[str] = Query(None, description="Uzmanlık alanına göre filtrele"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Tüm sosyal paylaşımları getirir (en yeniden en eskiye).
    İsteğe bağlı olarak category ile filtrelenebilir.
    """
    query = db.query(models.Post).order_by(models.Post.created_at.desc())
    if category:
        query = query.filter(models.Post.category == category)
    return query.offset(skip).limit(limit).all()


@router.get(
    "/posts/{post_id}",
    response_model=schemas.PostResponse,
    summary="Tek paylaşım getir",
)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Paylaşım bulunamadı.")
    return post


@router.patch(
    "/posts/{post_id}",
    response_model=schemas.PostResponse,
    summary="Paylaşımı güncelle (sadece yazar)",
)
def update_post(
    post_id: int,
    updates: schemas.PostUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Paylaşım bulunamadı.")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu paylaşımı düzenleme yetkiniz yok.")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)
    return post


@router.delete(
    "/posts/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Paylaşımı sil (yazar veya admin)",
)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Paylaşım bulunamadı.")
    if post.author_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Bu paylaşımı silme yetkiniz yok.")
    db.delete(post)
    db.commit()


# ══════════════════════════════════════════════════════════════
# LIKES
# ══════════════════════════════════════════════════════════════

@router.post(
    "/posts/{post_id}/like",
    response_model=schemas.PostLikeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Paylaşımı beğen",
)
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Paylaşım bulunamadı.")

    like = models.PostLike(post_id=post_id, user_id=current_user.id)
    db.add(like)
    try:
        db.flush()
        post.likes_count += 1
        db.commit()
        db.refresh(like)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Bu paylaşımı zaten beğendiniz.")
    return like


@router.delete(
    "/posts/{post_id}/like",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Beğeniyi geri al",
)
def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    like = db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id,
        models.PostLike.user_id == current_user.id,
    ).first()
    if not like:
        raise HTTPException(status_code=404, detail="Bu paylaşımı daha önce beğenmediniz.")

    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    db.delete(like)
    if post and post.likes_count > 0:
        post.likes_count -= 1
    db.commit()


# ══════════════════════════════════════════════════════════════
# BOOKMARKS
# ══════════════════════════════════════════════════════════════

@router.post(
    "/posts/{post_id}/bookmark",
    response_model=schemas.PostBookmarkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Paylaşımı kaydet (bookmark)",
)
def bookmark_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Paylaşım bulunamadı.")

    bookmark = models.PostBookmark(post_id=post_id, user_id=current_user.id)
    db.add(bookmark)
    try:
        db.commit()
        db.refresh(bookmark)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Bu paylaşımı zaten kaydettiniz.")
    return bookmark


@router.delete(
    "/posts/{post_id}/bookmark",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Kaydedileni kaldır",
)
def remove_bookmark(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    bookmark = db.query(models.PostBookmark).filter(
        models.PostBookmark.post_id == post_id,
        models.PostBookmark.user_id == current_user.id,
    ).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Kaydedilmiş paylaşım bulunamadı.")
    db.delete(bookmark)
    db.commit()


@router.get(
    "/bookmarks/",
    response_model=List[schemas.PostResponse],
    summary="Kullanıcının kaydettikleri",
)
def get_my_bookmarks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    bookmarks = (
        db.query(models.PostBookmark)
        .filter(models.PostBookmark.user_id == current_user.id)
        .all()
    )
    return [b.post for b in bookmarks]


# ══════════════════════════════════════════════════════════════
# COMMENTS
# ══════════════════════════════════════════════════════════════

@router.post(
    "/posts/{post_id}/comments/",
    response_model=schemas.PostCommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yorum yap (veya thread yanıtı)",
)
def create_comment(
    post_id: int,
    comment: schemas.PostCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Bir paylaşıma yorum ekler.
    parent_comment_id göndererek var olan bir yoruma yanıt (thread) oluşturabilirsiniz.
    """
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Paylaşım bulunamadı.")

    # Validate parent comment belongs to the same post
    if comment.parent_comment_id:
        parent = db.query(models.PostComment).filter(
            models.PostComment.id == comment.parent_comment_id,
            models.PostComment.post_id == post_id,
        ).first()
        if not parent:
            raise HTTPException(
                status_code=404,
                detail="Yanıtlanmak istenen yorum bu paylaşımda bulunamadı."
            )

    db_comment = models.PostComment(
        post_id=post_id,
        author_id=current_user.id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


@router.get(
    "/posts/{post_id}/comments/",
    response_model=List[schemas.PostCommentResponse],
    summary="Paylaşım yorumlarını listele (yalnızca üst düzey)",
)
def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Bir paylaşımın üst düzey yorumlarını (parent_comment_id=None) döndürür.
    Her yorum kendi replies listesiyle gelir (nested thread).
    """
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Paylaşım bulunamadı.")

    return (
        db.query(models.PostComment)
        .filter(
            models.PostComment.post_id == post_id,
            models.PostComment.parent_comment_id == None,  # noqa: E711
        )
        .order_by(models.PostComment.created_at.asc())
        .all()
    )


@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Yorumu sil (yazar veya admin)",
)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    comment = db.query(models.PostComment).filter(
        models.PostComment.id == comment_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")
    if comment.author_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Bu yorumu silme yetkiniz yok.")
    db.delete(comment)
    db.commit()


# ══════════════════════════════════════════════════════════════
# AGREEMENTS (Katılıyorum / Katılmıyorum)
# ══════════════════════════════════════════════════════════════

@router.post(
    "/posts/{post_id}/agree",
    response_model=schemas.PostAgreementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Oy ver (katılıyorum / katılmıyorum)",
)
def vote_post(
    post_id: int,
    vote: schemas.PostAgreementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Bir paylaşıma 'agree' (Katılıyorum) veya 'disagree' (Katılmıyorum) oyu verir.
    - Kullanıcı başına 1 oy hakkı vardır.
    - Farklı bir oy tipi göndererek mevcut oyu değiştirebilirsiniz.
    """
    if vote.vote_type not in ("agree", "disagree"):
        raise HTTPException(
            status_code=400,
            detail="vote_type yalnızca 'agree' veya 'disagree' olabilir."
        )

    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Paylaşım bulunamadı.")

    # Mevcut oy var mı?
    existing = db.query(models.PostAgreement).filter(
        models.PostAgreement.post_id == post_id,
        models.PostAgreement.user_id == current_user.id,
    ).first()

    if existing:
        if existing.vote_type == vote.vote_type:
            raise HTTPException(status_code=409, detail="Bu oyu zaten verdiniz.")
        # Oy tipini değiştir — sayaçları güncelle
        if existing.vote_type == "agree":
            post.agree_count = max(0, post.agree_count - 1)
            post.disagree_count += 1
        else:
            post.disagree_count = max(0, post.disagree_count - 1)
            post.agree_count += 1
        existing.vote_type = vote.vote_type
        db.commit()
        db.refresh(existing)
        return existing

    # Yeni oy oluştur
    new_vote = models.PostAgreement(
        post_id=post_id,
        user_id=current_user.id,
        vote_type=vote.vote_type,
    )
    db.add(new_vote)
    if vote.vote_type == "agree":
        post.agree_count += 1
    else:
        post.disagree_count += 1
    db.commit()
    db.refresh(new_vote)
    return new_vote


@router.delete(
    "/posts/{post_id}/agree",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Oyu geri al",
)
def remove_vote(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Kullanıcının bu paylaşıma verdiği oyu geri alır."""
    vote = db.query(models.PostAgreement).filter(
        models.PostAgreement.post_id == post_id,
        models.PostAgreement.user_id == current_user.id,
    ).first()
    if not vote:
        raise HTTPException(status_code=404, detail="Bu paylaşıma oy vermediniz.")

    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if post:
        if vote.vote_type == "agree":
            post.agree_count = max(0, post.agree_count - 1)
        else:
            post.disagree_count = max(0, post.disagree_count - 1)

    db.delete(vote)
    db.commit()


@router.get(
    "/posts/{post_id}/agreements",
    response_model=List[schemas.PostAgreementResponse],
    summary="Paylaşımın oylarını listele",
)
def get_agreements(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Bir paylaşıma verilen tüm agree/disagree oylarını listeler."""
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Paylaşım bulunamadı.")
    return db.query(models.PostAgreement).filter(
        models.PostAgreement.post_id == post_id
    ).all()

