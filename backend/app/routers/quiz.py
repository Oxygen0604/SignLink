"""答题模块路由"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models.user import User
from ..models.quiz import Question as QuestionModel, UserQuizRecord as RecordModel
from ..schemas.quiz import Question, QuizSubmission, QuizResult, UserQuizRecord

router = APIRouter(prefix="/quiz", tags=["答题模块"])

@router.get("/questions", response_model=List[Question], summary="获取题目列表")
def get_questions(db: Session = Depends(get_db)):
    """
    获取所有可用题目
    """
    questions = db.query(QuestionModel).all()
    return questions

@router.get("/questions/{question_id}", response_model=Question, summary="获取单个题目详情")
def get_question(question_id: int, db: Session = Depends(get_db)):
    question = db.query(QuestionModel).filter(QuestionModel.id == question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="题目不存在")
    return question

@router.post("/submit", response_model=QuizResult, summary="提交答题结果")
def submit_quiz(
    payload: QuizSubmission, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    提交用户作答结果。
    后端会验证结果是否正确并记录。
    """
    # 查找题目
    question = db.query(QuestionModel).filter(QuestionModel.id == payload.question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="题目不存在")

    # 逻辑判断：用户识别出的结果是否匹配题目答案
    # 这里假设前端传过来的是识别到的标签字符串
    is_correct = (payload.user_gesture_result.lower().strip() == question.answer.lower().strip())
    
    # 创建记录
    record = RecordModel(
        user_id=current_user.id,
        question_id=question.id,
        user_gesture_result=payload.user_gesture_result,
        is_correct=is_correct
    )
    db.add(record)
    db.commit()
    
    return QuizResult(
        is_correct=is_correct,
        correct_answer=question.answer,
        message="恭喜你，回答正确！" if is_correct else f"很遗憾，识别结果为 '{payload.user_gesture_result}'，正确答案应为 '{question.answer}'。"
    )

@router.get("/records", response_model=List[UserQuizRecord], summary="获取个人答题记录")
def get_user_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(RecordModel).filter(RecordModel.user_id == current_user.id).all()
    return records
