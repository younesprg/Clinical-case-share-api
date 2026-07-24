from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import List, Optional
from datetime import date, datetime
from app.models import UserRole


# ══════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# ══════════════════════════════════════════════════════════════
# USER
# ══════════════════════════════════════════════════════════════

class UserBase(BaseModel):
    email: EmailStr
    name: str
    tc_kimlik: Optional[str] = None
    role: UserRole = UserRole.PATIENT

    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_type: Optional[str] = None

    title: Optional[str] = None
    specialty: Optional[str] = None

    # Social profile field (separate from system role)
    medical_role: Optional[str] = 'medical_student'
    """Social title. Values: medical_student | researcher | resident | specialist"""


class UserCreate(UserBase):
    password: str = Field(..., max_length=72)


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    model_config = ConfigDict(from_attributes=True)


# ══════════════════════════════════════════════════════════════
# DISEASE DICTIONARY  (unchanged)
# ══════════════════════════════════════════════════════════════

class DiseaseBase(BaseModel):
    name: str


class DiseaseResponse(DiseaseBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ══════════════════════════════════════════════════════════════
# BLOOD TEST  (unchanged)
# ══════════════════════════════════════════════════════════════

class BloodTestBase(BaseModel):
    hemoglobin: Optional[float] = None
    wbc: Optional[float] = None
    platelets: Optional[float] = None
    glucose_level: Optional[float] = None  # YENİ


class BloodTestCreate(BloodTestBase):
    pass


class BloodTestResponse(BloodTestBase):
    id: int
    case_id: int
    model_config = ConfigDict(from_attributes=True)


# ══════════════════════════════════════════════════════════════
# PATIENT  (unchanged)
# ══════════════════════════════════════════════════════════════

class PatientBase(BaseModel):
    full_name: str
    age: int
    gender: str


class PatientCreate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ══════════════════════════════════════════════════════════════
# CASE POST  (unchanged)
# ══════════════════════════════════════════════════════════════

class CasePostBase(BaseModel):
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    body_temperature: Optional[float] = None
    oxygen_saturation: Optional[int] = None  # YENİ
    symptoms: str
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None


class CasePostCreate(CasePostBase):
    patient_id: int
    disease_ids: Optional[List[int]] = []
    blood_test: Optional[BloodTestCreate] = None


class AIAnalysisResponse(BaseModel):
    risk_level: str
    confidence_score: int
    differential_diagnoses: List[str]
    clinical_recommendations: List[str]


class CasePostResponse(CasePostBase):
    id: int
    author_id: int
    patient_id: int
    ai_analysis: Optional[AIAnalysisResponse] = None
    blood_test: Optional[BloodTestResponse] = None
    comorbidities: List[DiseaseResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ══════════════════════════════════════════════════════════════
# ██████  SOCIAL FEED MODULE — NEW SCHEMAS  ██████
# ══════════════════════════════════════════════════════════════

# ── Post Comment ──────────────────────────────────────────────

class PostCommentBase(BaseModel):
    content: str


class PostCommentCreate(PostCommentBase):
    post_id: int
    parent_comment_id: Optional[int] = None
    """Set to a comment ID to create a threaded reply."""


class PostCommentResponse(PostCommentBase):
    id: int
    post_id: int
    author_id: int
    parent_comment_id: Optional[int] = None
    created_at: datetime
    author: Optional[UserResponse] = None
    replies: List["PostCommentResponse"] = []
    model_config = ConfigDict(from_attributes=True)


# ── Post Like ─────────────────────────────────────────────────

class PostLikeResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


# ── Post Bookmark ─────────────────────────────────────────────

class PostBookmarkResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


# ── Post ──────────────────────────────────────────────────────

class PostBase(BaseModel):
    content: str
    image_url: Optional[str] = None
    """URL to a radiology image, lesion photo, or any visual content."""
    category: Optional[str] = None
    """Medical specialty, e.g. 'Kardiyoloji', 'Nöroloji', 'Pediatri'."""
    tags: Optional[str] = None
    """Comma-separated hashtag-style tags, e.g. '#NadirVaka,#COVID19'."""
    status: str = 'tartışılıyor'
    """Discussion status: 'tartışılıyor' | 'teşhis kondu'."""


class PostCreate(PostBase):
    linked_case_id: Optional[int] = None
    """Optionally attach a formal clinical CasePost to this social post."""


class PostUpdate(BaseModel):
    """Partial update — all fields optional."""
    content: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    status: Optional[str] = None


class PostResponse(PostBase):
    id: int
    author_id: int
    linked_case_id: Optional[int] = None
    likes_count: int = 0
    created_at: datetime
    author: Optional[UserResponse] = None
    comments: List[PostCommentResponse] = []
    model_config = ConfigDict(from_attributes=True)


# Resolve forward references for threaded comments
PostCommentResponse.model_rebuild()