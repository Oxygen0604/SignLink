import { create } from 'zustand';

export interface AnswerRecord {
    id: string;
    date: string;
    score: number;
    totalQuestions: number;
    duration: number; // 秒
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
    
    // Actions
    addRecord: (record: AnswerRecord) => void;
    setCurrentScore: (score: number) => void;
    clearRecords: () => void;
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
}));

