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

# Veritabanı tablolarını oluştur
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Case-Share AI & Auth API",
    description="Role-Based (Doktor/Hasta) Klinik Vaka ve AI Platformu",
    version="2.0.0"
)

@app.get("/")
def root():
    return {"message": "Sistem aktif. Lütfen /docs adresine giderek Swagger UI üzerinden test edin."}

# ==========================================
# 1. KİMLİK DOĞRULAMA (AUTH) & KAYIT
# ==========================================
@app.post("/register/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Sisteme yeni bir Doktor veya Hasta kaydeder."""
    # Email daha önce alınmış mı kontrolü
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu email adresi zaten kayitli.")
    
    # Şifreyi bcrypt ile çırpıp (hash) veritabanına öyle kaydediyoruz!
    hashed_pw = auth.get_password_hash(user.password)
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_pw,
        name=user.name,
        tc_kimlik=user.tc_kimlik,
        role=user.role,
        title=user.title,
        specialty=user.specialty
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
    
    # AI motoruna verileri gönderip analiz sonucunu alıyoruz
    ai_result = ai_engine.analyze_clinical_case(
        patient_age=30, # (Not: Yaş sistemini User modeline sonradan ekleyebiliriz, şimdilik varsayılan 30 gidiyor)
        symptoms=case.symptoms,
        wbc=wbc_value,
        heart_rate=case.heart_rate
    )

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
        # Hasta için filtreleme
        return db.query(models.CasePost).filter(models.CasePost.patient_id == current_user.id).all()