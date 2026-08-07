import asyncio
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import User
import app.auth as auth

db = SessionLocal()

# 1. Admin/Kendi hesabını eski haline getir
admin = db.query(User).filter(User.id == 1).first()
if admin:
    admin.name = "Dr.Emre"  # Daha önceki ismi buydu
    admin.wallet_address = None # Adminin cüzdanını temizle (sadece .env'den Hazine cüzdanını kullanacak)
    
# 2. Yeni bir Dr. Ömer Özkan hesabı oluştur (eğer yoksa)
omer = db.query(User).filter(User.email == "omer@example.com").first()
if not omer:
    omer = User(
        email="omer@example.com",
        hashed_password=auth.get_password_hash("123456"),
        name="Dr. Ömer Özkan",
        role="doctor",
        medical_role="specialist",
        is_verified=True,
        wallet_address="0xC83a221c820e002D387C9e96c27CD6AaA2eCF2F1"
    )
    db.add(omer)
else:
    omer.wallet_address = "0xC83a221c820e002D387C9e96c27CD6AaA2eCF2F1"

db.commit()
print("Kullanıcılar başarıyla düzeltildi!")
print(f"Admin (ID 1): {admin.name} - {admin.email}")
print(f"Ömer Özkan: {omer.name} - {omer.email} - Şifre: 123456 - Cüzdan: {omer.wallet_address}")

db.close()
