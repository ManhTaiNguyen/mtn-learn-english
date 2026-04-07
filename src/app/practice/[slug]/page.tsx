"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePracticeStore, QuestionData } from "@/hooks/usePracticeStore";
import PracticeHeader from "@/components/practice/PracticeHeader";
import QuestionCard from "@/components/practice/QuestionCard";
import FeedbackFooter from "@/components/practice/FeedbackFooter";
import Button from "@/components/ui/Button";
import { Trophy } from "lucide-react";
import confetti from "canvas-confetti";

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    questions,
    currentIndex,
    hearts,
    status,
    selectedOption,
    setQuestions,
    setLoading,
    isLoading,
    selectOption,
    checkAnswer,
    nextQuestion,
    score,
    reset,
  } = usePracticeStore();

  useEffect(() => {
    setMounted(true);
    
    async function initPractice() {
      const slug = params.slug as string;
      setLoading(true);
      setError(null);

      try {
        // 1. Initialize session
        await fetch("/api/sessions/init", { method: "POST" });

        // 2. Fetch exam details
        const res = await fetch(`/api/exam-sets/${slug}`);
        const result = await res.json();

        if (result.status === "success") {
          const examSet = result.data;
          // For now, take the first exam (e.g., Reading)
          const exam = examSet.exams[0];
          if (exam && exam.parts.length > 0) {
            const allQuestions = exam.parts.flatMap((p: any) => p.questions);
            setQuestions(allQuestions);
          } else {
            setError("Bộ đề này hiện chưa có nội dung câu hỏi.");
          }
        } else {
          setError(result.message || "Không thể tải dữ liệu bộ đề.");
        }
      } catch (err) {
        console.error("Failed to fetch practice data:", err);
        setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    }

    initPractice();
    
    return () => reset();
  }, [params.slug, setQuestions, setLoading, reset]);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-duo-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-gray-500 italic">Đang tải bài học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-6">
        <h1 className="text-2xl font-black text-red-500 uppercase tracking-wider">Lỗi rồi!</h1>
        <p className="text-gray-500 font-bold">{error}</p>
        <Button variant="green" size="xl" onClick={() => router.push("/")}>
          QUAY LẠI TRANG CHỦ
        </Button>
      </div>
    );
  }

  if (questions.length === 0) return null;

  if (status === "finished" || hearts <= 0) {
    if (status === "finished" && hearts > 0) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 gap-8">
        <div className="w-48 h-48 bg-duo-yellow rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <Trophy className="w-24 h-24 text-white" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-duo-text uppercase tracking-wider">
            {hearts > 0 ? "Tuyệt vời!" : "Cố gắng lên!"}
          </h1>
          <p className="text-xl font-bold text-gray-400">
            Bạn đã hoàn thành bài luyện tập với {score} điểm!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Button
            variant="green"
            size="xl"
            className="flex-1"
            onClick={() => window.location.reload()}
          >
            LÀM LẠI
          </Button>
          <Button
            variant="outline"
            size="xl"
            className="flex-1"
            onClick={() => router.push("/")}
          >
            VỀ TRANG CHỦ
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PracticeHeader
        progress={progress}
        hearts={hearts}
        onExit={() => router.push("/")}
      />

      <main className="flex-1 overflow-y-auto px-4 lg:px-0">
        <QuestionCard
          question={currentQuestion.data_json.text}
          options={currentQuestion.data_json.options}
          selectedOption={selectedOption}
          onSelect={selectOption}
          disabled={status !== "idle"}
        />
      </main>

      <FeedbackFooter
        status={status}
        onCheck={checkAnswer}
        onNext={nextQuestion}
        explanation={currentQuestion.explanation || undefined}
        disabled={!selectedOption}
      />
    </div>
  );
}
