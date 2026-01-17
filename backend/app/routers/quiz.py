"""答题模块路由"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

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

@router.get("/rank", summary="获取排行榜")
def get_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    """
    获取答题排行榜，按正确题目数量降序排列
    """
    # 聚合查询：按user_id分组，统计is_correct=True的数量
    results = db.query(
        RecordModel.user_id, 
        User.username,
        func.count(RecordModel.id).label("score")
    ).join(User, RecordModel.user_id == User.id)\
    .filter(RecordModel.is_correct == True)\
    .group_by(RecordModel.user_id)\
    .order_by(desc("score"))\
    .limit(limit)\
    .all()
    
    # 格式化返回
    leaderboard = []
    for idx, (user_id, username, score) in enumerate(results):
        leaderboard.append({
            "rank": idx + 1,
            "user_id": user_id,
            "username": username,
            "score": score
        })
    
    return leaderboard

@router.get("/stats", summary="获取个人统计信息")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取当前用户的统计数据：总答题数、正确数、准确率、排名
    """
    # 总答题数
    total_count = db.query(RecordModel).filter(RecordModel.user_id == current_user.id).count()
    
    # 正确数
    correct_count = db.query(RecordModel).filter(
        RecordModel.user_id == current_user.id,
        RecordModel.is_correct == True
    ).count()
    
    # 准确率
    accuracy = (correct_count / total_count * 100) if total_count > 0 else 0
    
    # 获取我的分数
    my_score = correct_count
    
    # 统计分数比我高的人数
    # 先构建每个用户的分数子查询
    subquery = db.query(
        RecordModel.user_id,
        func.count(RecordModel.id).label("score")
    ).filter(RecordModel.is_correct == True)\
    .group_by(RecordModel.user_id).subquery()
    
    better_than_me = db.query(func.count(subquery.c.user_id)).filter(subquery.c.score > my_score).scalar()
    rank = better_than_me + 1
    
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "total_questions": total_count,
        "correct_answers": correct_count,
        "accuracy": round(accuracy, 1),
        "rank": rank
    }
