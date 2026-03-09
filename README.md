# 🏥 Clinical Case Share & AI Diagnostic Platform

Bu proje, doktorların ve sağlık profesyonellerinin klinik vakaları (Case Reports) güvenli bir şekilde paylaşabildiği, hastaların anlık vitallerini takip edebildiği ve entegre **Yapay Zeka Karar Destek Sistemi (AI Diagnostic Engine)** ile teşhis süreçlerini hızlandıran modern bir Med-Tech (Tıbbi Teknoloji) platformudur.


## ✨ Öne Çıkan Özellikler

* **🧠 AI Karar Destek Motoru (AI Diagnostic Engine):** Hastanın semptomlarını, kan değerlerini (WBC, Glukoz) ve vitallerini (Nabız, SpO2) analiz ederek risk seviyesi, güven skoru ve olası tanılar (Differential Diagnoses) üreten kural tabanlı/algoritmik zeka.
* **📊 Gelişmiş Hasta Panosu (Patient Dashboard):** Tailwind CSS ve Recharts kullanılarak tasarlanmış, doktorlara özel, modern ve ferah "Master-Detail" görünümlü klinik veri panosu.
* **🔐 Güvenli Kimlik Doğrulama:** FastAPI OAuth2 ve JWT (JSON Web Tokens) ile rol tabanlı (Doktor/Hasta) erişim kontrolü ve şifrelenmiş veri yönetimi.
* **🏥 Yapılandırılmış Klinik Veri:** Semptomlar, teşhisler, tedavi planları ve laboratuvar sonuçlarının PostgreSQL ilişkisel veritabanında (SQLAlchemy ORM) modüler olarak saklanması.

## 🛠️ Kullanılan Teknolojiler

**Backend (API Motoru):**
* Python 3.12+
* FastAPI (Asenkron API Geliştirme)
* SQLAlchemy (ORM) & Pydantic (Veri Doğrulama)
* PostgreSQL (İlişkisel Veritabanı)
* Passlib & Bcrypt (Şifreleme)

**Frontend (Kullanıcı Arayüzü):**
* Next.js & React (Turbopack ile hızlı derleme)
* Tailwind CSS (Modern ve duyarlı tasarım)
* Lucide React (Tıbbi ve profesyonel ikonlar)
* Recharts (Vital veri trend grafikleri)
* Axios (API İstek Yönetimi)

---

## 🚀 Kurulum ve Çalıştırma Rehberi

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin.

### 1. Ön Koşullar
* Bilgisayarınızda **Python 3.12+**, **Node.js** ve **PostgreSQL** kurulu olmalıdır.
* PostgreSQL üzerinde boş bir veritabanı oluşturun (Örn: `case_share_db`).

### 2. Backend (FastAPI) Kurulumu

```bash
# Proje dizinine gidin
cd case-share-api

# Sanal ortam (Virtual Environment) oluşturun ve aktifleştirin
python -m venv venv
source venv/bin/activate  # Windows için: venv\Scripts\activate

# Gerekli kütüphaneleri yükleyin
pip install -r requirements.txt
