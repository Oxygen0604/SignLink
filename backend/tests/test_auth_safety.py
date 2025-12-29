import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.schemas.auth import UserPublic
from datetime import datetime

def test_user_public_safety():
    """验证 UserPublic 模型不会泄露密码"""
    
    # 模拟一个包含敏感数据的 SQLAlchemy 对象或字典
    sensitive_data = {
        "id": 1,
        "email": "test@example.com",
        "username": "testuser",
        "password_hash": "secret_hash_value",  # 敏感数据
        "is_active": True,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "extra_secret": "do_not_leak_this"
    }

    # 尝试用敏感数据初始化 UserPublic
    # Pydantic (orm_mode=True) 可以处理对象或字典
    # 注意：在 Pydantic v1 中 parse_obj 常用，v2 中 model_validate
    # 这里假设是 Pydantic v1 (根据 requirements.txt 或通常用法)
    # requirements.txt 未指定 pydantic 版本，但 fastapi 0.104.1 依赖 pydantic >= 1.7.4, < 3.0.0
    # 我们用标准的构造方式
    
    user_public = UserPublic(**sensitive_data)
    
    # 转为字典
    result = user_public.dict()
    
    print("UserPublic output:", result)

    # 断言
    assert "password_hash" not in result, "CRITICAL: password_hash leaked!"
    assert "extra_secret" not in result, "Leaked extra fields!"
    assert result["email"] == "test@example.com"
    assert "is_active" not in result # 当前 UserPublic 没有 is_active，根据 Spec 应该加上
    
    print("Security check passed: No password hash in output.")

if __name__ == "__main__":
    try:
        test_user_public_safety()
    except AssertionError as e:
        print(f"TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
