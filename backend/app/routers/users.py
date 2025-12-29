"""用户自服务路由"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..crud import user as user_crud
from ..deps import get_current_user
from ..database import get_db
from ..models.user import User
from ..schemas.auth import UpdateUsernameRequest, UserPublic

router = APIRouter(prefix="/users", tags=["用户"])


@router.get("/me", response_model=UserPublic, summary="获取当前用户信息")
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserPublic, summary="更新用户名")
def update_username(
    payload: UpdateUsernameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_username = payload.username.strip()
    if not new_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名不能为空")

    existing = user_crud.get_user_by_username(db, new_username)
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已被占用")

    updated = user_crud.update_username(db, current_user, new_username)
    return updated
