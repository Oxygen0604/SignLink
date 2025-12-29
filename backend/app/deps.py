"""FastAPI 依赖"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from .core.security import decode_token
from .crud import user as user_crud
from .database import get_db
from .models.user import User

http_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User:
    # --- 调试探针 Start ---
    print(f"\n[鉴权调试] 收到请求，正在检查 Token...")
    if credentials is None:
        print("[鉴权调试] ❌ 失败：Header 中没有 Authorization 字段")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="缺少身份令牌")

    token = credentials.credentials
    print(f"[鉴权调试] 🔍 提取到 Token: {token[:10]}... (只显示前10位)")
    
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        print(f"[鉴权调试] ✅ Token 解码成功，用户 ID (sub): {user_id}")
        
        if user_id is None:
            print("[鉴权调试] ❌ 失败：Token Payload 中没有 sub 字段")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="令牌缺少用户信息")
    except JWTError as e:
        print(f"[鉴权调试] ❌ Token 无效或过期: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="令牌无效或已过期")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        print(f"[鉴权调试] ❌ 数据库查找失败：用户 ID {user_id} 不存在")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在")
    
    if not user.is_active:
        print(f"[鉴权调试] ❌ 用户 {user.username} 已被禁用")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="用户已被禁用")

    print(f"[鉴权调试] 🎉 鉴权通过！当前用户: {user.username}")
    # --- 调试探针 End ---

    return user
