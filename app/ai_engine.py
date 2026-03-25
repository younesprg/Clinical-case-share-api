# app/ai_engine.py
import os
import json
import httpx
from typing import Optional
from google import genai
from google.genai import types
from pydantic import BaseModel

class AIAnalysisResponse(BaseModel):
    risk_level: str
    confidence_score: int
    differential_diagnoses: list[str]
    clinical_recommendations: list[str]

def generate_gemini_analysis(
    patient_age: int,
    symptoms: str, 
    heart_rate: Optional[int] = None, 
    oxygen_saturation: Optional[int] = None, 
    blood_pressure: Optional[str] = None,
    glucose_level: Optional[float] = None,
    wbc: Optional[float] = None
) -> dict:
    """
    Klinik verileri Google Gemini 3.1 Flash LLM modeline gönderir
    ve yapılandırılmış (JSON) uzman doktor analizi alır.
    """
    client = genai.Client()

    system_instruction = (
        "Sen 20 yıllık tecrübeye sahip, uluslararası board sertifikalı bir uzman doktorsun. "
        "Amacın klinisyene ikinci bir görüş sunmaktır. "
        "ASLA halüsinasyon yapma, emin olmadığın hiçbir teşhisi uydurma. "
        "Eğer veriler yetersizse açıkça belirt. "
        "Yanıtını SADECE istenilen JSON formatında ver."
    )

    clinical_data = f"""
    Hasta Yaşı: {patient_age}
    Semptomlar: {symptoms}
    Kalp Atış Hızı: {heart_rate if heart_rate else 'Bilinmiyor'}
    Oksijen Satürasyonu (SpO2): {oxygen_saturation if oxygen_saturation else 'Bilinmiyor'}
    Kan Basıncı: {blood_pressure if blood_pressure else 'Bilinmiyor'}
    Kan Şekeri (Glukoz): {glucose_level if glucose_level else 'Bilinmiyor'}
    Beyaz Kan Hücresi (WBC): {wbc if wbc else 'Bilinmiyor'}

    Lütfen yukarıdaki verilere dayanarak risk seviyesini (Normal, Dikkat, Yüksek, Kritik), 
    güven skorunu (0-100), olası ayırıcı tanıları (differential_diagnoses) ve 
    klinik tavsiyeleri (clinical_recommendations) belirt.
    """

    response = client.models.generate_content(
        model='gemini-2.5-flash', 
        contents=clinical_data,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
            response_mime_type="application/json",
            response_schema=AIAnalysisResponse,
        ),
    )

    try:
        result_json = json.loads(response.text)
        return result_json
    except Exception as e:
        print(f"JSON Ayrıştırma Hatası: {e}")
        return {
            "risk_level": "Bilinmeyen",
            "confidence_score": 0,
            "differential_diagnoses": ["Veri işlenemedi / API hatası"],
            "clinical_recommendations": ["Lütfen hastayı manuel değerlendirin"]
        }



# ============================================================
# AI Medical Encyclopedia — RAG Function
# ============================================================

TRANSLATE_SYSTEM_PROMPT = (
    "You are a medical translation assistant. "
    "The user will give you a search query in any language (often Turkish). "
    "Translate it into the single most accurate professional English medical term or phrase. "
    "Return ONLY the English term/phrase — no explanation, no punctuation, no extra words."
)

ENCYCLOPEDIA_SYSTEM_PROMPT = """
Sen deneyimli bir tıp editörüsün. Sana aşağıda İngilizce tıbbi vaka raporlarının özetleri verilecek.
Görevin: bu İngilizce özetleri oku ve her vaka için aşağıdaki formatta Türkçe, anlaşılır, ansiklopedik bir özet oluştur.
ASLA uydurma, SADECE verilen metne dayan.
Yanıtını MUTLAKA şu JSON formatında ver (başka hiçbir şey yazma):
[
  {
    "baslik": "Kısa, çarpıcı Türkçe başlık (max 10 kelime)",
    "ozet": "Vakayı sıradan bir insanın anlayabileceği şekilde Türkçe özetle (3-5 cümle)",
    "ders": "Bu vakadan çıkarılan en önemli tıbbi ders (1-2 cümle)",
    "kaynak_baslik": "Orijinal İngilizce makale başlığı",
    "yayin_tarihi": "Yayın yılı veya tarihi",
    "etiketler": ["Tıbbi alan etiketi 1", "Tıbbi alan etiketi 2", "Tıbbi alan etiketi 3"]
  }
]
etiketler alanı için: vakada geçen tıbbi alan, hastalık kategorisi veya müdahale türünü yansıtan 2-4 kısa Türkçe etiket üret.
Örnekler: "Nöroloji", "Kardiyoloji", "Enfeksiyon", "Onkoloji", "Travma", "Acil Tıp", "Pediatri", "Cerrahi", "Aşı", "Otoimmün".
"""

async def _translate_query(query: str, client: genai.Client) -> str:
    """Translates any-language medical query to English using Gemini (fast, low-temp)."""
    try:
        resp = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=query,
            config=types.GenerateContentConfig(
                system_instruction=TRANSLATE_SYSTEM_PROMPT,
                temperature=0.1,
            ),
        )
        translated = resp.text.strip().strip('"').strip("'")
        # Safety: if response is suspiciously long or empty, fall back to original
        if translated and len(translated) < 200:
            return translated
    except Exception as e:
        print(f"Translation error (using original): {e}")
    return query


async def generate_encyclopedia_summary(query: str) -> list:
    """
    1. Translates the query to English via Gemini.
    2. Fetches real clinical case reports from Europe PMC.
    3. Summarises them in Turkish with dynamic medical tags via Gemini.
    """
    gemini_client = genai.Client()

    # Step 1 — Translate query to English
    english_query = await _translate_query(query, gemini_client)
    print(f"[Encyclopedia] Query: '{query}' → English: '{english_query}'")

    # Step 2 — Fetch from Europe PMC using the English term
    pmcurl = (
        "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
        f"?query=(TITLE:\"case report\" OR TITLE:\"clinical case\") AND ({english_query})"
        "&format=json&resultType=core&pageSize=8"
    )

    async with httpx.AsyncClient(timeout=20.0) as http_client:
        resp = await http_client.get(pmcurl)
        resp.raise_for_status()
        pmc_data = resp.json()

    results = pmc_data.get("resultList", {}).get("result", [])
    if not results:
        return []

    # Step 3 — Build abstracts payload (max 4 with non-trivial abstracts)
    abstracts_text = ""
    valid_count = 0
    for item in results:
        abstract = item.get("abstractText") or item.get("abstract", "")
        title = item.get("title", "No title")
        year = item.get("pubYear", "")
        if abstract and len(abstract) > 100:
            abstracts_text += f"\n\n--- VAKA {valid_count + 1} ---\nBAŞLIK: {title}\nYIL: {year}\nÖZET: {abstract[:1500]}"
            valid_count += 1
            if valid_count >= 4:
                break

    if not abstracts_text:
        return []

    # Step 4 — Summarise + generate tags via Gemini
    response = gemini_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=abstracts_text,
        config=types.GenerateContentConfig(
            system_instruction=ENCYCLOPEDIA_SYSTEM_PROMPT,
            temperature=0.3,
            response_mime_type="application/json",
        ),
    )

    try:
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as e:
        print(f"Encyclopedia JSON parse error: {e}\nRaw: {response.text[:500]}")
        return []
