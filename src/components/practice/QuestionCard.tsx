"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: string;
  options: string[];
  selectedOption?: string | null;
  onSelect: (option: string) => void;
  disabled?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  options,
  selectedOption,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto py-10">
      <h2 className="text-3xl font-black text-duo-text tracking-tight leading-tight">
        {question}
      </h2>

      <div className="grid grid-cols-1 gap-3 w-full">
        {options.map((option, index) => {
          const isSelected = selectedOption === option;
          const label = String.fromCharCode(65 + index); // A, B, C...

          return (
            <Card
              key={option}
              active={isSelected}
              onClick={() => !disabled && onSelect(option)}
              className={cn(
                "flex items-center gap-4 p-4 border-b-4",
                isSelected && "border-duo-blue bg-blue-50/50 translate-y-[2px] border-b-0",
                disabled && "opacity-50 pointer-events-none"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg border-2 border-duo-gray flex items-center justify-center font-bold text-sm",
                isSelected && "border-duo-blue bg-blue-50 text-duo-blue"
              )}>
                {label}
              </div>
              <span className="text-lg font-bold text-duo-text">
                {option}
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
