"""
app/cache.py
~~~~~~~~~~~~
Merkezi Redis async bağlantı modülü.
Tüm cache işlemleri buradan yapılmalıdır.
"""
import os
import logging
from typing import Optional

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

# Singleton redis client
_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    """
    Redis async client döndürür.
    İlk çağrıda bağlantı kurulur; sonrakiler aynı nesneyi kullanır (singleton).
    """
    global _redis_client
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        _redis_client = aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        logger.info(f"Redis bağlantısı kuruldu: {redis_url}")
    return _redis_client


async def close_redis() -> None:
    """Uygulama kapanırken Redis bağlantısını düzgünce kapat."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
        logger.info("Redis bağlantısı kapatıldı.")
