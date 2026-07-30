"""
alembic/env.py
~~~~~~~~~~~~~~
Alembic ortam konfigürasyonu.
- DATABASE_URL .env dosyasından okunur.
- models.Base.metadata ile auto-generate migration desteği açıktır.
"""
import os
import sys
from logging.config import fileConfig

from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

from alembic import context

# .env'i yükle
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Proje kökünü Python path'e ekle (app.models import için)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Alembic Config nesnesi — alembic.ini'den ayarları okur
config = context.config

# Logging yapılandırması
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# DATABASE_URL'i .env'den al ve alembic config'e set et
database_url = os.getenv("DATABASE_URL", "").strip('"').strip("'")
config.set_main_option("sqlalchemy.url", database_url)

# Model metadata'sını import et — auto-generate için şart
from app.models import Base  # noqa: E402
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Offline modda migration çalıştır (DB bağlantısı olmadan SQL üretir)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Online modda migration çalıştır (gerçek DB bağlantısı kurar)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
