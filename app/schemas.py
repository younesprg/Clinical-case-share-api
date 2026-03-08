from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import List, Optional
from datetime import date
from app.models import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    name: str
    tc_kimlik: Optional[str] = None
    role: UserRole = UserRole.PATIENT
    
    # YENİ EKLENENLER
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_type: Optional[str] = None
    
    title: Optional[str] = None
    specialty: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., max_length=72)

class UserResponse(UserBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class DiseaseBase(BaseModel):
    name: str

class DiseaseResponse(DiseaseBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BloodTestBase(BaseModel):
    hemoglobin: Optional[float] = None
    wbc: Optional[float] = None
    platelets: Optional[float] = None
    glucose_level: Optional[float] = None # YENİ

class BloodTestCreate(BloodTestBase):
    pass

class BloodTestResponse(BloodTestBase):
    id: int
    case_id: int
    model_config = ConfigDict(from_attributes=True)

class CasePostBase(BaseModel):
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    body_temperature: Optional[float] = None
    oxygen_saturation: Optional[int] = None # YENİ
    symptoms: str
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None

class CasePostCreate(CasePostBase):
    patient_id: int
    disease_ids: Optional[List[int]] = [] 
    blood_test: Optional[BloodTestCreate] = None 
                            
class CasePostResponse(CasePostBase):
    id: int
    author_id: int
    patient_id: int
    ai_analysis_result: Optional[str] = None
    blood_test: Optional[BloodTestResponse] = None
    comorbidities: List[DiseaseResponse] = []
    model_config = ConfigDict(from_attributes=True)

class AIAnalysisResponse(BaseModel):
    risk_level: str
    confidence_score: int
    differential_diagnoses: List[str]
    clinical_recommendations: List[str]