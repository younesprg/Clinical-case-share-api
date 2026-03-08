import enum
from datetime import date
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Table, Enum, Boolean, Date
from sqlalchemy.orm import relationship
from app.db import Base

class UserRole(str, enum.Enum):
    DOCTOR = "doctor"
    PATIENT = "patient"
    ADMIN = "admin"

case_disease_link = Table(
    'case_disease_link',
    Base.metadata,
    Column('case_id', Integer, ForeignKey('cases.id', ondelete="CASCADE"), primary_key=True),
    Column('disease_id', Integer, ForeignKey('diseases.id', ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, index=True, nullable=False)
    tc_kimlik = Column(String, unique=True, index=True, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.PATIENT, nullable=False)
    
    # YENİ: Frontend için Fiziksel ve Demografik Veriler
    date_of_birth = Column(Date, nullable=True) # Yaşı frontend hesaplayacak
    gender = Column(String, nullable=True) # "Male", "Female"
    height = Column(Float, nullable=True) # cm cinsinden (Örn: 175.0)
    weight = Column(Float, nullable=True) # kg cinsinden (Örn: 87.0)
    blood_type = Column(String, nullable=True) # Örn: "B+"
    
    title = Column(String, nullable=True) 
    specialty = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    authored_cases = relationship("CasePost", foreign_keys="[CasePost.author_id]", back_populates="author", cascade="all, delete-orphan")
    patient_cases = relationship("CasePost", foreign_keys="[CasePost.patient_id]", back_populates="patient", cascade="all, delete-orphan")

class DiseaseDictionary(Base):
    __tablename__ = 'diseases'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

class BloodTest(Base):
    __tablename__ = 'blood_tests'
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey('cases.id', ondelete="CASCADE"), unique=True)
    
    hemoglobin = Column(Float)
    wbc = Column(Float)
    platelets = Column(Float)
    # YENİ: Grafikler için Kan Şekeri
    glucose_level = Column(Float, nullable=True) 
    
    case = relationship("CasePost", back_populates="blood_test")

class CasePost(Base):
    __tablename__ = 'cases'
    
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    
    heart_rate = Column(Integer)
    blood_pressure = Column(String)
    body_temperature = Column(Float)
    # YENİ: Grafikler için Oksijen Seviyesi (SpO2)
    oxygen_saturation = Column(Integer, nullable=True) 
    
    symptoms = Column(Text, nullable=False)
    diagnosis = Column(String)
    treatment_plan = Column(Text)
    ai_analysis_result = Column(Text, nullable=True)
    
    author = relationship("User", foreign_keys=[author_id], back_populates="authored_cases")
    patient = relationship("User", foreign_keys=[patient_id], back_populates="patient_cases")
    blood_test = relationship("BloodTest", back_populates="case", uselist=False)
    comorbidities = relationship("DiseaseDictionary", secondary=case_disease_link)