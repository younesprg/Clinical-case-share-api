# app/ai_engine.py
from typing import Optional

def generate_structured_ai_analysis(
    patient_age: int,
    symptoms: str, 
    heart_rate: Optional[int] = None, 
    oxygen_saturation: Optional[int] = None, 
    blood_pressure: Optional[str] = None,
    glucose_level: Optional[float] = None,
    wbc: Optional[float] = None
) -> dict:
    """
    Simulated algorithmic evaluation of patient metrics that returns a structured
    JSON response suitable for the frontend AI Diagnostic Engine.
    """
    risk_level = "Normal"
    confidence_score = 85
    diagnoses = []
    recommendations = []

    critical_flags = 0
    elevated_flags = 0

    if oxygen_saturation is not None:
        if oxygen_saturation < 90:
            critical_flags += 1
            diagnoses.append("Şiddetli Hipoksi")
            recommendations.append("Acil oksijen desteği gerekli")
        elif oxygen_saturation < 95:
            elevated_flags += 1
            diagnoses.append("Hafif Hipoksi")
            recommendations.append("Oksijen seviyelerini yakından izleyin")

    if heart_rate is not None:
        if heart_rate > 120 or heart_rate < 40:
            critical_flags += 1
            diagnoses.append("Aritmi / Ciddi Anormal Kalp Atış Hızı")
            recommendations.append("Acil EKG ve kardiyoloji konsültasyon")
        elif heart_rate > 100:
            elevated_flags += 1
            diagnoses.append("Taşikardi")
            recommendations.append("Ağrı, ateş veya dehidrasyon açısından değerlendirin")

    if blood_pressure:
        try:
            bps = blood_pressure.split('/')
            if len(bps) == 2:
                sys = int(bps[0])
                dia = int(bps[1])
                if sys > 140 or dia > 90:
                    elevated_flags += 1
                    diagnoses.append("Hipertansiyon")
                    recommendations.append("Tansiyon takibi ve gerekirse antihipertansif tedavi düşünülmeli")
                elif sys < 90 or dia < 60:
                    elevated_flags += 1
                    diagnoses.append("Hipotansiyon")
                    recommendations.append("Sıvı resüsitasyonu ve altta yatan nedenin araştırılması")
        except ValueError:
            pass # Ignore invalid format

    symptoms_low = symptoms.lower() if symptoms else ""
    if "göğüs" in symptoms_low or "chest pain" in symptoms_low or "kalp" in symptoms_low:
        critical_flags += 1
        diagnoses.append("Akut Koroner Sendrom Şüphesi")
        recommendations.append("Acil EKG, Troponin takibi ve sürekli telemetri izlemi")
    
    if "nefes" in symptoms_low or "öksürük" in symptoms_low or "shortness of breath" in symptoms_low:
        elevated_flags += 1
        diagnoses.append("Solunum Sıkıntısı")
        recommendations.append("Akciğer seslerini dinleyin, Akciğer Grafisi düşünün")

    if "bulantı" in symptoms_low or "kusma" in symptoms_low or "nausea" in symptoms_low or "vomiting" in symptoms_low:
        elevated_flags += 1
        diagnoses.append("Gastrointestinal Rahatsızlık / Gastroenterit Şüphesi")
        recommendations.append("Sıvı replasmanı sağlayın, antiemetik tedaviyi değerlendirin")

    if "zehir" in symptoms_low or "zehirlenme" in symptoms_low or "doz aşımı" in symptoms_low or "intoxication" in symptoms_low or "poison" in symptoms_low:
        critical_flags += 1
        diagnoses.append("Zehirlenme / Toksikolojik Acil Durum")
        recommendations.append("Ulusal Zehir Danışma Merkezi (UZEM - 114) ile iletişime geçin, vital bulguları yakından izleyin")

    if patient_age > 65:
        elevated_flags += 1
        recommendations.append("Geriatrik hasta: İlaç dozajlarına dikkat edilmeli")

    # Assuming WBC is in 10^9/L format for this UI (e.g. 6.8) or raw count (6800)
    if wbc is not None:
        if wbc > 11.0 and wbc < 100: # 10^9/L format
            elevated_flags += 1
            diagnoses.append("Lökositoz")
            recommendations.append("Kan kültürleri alınmalı ve ampirik antibiyotik başlanması düşünülmeli")
        elif wbc > 11000: # raw count format
            elevated_flags += 1
            diagnoses.append("Lökositoz")
            recommendations.append("Kan kültürleri alınmalı ve ampirik antibiyotik başlanması düşünülmeli")

    if glucose_level is not None:
        if glucose_level > 200:
            elevated_flags += 1
            diagnoses.append("Hiperglisemi")
            recommendations.append("Kan glukoz takibi, insülin tedavisi düşünülmeli")

    if critical_flags > 0:
        risk_level = "Critical"
        confidence_score = 95
    elif elevated_flags > 1:
        risk_level = "High"
        confidence_score = 88
    elif elevated_flags == 1:
        risk_level = "Elevated"
        confidence_score = 80
    else:
        risk_level = "Normal"
        confidence_score = 92
        diagnoses.append("Akut fizyolojik stres saptanmadı")
        recommendations.append("Rutin bakım ve izleme devam edin")

    # Ensure we always have at least one diagnosis/recommendation
    if not diagnoses:
        diagnoses.append("Daha fazla klinik değerlendirme gerekli")
    if not recommendations:
        recommendations.append("Standart izlem protokolü")

    return {
        "risk_level": risk_level,
        "confidence_score": confidence_score,
        "differential_diagnoses": diagnoses,
        "clinical_recommendations": recommendations
    }