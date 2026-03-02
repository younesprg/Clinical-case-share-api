import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Table, Enum, Boolean
from sqlalchemy.orm import relationship
from app.db import Base

# ==========================================
# 0. ROL TANIMLAMALARI (Enum)
# ==========================================
class UserRole(str, enum.Enum):
    DOCTOR = "doctor"
    PATIENT = "patient"
    ADMIN = "admin"

# ==========================================
# 1. KÖPRÜ TABLO (Many-to-Many)
# ==========================================
case_disease_link = Table(
    'case_disease_link',
    Base.metadata,
    Column('case_id', Integer, ForeignKey('cases.id', ondelete="CASCADE"), primary_key=True),
    Column('disease_id', Integer, ForeignKey('diseases.id', ondelete="CASCADE"), primary_key=True)
)

# ==========================================
# 2. KULLANICI ANA TABLOSU (User)
# ==========================================
class User(Base):
    """Sistemdeki Tüm Kullanıcılar (Doktorlar ve Hastalar)"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False) # Giriş için kullanılacak
    hashed_password = Column(String, nullable=False) # Şifreler asla düz metin kaydedilmez!
    name = Column(String, index=True, nullable=False)
    tc_kimlik = Column(String, unique=True, index=True, nullable=True) # Hastane gerçekliği
    role = Column(Enum(UserRole), default=UserRole.PATIENT, nullable=False)
    
    # Sadece Doktorlara Özel Alanlar (Hastalar için Null kalacak)
    title = Column(String, nullable=True) 
    specialty = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)

    # İlişkiler: Bir kullanıcının "Yazdığı" vakalar (Doktor) ve "Sahip olduğu" vakalar (Hasta)
    authored_cases = relationship("CasePost", foreign_keys="[CasePost.author_id]", back_populates="author", cascade="all, delete-orphan")
    patient_cases = relationship("CasePost", foreign_keys="[CasePost.patient_id]", back_populates="patient", cascade="all, delete-orphan")

# ==========================================
# 3. HASTALIK VE KAN TESTİ TABLOLARI
# ==========================================
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
    
    case = relationship("CasePost", back_populates="blood_test")

# ==========================================
# 4. KLİNİK VAKA TABLOSU (CasePost)
# ==========================================
class CasePost(Base):
    __tablename__ = 'cases'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # YENİ: Vaka artık hem bir Doktora hem de bir Hastaya bağlı!
    author_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    
    # Vital Bulgular & Klinik Durum
    heart_rate = Column(Integer)
    blood_pressure = Column(String)
    body_temperature = Column(Float)
    symptoms = Column(Text, nullable=False)
    diagnosis = Column(String)
    treatment_plan = Column(Text)
    ai_analysis_result = Column(Text, nullable=True)
    
    # İlişkiler (Relationships)
    author = relationship("User", foreign_keys=[author_id], back_populates="authored_cases")
    patient = relationship("User", foreign_keys=[patient_id], back_populates="patient_cases")
    blood_test = relationship("BloodTest", back_populates="case", uselist=False)
    comorbidities = relationship("DiseaseDictionary", secondary=case_disease_link)