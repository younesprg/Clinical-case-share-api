# 🏥 Clinical Case Share & AI Decision Support API (Med+)

A modern Med-Tech platform designed for healthcare professionals to securely share clinical cases, track patient vitals, and accelerate the diagnostic process using an integrated **AI Diagnostic Engine** and a **RAG-based Clinical Archive**.

## ✨ Key Features & Architecture

* **🌍 Global Clinical Archive (RAG Architecture):** Integrates with the **Europe PMC API** to fetch real, peer-reviewed clinical case reports from the global medical literature. Utilizes a cross-lingual AI translation layer (Turkish -> English -> Turkish) to seamlessly summarize complex academic abstracts into structured "Clinical Insights" (Klinik Çıkarım) with dynamic medical tagging.
* **🧠 AI-Powered Diagnostic Engine (Med+ AI):** Powered by Google Gemini 3 Flash. Analyzes patient symptoms, lab results (WBC), and vitals (SpO2, Heart Rate) to generate Differential Diagnoses and triage recommendations.
* **🛡️ Zero-Hallucination Architecture:** Implemented "Strict JSON" prompt engineering to ensure the AI returns structured, highly predictable, and medically formatted data without conversational fluff.
* **⚡ Database-Level Caching:** Built a high-performance caching mechanism in PostgreSQL to store previous AI analyses (Cache Hit/Miss), drastically reducing API response times and optimizing LLM token costs.
* **🔐 Secure Auth & Auto-Profiling (RBAC):** Utilizes FastAPI OAuth2, JWT, and Bcrypt for strict role-based access (Doctor/Patient). Features an "E-Nabız" style One-to-One DB relationship where patient medical profiles are automatically generated upon registration.
* **📊 Modern Clinical UI:** A clean, responsive "Top Navbar" interface built with Next.js, Tailwind CSS, and Recharts, moving away from legacy sidebar layouts to focus on real-time data visualization and medical archiving.

## 🛠️ Tech Stack

**Backend (API & Data):**
* **Core:** Python 3.12+, FastAPI
* **Database & ORM:** PostgreSQL, SQLAlchemy, Pydantic
* **AI & Integration:** `google-genai` (Gemini 3 Flash), Europe PMC REST API (RAG)
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
* A valid Google Gemini API Key. *(Note: Europe PMC API is open access and does not require a key).*

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
DATABASE_URL=postgresql://user:password@localhost:5432/case_share_db
GEMINI_API_KEY=your_google_gemini_api_key
SECRET_KEY=your_jwt_secret_key

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

* [ ] **Multimodal AI Integration:** Allow doctors to upload X-Rays or MRI scans, using Gemini's vision capabilities for integrated image analysis alongside vital data.
* [ ] **Web3 & Blockchain:** Implement smart contract-based immutable medical logs to ensure data integrity and track case authorship over time.
* [ ] **Advanced Data Visualization:** Add longitudinal tracking for chronic patients' vital trends over months/years.

---
*Developed by Yunus Emre Erçin*
