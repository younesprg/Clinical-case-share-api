import enum
from datetime import datetime
from datetime import date
from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, Text,
    Table, Enum, Boolean, Date, JSON, DateTime, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base


# ══════════════════════════════════════════════════════════════
# ENUMS
# ══════════════════════════════════════════════════════════════

class UserRole(str, enum.Enum):
    """System-level authorization role — DO NOT CHANGE."""
    DOCTOR = "doctor"
    PATIENT = "patient"
    ADMIN = "admin"


# ══════════════════════════════════════════════════════════════
# ASSOCIATION TABLES
# ══════════════════════════════════════════════════════════════

case_disease_link = Table(
    'case_disease_link',
    Base.metadata,
    Column('case_id', Integer, ForeignKey('cases.id', ondelete="CASCADE"), primary_key=True),
    Column('disease_id', Integer, ForeignKey('diseases.id', ondelete="CASCADE"), primary_key=True)
)


# ══════════════════════════════════════════════════════════════
# USER
# ══════════════════════════════════════════════════════════════

class User(Base):
    __tablename__ = 'users'

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name            = Column(String, index=True, nullable=False)
    tc_kimlik       = Column(String, unique=True, index=True, nullable=True)

    # ── System authorization role (unchanged) ──────────────────
    role            = Column(Enum(UserRole), default=UserRole.PATIENT, nullable=False)

    # ── Physical / demographic data ───────────────────────────
    date_of_birth   = Column(Date, nullable=True)
    gender          = Column(String, nullable=True)   # "Male", "Female"
    height          = Column(Float, nullable=True)    # cm
    weight          = Column(Float, nullable=True)    # kg
    blood_type      = Column(String, nullable=True)   # e.g. "B+"

    title           = Column(String, nullable=True)
    specialty       = Column(String, nullable=True)
    is_active       = Column(Boolean, default=True)

    # ── NEW: Social profile fields ─────────────────────────────
    medical_role    = Column(
        String,
        nullable=True,
        default='medical_student'
    )
    """Social-platform professional title.
    Values: 'medical_student' | 'researcher' | 'resident' | 'specialist'
    Kept separate from `role` to avoid breaking RBAC logic.
    """

    is_verified     = Column(Boolean, default=False, nullable=False)
    """Blue-tick verification for confirmed medical professionals."""

    # ── Blockchain / Wallet ────────────────────────────────────
    wallet_address  = Column(String, nullable=True)
    """MetaMask / Polygon cüzdan adresi (0x...). Opsiyonel — demo ve on-chain transfer için."""

    # ── Relationships ──────────────────────────────────────────
    authored_cases  = relationship(
        "CasePost", foreign_keys="[CasePost.author_id]",
        back_populates="author", cascade="all, delete-orphan"
    )
    patient_profile = relationship(
        "Patient", back_populates="user",
        uselist=False, cascade="all, delete-orphan"
    )

    # Social feed relationships
    posts           = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    post_comments   = relationship("PostComment", back_populates="author", cascade="all, delete-orphan")
    post_likes      = relationship("PostLike", back_populates="user", cascade="all, delete-orphan")
    bookmarks       = relationship("PostBookmark", back_populates="user", cascade="all, delete-orphan")
    agreements      = relationship("PostAgreement", back_populates="user", cascade="all, delete-orphan")
    comment_agrees  = relationship("CommentAgree", back_populates="user", cascade="all, delete-orphan")

    # DeSci / MedToken relationships
    token_balance       = relationship("TokenBalance", back_populates="user", uselist=False, cascade="all, delete-orphan")
    token_transactions  = relationship("TokenTransaction", back_populates="user", cascade="all, delete-orphan", foreign_keys="[TokenTransaction.user_id]")
    validations_given   = relationship("PostValidation", back_populates="validator", cascade="all, delete-orphan", foreign_keys="[PostValidation.validator_id]")

    # Triage
    triage_sessions = relationship("TriageSession", back_populates="user", cascade="all, delete-orphan")


# ══════════════════════════════════════════════════════════════
# PATIENT  (unchanged)
# ══════════════════════════════════════════════════════════════

class Patient(Base):
    __tablename__ = 'patients'

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), unique=True, nullable=False)
    full_name   = Column(String, index=True, nullable=False)
    age         = Column(Integer, nullable=False, default=0)
    gender      = Column(String, nullable=False, default="Bilinmiyor")

    user        = relationship("User", back_populates="patient_profile")
    cases       = relationship("CasePost", back_populates="patient", cascade="all, delete-orphan")


# ══════════════════════════════════════════════════════════════
# DISEASE DICTIONARY  (unchanged)
# ══════════════════════════════════════════════════════════════

class DiseaseDictionary(Base):
    __tablename__ = 'diseases'

    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)


# ══════════════════════════════════════════════════════════════
# BLOOD TEST  (unchanged)
# ══════════════════════════════════════════════════════════════

class BloodTest(Base):
    __tablename__ = 'blood_tests'

    id            = Column(Integer, primary_key=True, index=True)
    case_id       = Column(Integer, ForeignKey('cases.id', ondelete="CASCADE"), unique=True)
    hemoglobin    = Column(Float)
    wbc           = Column(Float)
    platelets     = Column(Float)
    glucose_level = Column(Float, nullable=True)   # YENİ: Kan şekeri grafikleri için

    case          = relationship("CasePost", back_populates="blood_test")


# ══════════════════════════════════════════════════════════════
# CASE POST  (unchanged)
# ══════════════════════════════════════════════════════════════

class CasePost(Base):
    __tablename__ = 'cases'

    id                 = Column(Integer, primary_key=True, index=True)
    author_id          = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    patient_id         = Column(Integer, ForeignKey('patients.id', ondelete="CASCADE"), nullable=False)

    heart_rate         = Column(Integer)
    blood_pressure     = Column(String)
    body_temperature   = Column(Float)
    oxygen_saturation  = Column(Integer, nullable=True)   # YENİ: SpO2

    symptoms           = Column(Text, nullable=False)
    diagnosis          = Column(String)
    treatment_plan     = Column(Text)
    ai_analysis        = Column(JSON, nullable=True)

    author             = relationship("User", foreign_keys=[author_id], back_populates="authored_cases")
    patient            = relationship("Patient", foreign_keys=[patient_id], back_populates="cases")
    blood_test         = relationship("BloodTest", back_populates="case", uselist=False)
    comorbidities      = relationship("DiseaseDictionary", secondary=case_disease_link)

    # Reverse link from social Posts
    linked_posts       = relationship("Post", back_populates="linked_case")


# ══════════════════════════════════════════════════════════════
# ██████  SOCIAL FEED MODULE  ██████
# ══════════════════════════════════════════════════════════════

class Post(Base):
    """Social media feed post. Optionally linked to a formal CasePost."""
    __tablename__ = 'posts'

    id              = Column(Integer, primary_key=True, index=True)
    author_id       = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)

    # ── Optionally attach a formal clinical case ───────────────
    linked_case_id  = Column(
        Integer,
        ForeignKey('cases.id', ondelete="SET NULL"),
        nullable=True
    )

    # ── Content fields ─────────────────────────────────────────
    content         = Column(Text, nullable=False)
    image_url       = Column(String, nullable=True)
    category        = Column(String, nullable=True)   # e.g. 'Kardiyoloji', 'Nöroloji'
    tags            = Column(String, nullable=True)   # comma-separated: '#NadirVaka,#COVID19'
    status          = Column(String, default='tartışılıyor', nullable=False)
    likes_count     = Column(Integer, default=0, nullable=False)
    agree_count     = Column(Integer, default=0, nullable=False)
    disagree_count  = Column(Integer, default=0, nullable=False)
    # DeSci fields
    is_rare_case    = Column(Boolean, default=False, nullable=False)  # Nadir Vaka etiketi
    rare_vote_count = Column(Integer, default=0, nullable=False)      # Kaç uzman nadir dedi
    validation_count = Column(Integer, default=0, nullable=False)     # Doğrula sayacı
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # ── Relationships ──────────────────────────────────────────
    author          = relationship("User", back_populates="posts")
    linked_case     = relationship("CasePost", back_populates="linked_posts")
    comments        = relationship(
        "PostComment", back_populates="post",
        cascade="all, delete-orphan",
        order_by="PostComment.created_at"
    )
    likes           = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    bookmarks       = relationship("PostBookmark", back_populates="post", cascade="all, delete-orphan")
    agreements      = relationship("PostAgreement", back_populates="post", cascade="all, delete-orphan")


class PostComment(Base):
    """Comment (or threaded reply) on a social Post."""
    __tablename__ = 'post_comments'

    id               = Column(Integer, primary_key=True, index=True)
    post_id          = Column(Integer, ForeignKey('posts.id', ondelete="CASCADE"), nullable=False)
    author_id        = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)

    # ── Thread support: top-level comment has parent_comment_id=None ──
    parent_comment_id = Column(
        Integer,
        ForeignKey('post_comments.id', ondelete="CASCADE"),
        nullable=True
    )

    content          = Column(Text, nullable=False)
    agree_count      = Column(Integer, default=0, nullable=False)  # Uzman onay sayacı
    created_at       = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # ── Relationships ──────────────────────────────────────────
    post             = relationship("PostComment", foreign_keys=[post_id], back_populates="comments", overlaps="post,comments")
    author           = relationship("User", back_populates="post_comments")
    replies          = relationship(
        "PostComment",
        foreign_keys=[parent_comment_id],
        back_populates="parent",
        cascade="all, delete-orphan"
    )
    parent           = relationship(
        "PostComment",
        foreign_keys=[parent_comment_id],
        back_populates="replies",
        remote_side=[id]
    )


# Fix PostComment.post relationship — must point to Post, not self
PostComment.post = relationship("Post", foreign_keys=[PostComment.post_id], back_populates="comments")


class CommentAgree(Base):
    """Bir uzman doktorun bir yoruma verdiği 'Katılıyorum' oyu. Kişi başına bir kez."""
    __tablename__ = 'comment_agrees'
    __table_args__ = (
        UniqueConstraint('comment_id', 'user_id', name='uq_commentagree_comment_user'),
    )

    id          = Column(Integer, primary_key=True, index=True)
    comment_id  = Column(Integer, ForeignKey('post_comments.id', ondelete="CASCADE"), nullable=False)
    user_id     = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    comment     = relationship("PostComment", foreign_keys=[comment_id], back_populates="agrees")
    user        = relationship("User", back_populates="comment_agrees")


# PostComment agrees reverse
PostComment.agrees = relationship("CommentAgree", foreign_keys=[CommentAgree.comment_id], cascade="all, delete-orphan")


class PostLike(Base):
    """Tracks which user liked which Post. Prevents duplicate likes."""
    __tablename__ = 'post_likes'
    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_postlike_post_user'),
    )

    id      = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)

    post    = relationship("Post", back_populates="likes")
    user    = relationship("User", back_populates="post_likes")


class PostBookmark(Base):
    """User saves/bookmarks a Post. One bookmark per user per post."""
    __tablename__ = 'post_bookmarks'
    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_bookmark_post_user'),
    )

    id      = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)

    post    = relationship("Post", back_populates="bookmarks")
    user    = relationship("User", back_populates="bookmarks")


class PostAgreement(Base):
    """Tracks agree/disagree votes on a Post. One vote per user per post."""
    __tablename__ = 'post_agreements'
    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_agreement_post_user'),
    )

    id         = Column(Integer, primary_key=True, index=True)
    post_id    = Column(Integer, ForeignKey('posts.id', ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    vote_type  = Column(String, nullable=False)   # 'agree' | 'disagree'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    post = relationship("Post", back_populates="agreements")
    user = relationship("User", back_populates="agreements")


# ══════════════════════════════════════════════════════════════
# TRIAGE (Triyaj Bot) MODULE
# ══════════════════════════════════════════════════════════════

class TriageSession(Base):
    """24-saatlik triyaj bot sohbet oturumu. Kullanıcı başına."""
    __tablename__ = 'triage_sessions'

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)  # created_at + 24 saat

    user       = relationship("User", back_populates="triage_sessions")
    messages   = relationship(
        "TriageMessage", back_populates="session",
        cascade="all, delete-orphan",
        order_by="TriageMessage.created_at"
    )


class TriageMessage(Base):
    """Tek bir sohbet mesajı (kullanıcı ya da bot). TriageSession'a bağlı."""
    __tablename__ = 'triage_messages'

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('triage_sessions.id', ondelete="CASCADE"), nullable=False, index=True)
    role       = Column(String, nullable=False)   # 'user' | 'assistant'
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session    = relationship("TriageSession", back_populates="messages")


# ══════════════════════════════════════════════════════════════
# ██████  DeSci / MedToken MODULE  ██████
# ══════════════════════════════════════════════════════════════

class TokenBalance(Base):
    """Each user has exactly one token balance record (created on first award)."""
    __tablename__ = 'token_balances'

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), unique=True, nullable=False)
    balance         = Column(Integer, default=0, nullable=False)          # Current MED balance
    academic_score  = Column(Integer, default=0, nullable=False)          # Academic reputation points
    total_earned    = Column(Integer, default=0, nullable=False)          # All-time earned tokens
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="token_balance")


class TokenTransaction(Base):
    """Immutable log of every token movement (earn or spend)."""
    __tablename__ = 'token_transactions'

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)

    # Transaction type — what triggered this?
    tx_type         = Column(String, nullable=False)
    # Values:
    #   'post_published'        → +10 MED  (vaka paylaşıldı)
    #   'validation_milestone'  → +25 MED  (5. Doğrula onayı alındı)
    #   'rare_case_bonus'       → +50 MED  (Nadir Vaka etiketlendi)
    #   'thank_you_sent'        → -5 MED   (Hekime Teşekkür gönderildi)
    #   'thank_you_received'    → +5 MED   (Teşekkür alındı)
    #   'admin_award'           → manuel ödül

    amount          = Column(Integer, nullable=False)                      # Can be negative (spend)
    description     = Column(String, nullable=True)                        # Human-readable reason
    related_post_id = Column(Integer, ForeignKey('posts.id', ondelete="SET NULL"), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Blockchain fields (Gün 4 — web3.py entegrasyonu)
    status          = Column(String, default='PENDING', nullable=False)
    # Değerler: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' (cüzdan yoksa)
    onchain_tx_hash = Column(String, nullable=True)   # Testnet transaction hash
    wallet_address  = Column(String, nullable=True)   # Recipient wallet

    user            = relationship("User", back_populates="token_transactions", foreign_keys=[user_id])
    related_post    = relationship("Post", foreign_keys=[related_post_id])


class PostValidation(Base):
    """A doctor 'Doğrula' (Validate) action on a post. One per doctor per post."""
    __tablename__ = 'post_validations'
    __table_args__ = (
        UniqueConstraint('post_id', 'validator_id', name='uq_validation_post_user'),
    )

    id              = Column(Integer, primary_key=True, index=True)
    post_id         = Column(Integer, ForeignKey('posts.id', ondelete="CASCADE"), nullable=False)
    validator_id    = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    is_rare_vote    = Column(Boolean, default=False, nullable=False)   # True → "Nadir Vaka" olarak işaretledi
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    post            = relationship("Post", foreign_keys=[post_id])
    validator       = relationship("User", back_populates="validations_given", foreign_keys=[validator_id])


# ── Post.validations reverse relationship ──────────────────────
Post.validations = relationship("PostValidation", foreign_keys=[PostValidation.post_id], cascade="all, delete-orphan")