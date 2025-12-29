"""认证与用户相关的Pydantic模型"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator


class UserPublic(BaseModel):
    """对外暴露的用户信息"""

    id: int
    email: EmailStr
    username: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class RegisterRequest(BaseModel):
    """注册请求"""

    email: EmailStr = Field(..., description="注册邮箱")
    password: str = Field(..., min_length=8, description="至少8位密码")
    username: Optional[str] = Field(None, description="可选用户名，不传则自动生成")

    @validator("password")
    def validate_password_strength(cls, v: str) -> str:
        if len(v.strip()) < 8:
            raise ValueError("密码长度至少8位")
        return v


class LoginRequest(BaseModel):
    """登录请求"""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """登录/注册返回的令牌"""

    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class PasswordResetRequest(BaseModel):
    """请求重置密码"""

    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """确认重置密码"""

    token: str
    new_password: str = Field(..., min_length=8, description="至少8位的新密码")

    @validator("new_password")
    def validate_new_password(cls, v: str) -> str:
        if len(v.strip()) < 8:
            raise ValueError("密码长度至少8位")
        return v


class UpdateUsernameRequest(BaseModel):
    """更新用户名"""

    username: str = Field(..., min_length=2, max_length=150, description="新用户名")


class Message(BaseModel):
    """通用消息响应"""

    message: str
