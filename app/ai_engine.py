# app/ai_engine.py

def analyze_clinical_case(patient_age: int, symptoms: str, wbc: float = None, heart_rate: int = None) -> str:
    """
    Hastanın verilerini alarak yapay zeka simülasyonu (kural tabanlı analiz) yapar.
    Gerçek bir projede burası harici bir AI modeline (Örn: ChatGPT API) istek atacak şekilde güncellenebilir.
    """
    symptoms_lower = symptoms.lower()
    analysis_result = "### 🧠 AI Karar Destek Sistemi Analizi\n\n"

    # 1. Kan Değeri Analizi (WBC - Beyaz Kan Hücresi)
    if wbc:
        if wbc > 10000:
            analysis_result += "⚠️ **Kritik Uyarı:** Lökositoz (WBC yüksekliği) tespit edildi. Bakteriyel enfeksiyon riski yüksek.\n"
        elif wbc < 4000:
            analysis_result += "⚠️ **Kritik Uyarı:** Lökopeni (WBC düşüklüğü) tespit edildi. Viral enfeksiyon veya bağışıklık sistemi baskılanması araştırılmalı.\n"
        else:
            analysis_result += "✅ Kan değerleri (WBC) normal referans aralığında.\n"

    # 2. Semptom Analizi ve Olası Tanılar
    analysis_result += "\n**🔍 Olası Tanılar (Differential Diagnosis):**\n"
    if "baş ağrısı" in symptoms_lower:
        analysis_result += "- Primer baş ağrısı sendromları (Migren, Gerilim tipi baş ağrısı)\n"
        analysis_result += "- Sekonder nedenlerin dışlanması önerilir (Hipertansiyon vb.)\n"
    elif "ateş" in symptoms_lower or "öksürük" in symptoms_lower:
        analysis_result += "- Üst/Alt Solunum Yolu Enfeksiyonu (Viral/Bakteriyel)\n"
        analysis_result += "- Pnömoni (Eğer solunum sıkıntısı da tabloya eşlik ediyorsa)\n"
    elif "göğüs ağrısı" in symptoms_lower:
        analysis_result += "- Akut Koroner Sendrom (Acil EKG ve Troponin takibi önerilir!)\n"
        analysis_result += "- Pulmoner Emboli\n"
    else:
        analysis_result += "- Belirtilen semptomlar spesifik bir patern oluşturmadı. Daha detaylı klinik muayeneye ihtiyaç var.\n"

    # 3. Genel Tedavi ve Yaklaşım Tavsiyesi
    analysis_result += "\n**💊 Yaklaşım Tavsiyesi:**\n"
    if patient_age > 65:
        analysis_result += "- Dikkat: Hasta geriatrik grupta (65+ yaş) olduğu için ilaç dozajları böbrek/karaciğer fonksiyonlarına göre dikkatle ayarlanmalıdır.\n"
    
    analysis_result += "- Kesin tanı için semptomlara yönelik görüntüleme ve ek laboratuvar sonuçları beklenmelidir.\n"

    return analysis_result