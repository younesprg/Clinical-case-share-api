from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import List, Optional
from app.models import UserRole

# ==========================================
# 0. TOKEN ŞEMALARI (Giriş Yapma İçin)
# ==========================================
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ==========================================
# 1. KULLANICI (User) ŞEMALARI
# ==========================================
class UserBase(BaseModel):
    email: EmailStr = Field(..., example="doktor@hastane.com")
    name: str = Field(..., example="Dr. Yunus Emre")
    tc_kimlik: Optional[str] = Field(None, example="12345678901")
    role: UserRole = Field(default=UserRole.PATIENT, example="doctor veya patient")
    title: Optional[str] = None
    specialty: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(...,max_length=72, example="gizliSifre123") # Sadece kayıt olurken alınır

class UserResponse(UserBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# 2. HASTALIK SÖZLÜĞÜ VE KAN TESTİ ŞEMALARI
# ==========================================
class DiseaseBase(BaseModel):
    name: str

class DiseaseResponse(DiseaseBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BloodTestBase(BaseModel):
    hemoglobin: Optional[float] = None
    wbc: Optional[float] = None
    platelets: Optional[float] = None

class BloodTestCreate(BloodTestBase):
    pass

class BloodTestResponse(BloodTestBase):
    id: int
    case_id: int
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# 3. KLİNİK VAKA (CasePost) ŞEMALARI
# ==========================================
class CasePostBase(BaseModel):
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    body_temperature: Optional[float] = None
    symptoms: str
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None

class CasePostCreate(CasePostBase):
    patient_id: int # Artık hastanın yaşı/cinsiyeti yerine direkt ID'sini alıyoruz
    disease_ids: Optional[List[int]] = [] 
    blood_test: Optional[BloodTestCreate] = None 

class CasePostResponse(CasePostBase):
    id: int
    author_id: int
    patient_id: int
    ai_analysis_result: Optional[str] = None
    
    # Nested Data (İlişkili Veriler)
    blood_test: Optional[BloodTestResponse] = None
    comorbidities: List[DiseaseResponse] = []

    model_config = ConfigDict(from_attributes=True)