# app/auth.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt # Passlib yerine doğrudan bcrypt kullanıyoruz
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db import get_db
import app.models as models
import os
from dotenv import load_dotenv


load_dotenv()

# Şifreyi açıkça yazmak yerine os kütüphanesi ile sistemden çek
SECRET_KEY = os.getenv("SECRET_KEY") 

# Eğer .env dosyası yoksa veya okunamadıysa sistemi uyar (Güvenlik önlemi)
if not SECRET_KEY:
    raise ValueError("Sistem Hatasi: SECRET_KEY bulunamadi. Lutfen .env dosyanizi kontrol edin.")


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kullanıcının girdiği şifre ile veritabanındaki kriptolu şifre eşleşiyor mu?"""
    # bcrypt kütüphanesi byte (b"") formatında veri bekler, bu yüzden .encode('utf-8') kullanıyoruz
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def get_password_hash(password: str) -> str:
    """Yeni kayıt olan kullanıcının şifresini kriptolar."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode('utf-8') # Veritabanına String olarak kaydetmek için tekrar decode ediyoruz

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik dogrulanamadi veya Token suresi doldu.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user