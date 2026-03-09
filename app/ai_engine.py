# app/ai_engine.py
import os
import json
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
    
    # 1. Gemini İstemcisini Başlat (GEMINI_API_KEY .env dosyasından otomatik alınır)
    client = genai.Client()

    # 2. Sistem İstemini (Prompt) Hazırla
    system_instruction = (
        "Sen 20 yıllık tecrübeye sahip, uluslararası board sertifikalı bir uzman doktorsun. "
        "Amacın klinisyene ikinci bir görüş sunmaktır. "
        "ASLA halüsinasyon yapma, emin olmadığın hiçbir teşhisi uydurma. "
        "Eğer veriler yetersizse açıkça belirt. "
        "Yanıtını SADECE istenilen JSON formatında ver."
    )

    # 3. İletilecek Klinik Veriyi Hazırla
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

    # 4. Modeli Çağır ve JSON Çıktısı Zorla
    response = client.models.generate_content(
        model='gemini-2.5-flash', # Or gemini-3.1-flash depending on exact availability, matching standard prompt.
        contents=clinical_data,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2, # Halüsinasyonu önlemek için düşük sıcaklık
            response_mime_type="application/json",
            response_schema=AIAnalysisResponse,
        ),
    )

    # 5. Dönüşü Dict olarak ayrıştır
    # The API returns a JSON string in response.text according to the schema
    try:
        result_json = json.loads(response.text)
        return result_json
    except Exception as e:
        print(f"JSON Ayrıştırma Hatası: {e}")
        # Hata durumunda güvenli bir yedek dön
        return {
            "risk_level": "Bilinmeyen",
            "confidence_score": 0,
            "differential_diagnoses": ["Veri işlenemedi / API hatası"],
            "clinical_recommendations": ["Lütfen hastayı manuel değerlendirin"]
        }