"""
app/routers/tokens.py
─────────────────────
MedToken API endpoint'leri.

Endpoints:
  GET  /api/tokens/balance          → Giriş yapan kullanıcının bakiyesi
  GET  /api/tokens/history          → İşlem geçmişi (son 50)
  GET  /api/tokens/leaderboard      → En çok token kazanan hekimler (top 10)
  POST /api/tokens/thank-you/{user_id} → Hekime Teşekkür Et (5 MED transfer)
  POST /api/tokens/admin/award      → Admin manuel ödül (sadece admin)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db import get_db
from app.models import User, TokenBalance, TokenTransaction, UserRole
from app.services.token_service import on_thank_you, on_admin_award, _get_or_create_balance
import app.auth as auth

router = APIRouter(prefix="/api/tokens", tags=["DeSci / MedToken"])


# ─────────────────────────────────────────────
# PYDANTIC SCHEMAS
# ─────────────────────────────────────────────

class TokenBalanceOut(BaseModel):
    user_id: int
    balance: int
    academic_score: int
    total_earned: int
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenTransactionOut(BaseModel):
    id: int
    tx_type: str
    amount: int
    description: Optional[str]
    related_post_id: Optional[int]
    onchain_tx_hash: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    user_id: int
    name: str
    title: Optional[str]
    specialty: Optional[str]
    balance: int
    academic_score: int
    total_earned: int


class AdminAwardRequest(BaseModel):
    user_id: int
    amount: int
    description: str


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/balance", response_model=TokenBalanceOut)
def get_my_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    """Giriş yapan kullanıcının MedToken bakiyesini döner."""
    balance = db.query(TokenBalance).filter(TokenBalance.user_id == current_user.id).first()
    if not balance:
        # İlk kez sorgulanıyorsa sıfır bakiye döndür (kayıt oluşturma)
        balance = TokenBalance(
            user_id=current_user.id,
            balance=0,
            academic_score=0,
            total_earned=0,
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)
    return balance


@router.get("/history", response_model=list[TokenTransactionOut])
def get_my_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    """Kullanıcının son token işlemlerini döner (varsayılan: son 50)."""
    txs = (
        db.query(TokenTransaction)
        .filter(TokenTransaction.user_id == current_user.id)
        .order_by(desc(TokenTransaction.created_at))
        .limit(limit)
        .all()
    )
    return txs


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(auth.get_current_user),
):
    """Token miktarına göre sıralanmış en iyi hekimleri döner."""
    results = (
        db.query(TokenBalance, User)
        .join(User, User.id == TokenBalance.user_id)
        .order_by(desc(TokenBalance.balance))
        .limit(limit)
        .all()
    )
    return [
        LeaderboardEntry(
            user_id=user.id,
            name=user.name,
            title=user.title,
            specialty=user.specialty,
            balance=bal.balance,
            academic_score=bal.academic_score,
            total_earned=bal.total_earned,
        )
        for bal, user in results
    ]


@router.post("/thank-you/{receiver_id}", status_code=status.HTTP_200_OK)
def send_thank_you(
    receiver_id: int,
    post_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    """
    Bir hekime 'Teşekkür Et' gönder.
    Gönderen: -5 MED / Alan: +5 MED
    """
    if receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinize teşekkür gönderemezsiniz.")

    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    # Bakiye kontrolü
    from app.services.token_service import _get_or_create_balance
    sender_balance = _get_or_create_balance(db, current_user.id)
    if sender_balance.balance < 5:
        raise HTTPException(
            status_code=400,
            detail="Yetersiz bakiye. Teşekkür göndermek için en az 5 MED gereklidir."
        )

    on_thank_you(db=db, sender_id=current_user.id, receiver_id=receiver_id, post_id=post_id)
    db.commit()

    return {
        "message": f"Dr. {receiver.name} adlı hekime teşekkürünüz iletildi.",
        "sent": -5,
        "received_by": receiver.name,
    }


@router.post("/admin/award", status_code=status.HTTP_201_CREATED)
def admin_award(
    payload: AdminAwardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    """Admin tarafından manuel token ödülü ver. Sadece admin rolü kullanabilir."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Bu işlem için admin yetkisi gereklidir.")

    target = db.query(User).filter(User.id == payload.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    on_admin_award(
        db=db,
        user_id=payload.user_id,
        amount=payload.amount,
        description=payload.description,
    )
    db.commit()

    return {"message": f"{payload.amount} MED, {target.name} adlı kullanıcıya verildi."}
