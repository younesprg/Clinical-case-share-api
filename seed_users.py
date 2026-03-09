import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
import app.models as models
import app.auth as auth

def seed():
    db = SessionLocal()
    try:
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == "emre@hospital.com").first()
        if not user:
            print("Creating default doctor account emre@hospital.com...")
            hashed_pw = auth.get_password_hash("test123")
            db_user = models.User(
                email="emre@hospital.com",
                hashed_password=hashed_pw,
                name="Emre (Doktor)",
                role=models.UserRole.DOCTOR,
                title="Uzm. Dr."
            )
            db.add(db_user)
            db.commit()
            print("Successfully created emre@hospital.com with password test123")
        else:
            print("Account already exists.")
            
        # Optional: Seed a test patient user too to test the new 1:1 relation
        patient = db.query(models.User).filter(models.User.email == "hasta@test.com").first()
        if not patient:
            print("Creating a dummy patient account (hasta@test.com)...")
            from datetime import date
            hashed_pw = auth.get_password_hash("hasta123")
            db_pat = models.User(
                email="hasta@test.com",
                hashed_password=hashed_pw,
                name="Test Hastası Mehmet",
                role=models.UserRole.PATIENT,
                date_of_birth=date(1980, 5, 20),
                gender="Erkek"
            )
            db.add(db_pat)
            db.commit()
            
            db.refresh(db_pat)
            db_patient_profile = models.Patient(
                user_id=db_pat.id,
                full_name=db_pat.name,
                age=45,
                gender="Erkek"
            )
            db.add(db_patient_profile)
            db.commit()
            print("Dummy patient successfully created!")
            
    except Exception as e:
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
