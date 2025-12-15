"""数据库引擎与会话管理"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .core.config import config


def _get_connect_args(database_url: str):
    """SQLite 需要特殊的 connect_args，其他数据库保持默认"""
    if database_url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


engine = create_engine(config.DATABASE_URL, connect_args=_get_connect_args(config.DATABASE_URL))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)
Base = declarative_base()


def get_db():
    """提供数据库会话的依赖"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
