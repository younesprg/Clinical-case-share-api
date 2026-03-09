import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('case_share.db')
cursor = conn.cursor()

# Disable foreign keys temporarily
cursor.execute('PRAGMA foreign_keys=OFF;')

# We need to recreate the `cases` table because SQLite does not support ALTER TABLE ADD CONSTRAINT

# 1. Rename existing cases table
cursor.execute('ALTER TABLE cases RENAME TO cases_backup;')

# 2. Create the new cases table with the correct foreign key to patients(id)
cursor.execute('''
CREATE TABLE cases (
	id INTEGER NOT NULL, 
	author_id INTEGER NOT NULL, 
	patient_id INTEGER NOT NULL, 
	heart_rate INTEGER, 
	blood_pressure VARCHAR, 
	body_temperature FLOAT, 
	oxygen_saturation INTEGER, 
	symptoms TEXT NOT NULL, 
	diagnosis VARCHAR, 
	treatment_plan TEXT, 
	ai_analysis JSON, 
	PRIMARY KEY (id), 
	FOREIGN KEY(author_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(patient_id) REFERENCES patients (id) ON DELETE CASCADE
)
''')

# 3. Copy data if any exists (handle oxygen_saturation which might be missing in older rows)
cursor.execute('PRAGMA table_info(cases_backup)')
columns = [info[1] for info in cursor.fetchall()]

if 'oxygen_saturation' in columns:
    cursor.execute('''
    INSERT INTO cases (id, author_id, patient_id, heart_rate, blood_pressure, body_temperature, oxygen_saturation, symptoms, diagnosis, treatment_plan, ai_analysis)
    SELECT id, author_id, patient_id, heart_rate, blood_pressure, body_temperature, oxygen_saturation, symptoms, diagnosis, treatment_plan, ai_analysis FROM cases_backup;
    ''')
else:
    cursor.execute('''
    INSERT INTO cases (id, author_id, patient_id, heart_rate, blood_pressure, body_temperature, symptoms, diagnosis, treatment_plan, ai_analysis)
    SELECT id, author_id, patient_id, heart_rate, blood_pressure, body_temperature, symptoms, diagnosis, treatment_plan, ai_analysis FROM cases_backup;
    ''')

# 4. Drop the backup
cursor.execute('DROP TABLE cases_backup;')

# Optional: Also fix blood_tests if it has a constraint linked to the old cases table, but cascade delete handle should be fine on the new one if blood_tests isn't complaining. Wait, blood_tests points TO cases. It's fine. 

# Re-enable foreign keys
cursor.execute('PRAGMA foreign_keys=ON;')
conn.commit()
conn.close()

print("Migration completed successfully!")
