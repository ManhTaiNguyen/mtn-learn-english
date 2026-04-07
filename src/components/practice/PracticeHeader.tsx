"use client";

import React from "react";
import { X, Heart } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import Link from "next/link";

interface PracticeHeaderProps {
  progress: number;
  hearts?: number;
  onExit?: () => void;
}

const PracticeHeader: React.FC<PracticeHeaderProps> = ({
  progress,
  hearts = 5,
  onExit,
}) => {
  return (
    <header className="flex items-center justify-between gap-4 py-4 px-4 lg:px-0 max-w-5xl mx-auto w-full">
      <button 
        onClick={onExit}
        className="text-[#777777] hover:text-duo-text transition-colors"
        aria-label="Thoát phòng luyện tập"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="flex-1">
        <ProgressBar progress={progress} color="green" />
      </div>

      <div className="flex items-center gap-2">
        <Heart className="w-8 h-8 text-duo-red fill-duo-red" />
        <span className="text-2xl font-black text-duo-red">{hearts}</span>
      </div>
    </header>
  );
};

export default PracticeHeader;
