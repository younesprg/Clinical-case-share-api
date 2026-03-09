import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
with engine.connect() as con:
    try:
        # PostgreSQL syntax to add JSON column
        con.execute("ALTER TABLE cases DROP COLUMN IF EXISTS ai_analysis_result;")
        con.execute("ALTER TABLE cases ADD COLUMN ai_analysis JSON;")
        print("Migrated successfully")
    except Exception as e:
        print("Error during migration:", e)
