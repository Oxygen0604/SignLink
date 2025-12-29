import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.quiz import Question
from app.models.user import User # 确保 User 表也被创建

def seed():
    # 确保表已创建
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 检查是否已有数据
        if db.query(Question).count() > 0:
            print("数据库中已有题目，跳过初始化。")
            return

        initial_questions = [
            Question(
                content="请做出‘你好’的手语手势",
                answer="hello",
                difficulty="easy",
                category="日常用语"
            ),
            Question(
                content="请做出数字‘1’的手语手势",
                answer="1",
                difficulty="easy",
                category="数字"
            ),
            Question(
                content="请做出‘谢谢’的手语手势",
                answer="thanks",
                difficulty="easy",
                category="日常用语"
            ),
            Question(
                content="请做出‘我’的手语手势",
                answer="me",
                difficulty="easy",
                category="代词"
            )
        ]
        
        db.add_all(initial_questions)
        db.commit()
        print(f"成功添加了 {len(initial_questions)} 个初始题目。")
    except Exception as e:
        print(f"初始化失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
