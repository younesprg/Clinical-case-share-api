import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import engine
from sqlalchemy import text

# Force PostgreSQL to drop the old constraint and add the new one explicitly
# Using psycopg2 connection so it doesn't fail silently
with engine.connect() as con:
    try:
        print("Checking tables...")
        # Cleanly recreate cases table structure if needed or just alter the constraint
        
        # In PostgreSQL, dropping a constraint:
        print("Dropping old constraints (if any)...")
        con.execute(text("ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_patient_id_fkey;"))
        
        print("Adding new constraint referencing patients(id)...")
        con.execute(text("""
            ALTER TABLE cases 
            ADD CONSTRAINT cases_patient_id_fkey 
            FOREIGN KEY (patient_id) 
            REFERENCES patients(id) 
            ON DELETE CASCADE;
        """))
        con.commit()
        print("Constraint updated successfully on Postgres!")
    except Exception as e:
        print(f"Failed to update constraints on Postgres: {e}")
