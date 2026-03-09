import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import engine
from sqlalchemy import text
import app.models as models

with engine.connect() as con:
    try:
        print("Dropping all tables cleanly to apply the new 1:1 schema...")
        con.execute(text("DROP TABLE IF EXISTS case_disease_link CASCADE;"))
        con.execute(text("DROP TABLE IF EXISTS diseases CASCADE;"))
        con.execute(text("DROP TABLE IF EXISTS blood_tests CASCADE;"))
        con.execute(text("DROP TABLE IF EXISTS cases CASCADE;"))
        con.execute(text("DROP TABLE IF EXISTS patients CASCADE;"))
        con.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
        con.commit()
        print("Dropped successfully. Recreating tables...")
        models.Base.metadata.create_all(bind=engine)
        print("Migration complete! Database is fresh.")
    except Exception as e:
        print(f"Error resetting DB: {e}")
