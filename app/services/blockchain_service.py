"""
app/services/blockchain_service.py
────────────────────────────────────
MedToken Blockchain Servis Katmanı.

Polygon Amoy Testnet üzerindeki MedToken akıllı sözleşmesine
web3.py aracılığıyla bağlanır ve reward() fonksiyonunu çağırır.

Kullanım:
    FastAPI BackgroundTasks üzerinden çağrılır.
    Doktor "Doğrula" veya "Nadir Vaka" butonuna basınca,
    API anında 200 OK döner; bu servis arka planda çalışır.

İşlem Durumları (token_transactions.status):
    PENDING  → Blockchain isteği henüz gönderilmedi / gönderildi, sonuç bekleniyor
    SUCCESS  → Zincir işlemi onaylandı, tx_hash alındı
    FAILED   → Hata oluştu (gas, ağ, yetersiz bakiye vb.)
    SKIPPED  → Kullanıcının cüzdan adresi yok; sadece DB'ye kayıt yapıldı
"""

import os
import json
import logging
from sqlalchemy.orm import Session
from web3 import Web3
from web3.exceptions import ContractLogicError

logger = logging.getLogger(__name__)

# ─── Çevre Değişkenleri ─────────────────────────────────────────────────────
RPC_URL               = os.getenv("POLYGON_AMOY_RPC_URL", "https://rpc-amoy.polygon.technology/")
CONTRACT_ADDRESS_RAW  = os.getenv("MEDTOKEN_CONTRACT_ADDRESS", "")
BACKEND_WALLET        = os.getenv("BACKEND_WALLET_ADDRESS", "")
BACKEND_PRIVATE_KEY   = os.getenv("BACKEND_WALLET_PRIVATE_KEY", "")

# ABI dosyasının yolu
_ABI_PATH = os.path.join(os.path.dirname(__file__), "../abi/MedToken.json")

# ─── Web3 Bağlantısı (lazy singleton) ──────────────────────────────────────
_w3: Web3 | None = None
_contract = None


def _get_w3() -> Web3 | None:
    """Web3 bağlantısını döner. Bağlantı kurulamazsa None döner."""
    global _w3
    if _w3 is None or not _w3.is_connected():
        try:
            _w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 30}))
        except Exception as exc:
            logger.error(f"[Blockchain] Web3 bağlantı hatası: {exc}")
            return None
    return _w3


def _get_contract():
    """MedToken sözleşme nesnesini döner."""
    global _contract
    if _contract is None:
        w3 = _get_w3()
        if not w3:
            return None
        try:
            with open(_ABI_PATH) as f:
                abi = json.load(f)
            checksum_addr = Web3.to_checksum_address(CONTRACT_ADDRESS_RAW)
            _contract = w3.eth.contract(address=checksum_addr, abi=abi)
        except Exception as exc:
            logger.error(f"[Blockchain] Sözleşme yükleme hatası: {exc}")
            return None
    return _contract


def is_blockchain_configured() -> bool:
    """Blockchain entegrasyonu için gerekli tüm env değişkenleri set edilmiş mi?"""
    return bool(CONTRACT_ADDRESS_RAW and BACKEND_WALLET and BACKEND_PRIVATE_KEY)


# ─── Ana Fonksiyon ──────────────────────────────────────────────────────────

def send_reward_onchain(
    db: Session,
    tx_id: int,
    wallet_address: str,
    amount_med: int,
    reason: str,
) -> None:
    """
    MedToken akıllı sözleşmesinde reward() fonksiyonunu çağırır.
    FastAPI BackgroundTasks ile arka planda çalıştırılır.

    Args:
        db:             SQLAlchemy session (BackgroundTask'a inject edilir)
        tx_id:          token_transactions tablosundaki kaydın ID'si
        wallet_address: Ödül alacak doktorun MetaMask adresi (0x...)
        amount_med:     Gönderilecek MED miktarı (tam sayı, 18 decimal olmadan)
        reason:         İşlem nedeni (Explorer'da görünür)
    """
    from app.models import TokenTransaction  # circular import önlemek için burada

    def _fail(message: str):
        """Kaydı FAILED olarak işaretle."""
        try:
            tx = db.query(TokenTransaction).filter(TokenTransaction.id == tx_id).first()
            if tx:
                tx.status = "FAILED"
                tx.description = (tx.description or "") + f" | HATA: {message}"
                db.commit()
        except Exception as db_err:
            logger.error(f"[Blockchain] DB FAILED güncellemesi başarısız: {db_err}")

    # ── Yapılandırma kontrolü ──────────────────────────────────────────────
    if not is_blockchain_configured():
        logger.warning("[Blockchain] .env değişkenleri eksik. Blockchain transferi atlanıyor.")
        try:
            tx = db.query(TokenTransaction).filter(TokenTransaction.id == tx_id).first()
            if tx:
                tx.status = "SKIPPED"
                db.commit()
        except Exception:
            pass
        return

    # ── Bağlantı ──────────────────────────────────────────────────────────
    w3 = _get_w3()
    if not w3 or not w3.is_connected():
        _fail("RPC bağlantısı kurulamadı")
        return

    contract = _get_contract()
    if not contract:
        _fail("Sözleşme yüklenemedi")
        return

    # ── Transfer ──────────────────────────────────────────────────────────
    try:
        to_addr    = Web3.to_checksum_address(wallet_address)
        from_addr  = Web3.to_checksum_address(BACKEND_WALLET)
        amount_wei = amount_med * (10 ** 18)

        nonce = w3.eth.get_transaction_count(from_addr, "pending")

        tx_data = contract.functions.reward(to_addr, amount_wei, reason).build_transaction({
            "from":     from_addr,
            "nonce":    nonce,
            "gas":      150_000,
            "gasPrice": w3.eth.gas_price,
        })

        signed   = w3.eth.account.sign_transaction(tx_data, private_key=BACKEND_PRIVATE_KEY)
        tx_hash  = w3.eth.send_raw_transaction(signed.raw_transaction)

        logger.info(f"[Blockchain] TX gönderildi: {tx_hash.hex()} ({amount_med} MED → {wallet_address})")

        # Onay bekle (max 90 saniye)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=90)

        # ── Sonucu DB'ye yaz ───────────────────────────────────────────
        tx_record = db.query(TokenTransaction).filter(TokenTransaction.id == tx_id).first()
        if tx_record:
            if receipt.status == 1:
                tx_record.status         = "SUCCESS"
                tx_record.onchain_tx_hash = tx_hash.hex()
                tx_record.wallet_address  = wallet_address
                logger.info(f"[Blockchain] ✅ Transfer onaylandı: {tx_hash.hex()}")
            else:
                tx_record.status = "FAILED"
                logger.error(f"[Blockchain] ❌ Transfer blokzincirde başarısız: {tx_hash.hex()}")
            db.commit()

    except ContractLogicError as exc:
        logger.error(f"[Blockchain] Sözleşme hatası: {exc}")
        _fail(str(exc))

    except Exception as exc:
        logger.error(f"[Blockchain] Beklenmeyen hata: {exc}", exc_info=True)
        _fail(str(exc))
