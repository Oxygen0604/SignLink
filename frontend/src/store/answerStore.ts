import { create } from 'zustand';
import { answerWebSocketManager } from '../api';

export interface AnswerRecord {
    id: string;
    date: string;
    score: number;
    totalQuestions: number;
    duration: number; // 秒
}

export interface Question {
    id: string;
    image: string;
    name: string;
    correct: boolean;
    feedback: string;
}

interface AnswerState {
    // 状态
    currentScore: number;
    records: AnswerRecord[];
    leaderboard: Array<{
        id: string;
        name: string;
        score: number;
        rank: number;
    }>;
    
    // 答题相关状态
    currentQuestion: Question | null;
    questions: Question[];
    isCameraActive: boolean;
    isSubmitting: boolean;
    
    // Actions
    addRecord: (record: AnswerRecord) => void;
    setCurrentScore: (score: number) => void;
    clearRecords: () => void;
    
    // 答题相关操作
    setQuestions: (questions: Question[]) => void;
    setCurrentQuestion: (question: Question) => void;
    updateQuestionFeedback: (questionId: string, correct: boolean, feedback: string) => void;
    toggleCamera: (active?: boolean) => void;
    setCameraActive: (active: boolean) => void;
    setSubmitting: (submitting: boolean) => void;
    getWebSocketManager: () => typeof answerWebSocketManager;
}

export const useAnswerStore = create<AnswerState>((set) => ({
    // 初始状态
    currentScore: 0,
    records: [],
    leaderboard: [
        { id: '1', name: '用户A', score: 95, rank: 1 },
        { id: '2', name: '用户B', score: 88, rank: 2 },
        { id: '3', name: '用户C', score: 85, rank: 3 },
    ],
    
    // 答题初始状态
    currentQuestion: null,
    questions: [],
    isCameraActive: false,
    isSubmitting: false,

    // 添加答题记录
    addRecord: (record: AnswerRecord) => {
        set((state) => ({
            records: [record, ...state.records],
        }));
    },

    // 设置当前分数
    setCurrentScore: (score: number) => {
        set({ currentScore: score });
    },

    // 清空记录
    clearRecords: () => {
        set({ records: [] });
    },
    
    // 设置问题列表
    setQuestions: (questions: Question[]) => {
        set({ questions });
    },
    
    // 设置当前问题
    setCurrentQuestion: (question: Question) => {
        set({ currentQuestion: question });
    },
    
    // 更新问题反馈
    updateQuestionFeedback: (questionId: string, correct: boolean, feedback: string) => {
        set((state) => ({
            questions: state.questions.map(q => 
                q.id === questionId ? { ...q, correct, feedback } : q
            ),
            currentQuestion: state.currentQuestion?.id === questionId 
                ? { ...state.currentQuestion, correct, feedback } 
                : state.currentQuestion
        }));
    },
    
    // 切换摄像头状态
    toggleCamera: (active) => set((state) => {
        const newState = active !== undefined ? active : !state.isCameraActive;
        return { isCameraActive: newState };
    }),
    
    // 设置摄像头状态
    setCameraActive: (active) => {
        set({ isCameraActive: active });
    },
    
    // 设置提交状态
    setSubmitting: (submitting: boolean) => {
        set({ isSubmitting: submitting });
    },
    
    // 获取WebSocket管理器
    getWebSocketManager: () => answerWebSocketManager,
}));

