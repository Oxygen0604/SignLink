"""答题模块 Pydantic 模型"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class QuestionBase(BaseModel):
    content: str
    image_url: Optional[str] = None
    answer: str
    difficulty: str = "easy"
    category: Optional[str] = None

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class QuizSubmission(BaseModel):
    question_id: int
    user_gesture_result: str

class QuizResult(BaseModel):
    is_correct: bool
    correct_answer: str
    message: str

class UserQuizRecordBase(BaseModel):
    question_id: int
    user_gesture_result: str
    is_correct: bool

class UserQuizRecord(UserQuizRecordBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
