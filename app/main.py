# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from app.db import engine, get_db
import app.models as models
import app.schemas as schemas
import app.auth as auth
import app.ai_engine as ai_engine # Yapay Zeka motorumuzu dahil ettik
from fastapi.middleware.cors import CORSMiddleware
import json
from datetime import date


# Veritabanı tablolarını oluştur
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Case-Share AI & Auth API",
    description="Role-Based (Doktor/Hasta) Klinik Vaka ve AI Platformu",
    version="2.0.0"
)


# app = FastAPI(...) satırının hemen altına ekle:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Sadece bizim Next.js frontend'imize izin ver
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Sistem aktif.  Swagger UI üzerinden test edin."}

# ==========================================
# 1. KİMLİK DOĞRULAMA (AUTH) & KAYIT
# ==========================================
@app.post("/register/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu email adresi zaten kayitli.")
    
    hashed_pw = auth.get_password_hash(user.password)
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_pw,
        name=user.name,
        tc_kimlik=user.tc_kimlik,
        role=user.role,
        title=user.title,
        specialty=user.specialty,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        height=user.height,
        weight=user.weight,
        blood_type=user.blood_type
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login/", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Kullanıcı girişi yapar ve JWT Token (Dijital Kimlik) döndürür."""
    # Kullanıcıyı email ile bul
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # Kullanıcı yoksa veya şifre yanlışsa 401 Hata fırlat
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email veya sifre hatali",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Giriş başarılıysa Token üret
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    """Giriş yapmış kullanıcının kendi profil bilgilerini getirir."""
    return current_user

@app.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """ID'ye göre kullanıcı bilgilerini getirir."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return user

# ==========================================
# 2. KLİNİK VAKA & AI ENDPOINT'LERİ (KORUMALI)
# ==========================================
@app.post("/cases/", response_model=schemas.CasePostResponse, status_code=status.HTTP_201_CREATED)
def create_case(
    case: schemas.CasePostCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user) # GÜVENLİK DUVARI: Token yoksa buraya giremez!
):
    """Sisteme yeni vaka ekler. SADECE DOKTORLAR KULLANABİLİR."""
    
    # 1. Rol Kontrolü (RBAC - Role Based Access Control)
    if current_user.role != models.UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Yetkisiz islem. Sadece doktorlar vaka girebilir.")
        
    # 2. Hasta var mı kontrolü
    patient = db.query(models.User).filter(models.User.id == case.patient_id, models.User.role == models.UserRole.PATIENT).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Belirtilen ID'ye sahip bir hasta bulunamadi.")

    # 3. YAPAY ZEKA (AI) ANALİZİNİ ÇALIŞTIR
    wbc_value = case.blood_test.wbc if case.blood_test else None
    
    patient_age = 30
    if patient.date_of_birth:
        today = date.today()
        patient_age = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))

    # AI motoruna verileri gönderip analiz sonucunu alıyoruz
    ai_result_dict = ai_engine.generate_structured_ai_analysis(
        patient_age=patient_age,
        symptoms=case.symptoms,
        heart_rate=case.heart_rate,
        oxygen_saturation=case.oxygen_saturation,
        blood_pressure=case.blood_pressure,
        glucose_level=case.blood_test.glucose_level if case.blood_test else None,
        wbc=wbc_value
    )
    ai_result = json.dumps(ai_result_dict, ensure_ascii=False)

    # 4. Vakayı Oluştur
    db_case = models.CasePost(
        author_id=current_user.id, # Yazar ID'sini dışarıdan almıyoruz, token'dan otomatik çekiyoruz! Çok güvenli.
        patient_id=case.patient_id,
        heart_rate=case.heart_rate,
        blood_pressure=case.blood_pressure,
        body_temperature=case.body_temperature,
        symptoms=case.symptoms,
        diagnosis=case.diagnosis,
        treatment_plan=case.treatment_plan,
        ai_analysis_result=ai_result # AI sonucunu veritabanına kaydet
    )
    
    db.add(db_case)
    db.flush() 
    
    # Kan Testi Ekleme
    if case.blood_test:
        db_blood_test = models.BloodTest(
            case_id=db_case.id,
            hemoglobin=case.blood_test.hemoglobin,
            wbc=case.blood_test.wbc,
            platelets=case.blood_test.platelets
        )
        db.add(db_blood_test)
        
    db.commit()
    db.refresh(db_case)
    return db_case

@app.get("/cases/", response_model=List[schemas.CasePostResponse])
def get_cases(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Vakaları listeler. 
    Doktor giriş yaptıysa sistemdeki TÜM vakaları görür.
    Hasta giriş yaptıysa SADECE kendi vakalarını görür.
    """
    if current_user.role == models.UserRole.DOCTOR:
        return db.query(models.CasePost).all()
    else:
        return db.query(models.CasePost).filter(models.CasePost.patient_id == current_user.id).all()

@app.get("/cases/{case_id}/ai-analysis", response_model=schemas.AIAnalysisResponse)
def get_case_ai_analysis(case_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Seçilen vakanın detaylı AI analizini JSON yapısında döndürür."""
    case = db.query(models.CasePost).filter(models.CasePost.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Vaka bulunamadı")
    
    # Hasta veya doktor erişim kontrolü (Basit RBAC kontrolü, istersek ekleyebiliriz)
    if current_user.role == models.UserRole.PATIENT and case.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu vakayı görüntüleme yetkiniz yok.")

    patient = db.query(models.User).filter(models.User.id == case.patient_id).first()
    patient_age = 30
    if patient and patient.date_of_birth:
        today = date.today()
        patient_age = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))

    glucose = case.blood_test.glucose_level if case.blood_test else None
    wbc = case.blood_test.wbc if case.blood_test else None

    result = ai_engine.generate_structured_ai_analysis(
        patient_age=patient_age,
        symptoms=case.symptoms,
        heart_rate=case.heart_rate,
        oxygen_saturation=case.oxygen_saturation,
        blood_pressure=case.blood_pressure,
        glucose_level=glucose,
        wbc=wbc
    )
    return result