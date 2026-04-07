import { create } from "zustand";

export interface QuestionData {
  id: number;
  type: string;
  data_json: any; // Contains text, options, correctAnswer
  score_weight: number;
  explanation: string | null;
}

interface PracticeState {
  questions: QuestionData[];
  currentIndex: number;
  score: number;
  hearts: number;
  status: "idle" | "correct" | "incorrect" | "finished";
  selectedOption: string | null;
  isLoading: boolean;

  // Actions
  setQuestions: (questions: QuestionData[]) => void;
  setLoading: (isLoading: boolean) => void;
  selectOption: (option: string) => void;
  checkAnswer: () => void;
  nextQuestion: () => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  score: 0,
  hearts: 5,
  status: "idle",
  selectedOption: null,
  isLoading: false,

  setQuestions: (questions) =>
    set({
      questions,
      currentIndex: 0,
      score: 0,
      hearts: 5,
      status: "idle",
      selectedOption: null,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  selectOption: (option) => {
    if (get().status === "idle") {
      set({ selectedOption: option });
    }
  },

  checkAnswer: () => {
    const { questions, currentIndex, selectedOption, hearts } = get();
    const currentQuestion = questions[currentIndex];

    if (!selectedOption) return;

    if (selectedOption === currentQuestion.data_json.correctAnswer) {
      set({ status: "correct", score: get().score + (currentQuestion.score_weight * 10) });
    } else {
      set({ status: "incorrect", hearts: Math.max(0, hearts - 1) });
    }
  },

  nextQuestion: () => {
    const { currentIndex, questions, hearts } = get();

    if (hearts <= 0 || currentIndex >= questions.length - 1) {
      set({ status: "finished" });
    } else {
      set({
        currentIndex: currentIndex + 1,
        status: "idle",
        selectedOption: null,
      });
    }
  },

  reset: () =>
    set({
      currentIndex: 0,
      score: 0,
      hearts: 5,
      status: "idle",
      selectedOption: null,
      isLoading: false,
    }),
}));
