import asyncio
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import User

db = SessionLocal()

# Kullanıcıyı bul veya adını değiştir
dr = db.query(User).filter(User.id == 1).first()
if dr:
    dr.name = "Dr. Ömer Özkan"
    dr.wallet_address = "0xC83a221c820e002D387C9e96c27CD6AaA2eCF2F1"
    db.commit()
    print(f"✅ Başarılı: {dr.name} ({dr.email}) güncellendi ve cüzdan atandı.")
db.close()
