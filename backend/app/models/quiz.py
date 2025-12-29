"""答题模块模型定义"""

from sqlalchemy import Boolean, Column, DateTime, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..database import Base

class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    content = Column(String(255), nullable=False)  # 题目文字内容
    image_url = Column(String(500), nullable=True)  # 题目关联图片或示例
    answer = Column(String(100), nullable=False)   # 正确答案/语义标签
    difficulty = Column(String(20), default="easy", nullable=False)
    category = Column(String(100), nullable=True)   # 分类：日常用语/字母等
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # 关联记录
    records = relationship("UserQuizRecord", back_populates="question")

class UserQuizRecord(Base):
    __tablename__ = "user_quiz_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    
    user_gesture_result = Column(String(100), nullable=True) # 用户的识别结果
    is_correct = Column(Boolean, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # 关联
    question = relationship("Question", back_populates="records")
    # 如果以后需要从用户查记录，可以在 User 模型里加 relationship
