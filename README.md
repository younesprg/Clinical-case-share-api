# 🏥 Clinical Case Share & AI Decision Support API

A modern Med-Tech platform designed for healthcare professionals to securely share clinical cases, track patient vitals, and accelerate the diagnostic process using an integrated **AI Diagnostic Engine** powered by Large Language Models (LLMs).



## ✨ Key Features & Architecture

* **🧠 AI-Powered Diagnostic Engine (LLM):** Replaced legacy rule-based algorithms with **Google Gemini 3 Flash**. Analyzes patient symptoms, lab results (WBC), and vitals (SpO2, Heart Rate) to generate Differential Diagnoses and triage recommendations.
* **🛡️ Zero-Hallucination Architecture:** Implemented "Strict JSON" prompt engineering to ensure the AI returns structured, highly predictable, and medically formatted data without conversational fluff.
* **⚡ Database-Level Caching:** Built a high-performance caching mechanism in PostgreSQL to store previous AI analyses (Cache Hit/Miss), drastically reducing API response times and optimizing LLM token costs.
* **🔐 Secure Auth & Auto-Profiling (RBAC):** Utilizes FastAPI OAuth2, JWT, and Bcrypt for strict role-based access (Doctor/Patient). Features an "E-Nabız" style One-to-One DB relationship where patient medical profiles are automatically generated upon registration.
* **📊 Clinical Dashboard:** A modern, responsive "Master-Detail" interface built with Next.js, Tailwind CSS, and Recharts for visualizing patient data and AI triage results.

## 🛠️ Tech Stack

**Backend (API & AI):**
* **Core:** Python 3.12+, FastAPI
* **Database & ORM:** PostgreSQL, SQLAlchemy, Pydantic
* **AI Integration:** `google-genai` (Gemini 3 Flash)
* **Security:** Passlib, Bcrypt, python-jose (JWT)

**Frontend (Client):**
* **Core:** Next.js, React (Turbopack)
* **Styling & UI:** Tailwind CSS, Lucide React
* **Data Fetching & Vis:** Axios, Recharts

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
* Python 3.12+ and Node.js installed.
* A running instance of PostgreSQL (Create an empty database, e.g., `case_share_db`).
* A valid Google Gemini API Key.

### 2. Backend Setup (FastAPI)

\`\`\`bash
# Clone the repository and enter the backend directory
cd case-share-api

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment Variables
# Create a .env file in the root directory and add the following:
# DATABASE_URL=postgresql://user:password@localhost:5432/case_share_db
# GEMINI_API_KEY=your_google_gemini_api_key
# SECRET_KEY=your_jwt_secret_key

# Run the backend server
uvicorn app.main:app --reload
\`\`\`

### 3. Frontend Setup (Next.js)

\`\`\`bash
# Open a new terminal and enter the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
\`\`\`

---

## 🗺️ Roadmap (Future Implementations)

* [ ] **External API Integrations:** Integrate **PubMed** and Wikipedia APIs to feed the LLM with the latest peer-reviewed medical journals for enhanced contextual analysis.
* [ ] **Web3 & Blockchain:** Implement smart contract-based immutable medical logs to ensure data integrity and track case authorship over time.
* [ ] **Advanced Data Visualization:** Add longitudinal tracking for chronic patients' vital trends.