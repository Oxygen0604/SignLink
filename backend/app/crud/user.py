"""用户相关的数据库操作"""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from ..core import security
from ..core.config import config
from ..models.user import User


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == normalize_email(email)).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, email: str, password: str, username: str) -> User:
    user = User(
        email=normalize_email(email),
        username=username,
        password_hash=security.get_password_hash(password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_last_login(db: Session, user: User) -> User:
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def set_reset_token(db: Session, user: User, token: str) -> User:
    user.reset_token_hash = security.get_password_hash(token)
    user.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=config.RESET_TOKEN_EXPIRE_MINUTES)
    db.commit()
    db.refresh(user)
    return user


def clear_reset_token(db: Session, user: User) -> User:
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    db.commit()
    db.refresh(user)
    return user


def update_password(db: Session, user: User, new_password: str) -> User:
    user.password_hash = security.get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user


def update_username(db: Session, user: User, new_username: str) -> User:
    user.username = new_username
    db.commit()
    db.refresh(user)
    return user
