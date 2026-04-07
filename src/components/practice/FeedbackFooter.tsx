"use client";

import React from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FeedbackFooterProps {
  status: "idle" | "correct" | "incorrect";
  onCheck: () => void;
  onNext: () => void;
  explanation?: string;
  disabled?: boolean;
}

const FeedbackFooter: React.FC<FeedbackFooterProps> = ({
  status,
  onCheck,
  onNext,
  explanation,
  disabled = false,
}) => {
  const isCorrect = status === "correct";
  const isIncorrect = status === "incorrect";
  const isAnswered = isCorrect || isIncorrect;

  return (
    <footer className={cn(
      "fixed bottom-0 left-0 right-0 border-t-2 border-duo-gray bg-white transition-all z-50",
      isCorrect && "bg-[#d7ffb8] border-[#a5e374]",
      isIncorrect && "bg-[#ffdfdf] border-[#ffb8b8]"
    )}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between p-6 gap-6 min-h-[140px]">
        {!isAnswered ? (
          <div className="hidden md:block">
            <span className="text-gray-400 font-bold uppercase tracking-wider">
              Chọn đáp án đúng nhất
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-4 flex-1">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shrink-0",
              isCorrect ? "bg-white text-duo-green" : "bg-white text-duo-red"
            )}>
              {isCorrect ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className={cn(
                "text-2xl font-black",
                isCorrect ? "text-[#58a700]" : "text-[#ea2b2b]"
              )}>
                {isCorrect ? "Chính xác!" : "Sai rồi!"}
              </h3>
              {explanation && (
                <p className={cn(
                  "text-lg font-bold flex items-center gap-2",
                  isCorrect ? "text-[#58a700]" : "text-[#ea2b2b]"
                )}>
                  <Info className="w-5 h-5" />
                  {explanation}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="w-full md:w-auto">
          {!isAnswered ? (
            <Button
              variant="green"
              size="lg"
              className="w-full md:w-48"
              onClick={onCheck}
              disabled={disabled}
            >
              KIỂM TRA
            </Button>
          ) : (
            <Button
              variant={isCorrect ? "green" : "danger"}
              size="lg"
              className="w-full md:w-48"
              onClick={onNext}
            >
              TIẾP TỤC
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
};

export default FeedbackFooter;
