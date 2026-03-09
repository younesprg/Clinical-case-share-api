# 🏥 Case-Share AI API: Clinical Decision Support & Case Management

Case-Share AI, sağlık profesyonellerinin (doktorlar) ve hastaların tıbbi vakaları güvenli bir şekilde yönetebildiği, yapay zeka destekli bir klinik karar destek sistemi (Clinical Decision Support System) sunan modern bir Backend API servisidir.

Bu proje, ölçeklenebilir bir yazılım mimarisi, rol bazlı erişim kontrolü (RBAC) ve ilişkisel veritabanı tasarımı prensipleri kullanılarak geliştirilmiştir.

## 🚀 Öne Çıkan Özellikler

* **Rol Bazlı Yetkilendirme (RBAC) & JWT Security:** Sistemde `Doctor` ve `Patient` olmak üzere iki farklı rol bulunur. Endpoints erişimleri JWT (JSON Web Token) ve bcrypt şifreleme algoritmaları ile uçtan uca korunmaktadır.
* **İlişkisel Veritabanı Mimarisi:** PostgreSQL üzerinde SQLAlchemy ORM kullanılarak tasarlanmıştır.
    * *One-to-One:* Vaka (Case) ve Kan Testi (Blood Test) ilişkisi.
    * *Many-to-Many:* Vaka ve Kronik Hastalıklar (Comorbidities) ilişkisi.
* **Yapay Zeka Karar Destek Motoru (Mock AI Engine):** Girilen vital bulgular, kan değerleri (örn: WBC yüksekliği/Lökositoz) ve hasta semptomlarını analiz ederek doktorlara olası tanılar (Differential Diagnosis) ve tedavi tavsiyeleri sunar.
* **Veri Doğrulama (Data Validation):** Pydantic V2 modelleri ile request ve response verileri strict (katı) tip kontrolünden geçirilerek veri bütünlüğü sağlanır.

## Kullanılan Teknolojiler (Tech Stack)

* **Framework:** FastAPI (Python)
* **Database:** PostgreSQL
* **ORM:** SQLAlchemy
* **Data Validation:** Pydantic
* **Authentication:** JWT (python-jose), Passlib (Bcrypt)
* **Server:** Uvicorn

## Kurulum ve Çalıştırma (Local Setup)

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

**1. Repoyu Klonlayın ve Sanal Ortam Oluşturun:**
```bash
git clone [https://github.com/KULLANICI_ADIN/case-share-api.git](https://github.com/KULLANICI_ADIN/case-share-api.git)
cd case-share-api
python -m venv venv
venv\Scripts\activate  # Windows için