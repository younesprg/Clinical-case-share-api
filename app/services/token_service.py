"""
app/services/token_service.py
─────────────────────────────
DeSci MedToken ödül servisi.

ÖDÜL KURALLARI:
  • Sadece vaka paylaşmak → token YOK
  • Vaka 5 uzman doğrulaması aldığında (tek seferlik) → +5 MED
  • Yorum 5 uzman "Katılıyorum" onayı aldığında (tek seferlik) → +10 MED
  • Vaka 3 uzman "Nadir Vaka" etiketlediğinde (tek seferlik) → +50 MED bonus
  • "Hekime Teşekkür Et" gönder → -5 MED (gönderen) / +5 MED (alan)
  • Admin manuel ödül → isteğe bağlı miktar
"""

from sqlalchemy.orm import Session
from app.models import TokenBalance, TokenTransaction


# ─────────────────────────────────────────────
# TOKEN MİKTARLARI (Tokenomics)
# ─────────────────────────────────────────────
REWARDS = {
    "validation_first_five":  5,   # Vaka ilk 5. uzman doğrulamasına ulaştığında
    "comment_approved":       10,  # Yorum ilk 5. uzman "Katılıyorum" onayına ulaştığında
    "rare_case_bonus":        50,  # Nadir Vaka etiketlendi (3 uzman onayı)
    "thank_you_sent":         -5,  # Hekime Teşekkür gönderildi (gönderen kaybeder)
    "thank_you_received":      5,  # Hekime Teşekkür alındı
}

# Eşik değerleri — kaç onayda ödül verilsin
VALIDATION_THRESHOLD = 5    # Vaka için: 5 uzman Doğrula → +5 MED (sadece bir kez)
COMMENT_AGREE_THRESHOLD = 5  # Yorum için: 5 uzman Katılıyorum → +10 MED (sadece bir kez)
RARE_CASE_THRESHOLD = 3     # 3 uzman "Nadir Vaka" derse → +50 MED bonus

# Akademik itibar puanı
ACADEMIC_SCORE_VALIDATION = 15   # 5 Doğrulaya ulaşan vaka sahibine
ACADEMIC_SCORE_COMMENT = 10      # 5 Katılıyorum'a ulaşan yorum sahibine
ACADEMIC_SCORE_RARE = 25         # Nadir Vaka sahibine


def _get_or_create_balance(db: Session, user_id: int) -> TokenBalance:
    """Kullanıcının token bakiye kaydını döner; yoksa oluşturur."""
    balance = db.query(TokenBalance).filter(TokenBalance.user_id == user_id).first()
    if not balance:
        balance = TokenBalance(user_id=user_id, balance=0, academic_score=0, total_earned=0)
        db.add(balance)
        db.flush()
    return balance


def award_tokens(
    db: Session,
    user_id: int,
    tx_type: str,
    amount: int,
    description: str,
    related_post_id: int | None = None,
    onchain_tx_hash: str | None = None,
    wallet_address: str | None = None,
) -> TokenTransaction:
    """
    Merkezi token ödül fonksiyonu.
    - TokenBalance günceller
    - TokenTransaction kaydı oluşturur
    - Commit YAPMAZ — çağıran commit eder
    """
    balance = _get_or_create_balance(db, user_id)

    balance.balance += amount
    if amount > 0:
        balance.total_earned += amount

    # Bakiye asla negatife düşmesin
    if balance.balance < 0:
        balance.balance = 0

    tx = TokenTransaction(
        user_id=user_id,
        tx_type=tx_type,
        amount=amount,
        description=description,
        related_post_id=related_post_id,
        onchain_tx_hash=onchain_tx_hash,
        wallet_address=wallet_address,
    )
    db.add(tx)
    return tx


# ─────────────────────────────────────────────
# OLAY BAZLI ÖDÜL FONKSİYONLARI
# ─────────────────────────────────────────────

def on_validation_reached(db: Session, author_id: int, post_id: int) -> TokenTransaction:
    """
    Bir vakanın Doğrula sayısı VALIDATION_THRESHOLD (=5)'e ulaştığında çağrılır.
    Bu ödül SADECE BİR KEZ verilir (çağıran bu kontrolü yapar).
    → +5 MED + Akademik İtibar Puanı
    """
    tx = award_tokens(
        db=db,
        user_id=author_id,
        tx_type="validation_first_five",
        amount=REWARDS["validation_first_five"],
        description="Vakanız 5 uzman doğrulaması aldı",
        related_post_id=post_id,
    )
    balance = _get_or_create_balance(db, author_id)
    balance.academic_score += ACADEMIC_SCORE_VALIDATION
    return tx


def on_comment_approved(db: Session, comment_author_id: int, post_id: int | None = None) -> TokenTransaction:
    """
    Bir yorumun uzman 'Katılıyorum' sayısı COMMENT_AGREE_THRESHOLD (=5)'e ulaştığında çağrılır.
    Bu ödül SADECE BİR KEZ verilir (çağıran bu kontrolü yapar).
    → +10 MED + Akademik İtibar Puanı
    """
    tx = award_tokens(
        db=db,
        user_id=comment_author_id,
        tx_type="comment_approved",
        amount=REWARDS["comment_approved"],
        description="Yorumunuz 5 uzman onayı aldı",
        related_post_id=post_id,
    )
    balance = _get_or_create_balance(db, comment_author_id)
    balance.academic_score += ACADEMIC_SCORE_COMMENT
    return tx


def on_rare_case_bonus(db: Session, author_id: int, post_id: int) -> TokenTransaction:
    """
    Bir vaka RARE_CASE_THRESHOLD (=3) uzman tarafından 'Nadir Vaka' etiketlendiğinde çağrılır.
    Bu ödül SADECE BİR KEZ verilir.
    → +50 MED + Yüksek Akademik İtibar Puanı
    """
    tx = award_tokens(
        db=db,
        user_id=author_id,
        tx_type="rare_case_bonus",
        amount=REWARDS["rare_case_bonus"],
        description="Vakanız 'Nadir Vaka' olarak onaylandı",
        related_post_id=post_id,
    )
    balance = _get_or_create_balance(db, author_id)
    balance.academic_score += ACADEMIC_SCORE_RARE
    return tx


def on_thank_you(
    db: Session,
    sender_id: int,
    receiver_id: int,
    post_id: int | None = None,
) -> tuple[TokenTransaction, TokenTransaction]:
    """
    'Hekime Teşekkür Et' gönderildiğinde çağrılır.
    Gönderen: -5 MED / Alan: +5 MED
    """
    tx_sent = award_tokens(
        db=db,
        user_id=sender_id,
        tx_type="thank_you_sent",
        amount=REWARDS["thank_you_sent"],
        description="Bir hekime teşekkür gönderildi",
        related_post_id=post_id,
    )
    tx_received = award_tokens(
        db=db,
        user_id=receiver_id,
        tx_type="thank_you_received",
        amount=REWARDS["thank_you_received"],
        description="Bir meslektaşınızdan teşekkür aldınız",
        related_post_id=post_id,
    )
    return tx_sent, tx_received


def on_admin_award(db: Session, user_id: int, amount: int, description: str) -> TokenTransaction:
    """Admin tarafından manuel ödül verildiğinde çağrılır."""
    return award_tokens(
        db=db,
        user_id=user_id,
        tx_type="admin_award",
        amount=amount,
        description=description,
    )
