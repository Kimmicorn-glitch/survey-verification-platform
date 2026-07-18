import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Survey Builder Store
 * Manages state for the survey creation/editing form builder.
 */

export interface SurveyQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multi-select' | 'radio' | 'checkbox' | 'rating' | 'date' | 'number' | 'email' | 'phone';
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
}

interface SurveyBuilderState {
  title: string;
  description: string;
  questions: SurveyQuestion[];
  isDirty: boolean;

  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  addQuestion: (question: SurveyQuestion) => void;
  updateQuestion: (id: string, updates: Partial<SurveyQuestion>) => void;
  removeQuestion: (id: string) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
}

const initialState = {
  title: '',
  description: '',
  questions: [],
  isDirty: false,
};

export const useSurveyBuilderStore = create<SurveyBuilderState>()(
  devtools((set) => ({
    ...initialState,

    setTitle: (title) =>
      set({ title, isDirty: true }),

    setDescription: (description) =>
      set({ description, isDirty: true }),

    addQuestion: (question) =>
      set((state) => ({
        questions: [...state.questions, question],
        isDirty: true,
      })),

    updateQuestion: (id, updates) =>
      set((state) => ({
        questions: state.questions.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        ),
        isDirty: true,
      })),

    removeQuestion: (id) =>
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== id),
        isDirty: true,
      })),

    reorderQuestions: (fromIndex, toIndex) =>
      set((state) => {
        const questions = [...state.questions];
        const [removed] = questions.splice(fromIndex, 1);
        questions.splice(toIndex, 0, removed);
        return {
          questions: questions.map((q, i) => ({ ...q, order: i })),
          isDirty: true,
        };
      }),

    reset: () => set(initialState),
  }))
);
