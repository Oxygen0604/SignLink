"""认证相关路由"""

import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core import security
from ..core.config import config
from ..crud import user as user_crud
from ..database import get_db
from ..deps import get_current_user
from ..models.user import User
from ..schemas.auth import (
    LoginRequest,
    Message,
    PasswordResetConfirm,
    PasswordResetRequest,
    RegisterRequest,
    TokenResponse,
)
from ..services.email import send_reset_password_email

router = APIRouter(prefix="/auth", tags=["认证"])


def _generate_username(db: Session, email: str, preferred: Optional[str]) -> str:
    """根据邮箱或用户输入生成唯一用户名"""
    if preferred:
        base = preferred.strip()
    else:
        base = email.split("@")[0].strip()
    if not base:
        base = "user"

    candidate = base
    while True:
        if user_crud.get_user_by_username(db, candidate) is None:
            return candidate
        candidate = f"{base}{secrets.randbelow(10000)}"


@router.post("/register", response_model=TokenResponse, summary="用户注册")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = user_crud.normalize_email(payload.email)
    if user_crud.get_user_by_email(db, email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邮箱已被注册")

    username = _generate_username(db, email, payload.username)
    user = user_crud.create_user(db, email=email, password=payload.password, username=username)

    token = security.create_access_token(
        {"sub": str(user.id), "email": user.email, "username": user.username}
    )
    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse, summary="用户登录")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = user_crud.get_user_by_email(db, payload.email)
    if not user or not security.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="邮箱或密码错误")

    user_crud.update_last_login(db, user)
    token = security.create_access_token(
        {"sub": str(user.id), "email": user.email, "username": user.username}
    )
    return TokenResponse(access_token=token, user=user)


@router.post("/request-password-reset", response_model=Message, summary="请求重置密码")
def request_password_reset(
    payload: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if not (config.MAIL_SERVER and config.MAIL_USERNAME and config.MAIL_PASSWORD):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="邮件服务未正确配置，请联系管理员"
        )

    user = user_crud.get_user_by_email(db, payload.email)
    if user:
        raw_token = secrets.token_urlsafe(32)
        user_crud.set_reset_token(db, user, raw_token)
        send_reset_password_email(background_tasks, user.email, raw_token)
    return Message(message="如果邮箱存在，我们已发送密码重置邮件")


@router.post("/reset-password", response_model=Message, summary="重置密码")
def reset_password(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    # 遍历有重置Token的用户以校验哈希
    candidates = (
        db.query(User)
        .filter(User.reset_token_hash.isnot(None))
        .filter(User.reset_token_expires_at.isnot(None))
        .all()
    )

    matched_user = None
    for item in candidates:
        if item.reset_token_expires_at and item.reset_token_expires_at < now:
            continue
        if security.verify_password(payload.token, item.reset_token_hash):
            matched_user = item
            break

    if not matched_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token无效或已过期")

    user_crud.update_password(db, matched_user, payload.new_password)
    user_crud.clear_reset_token(db, matched_user)
    return Message(message="密码已重置，请使用新密码登录")


@router.get("/validate", status_code=status.HTTP_204_NO_CONTENT, summary="验证Token有效性")
def validate_token(current_user: User = Depends(get_current_user)):
    """
    验证当前 Token 是否有效。
    - **成功**: 返回 204 No Content，表示 Token 有效且用户状态正常。
    - **401**: Token 无效、过期或用户不存在。
    - **403**: 用户已被禁用。
    """
    return None
