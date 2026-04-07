"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: "green" | "blue" | "danger" | "yellow";
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = "green",
  className,
}) => {
  const colors = {
    green: "bg-duo-green",
    blue: "bg-duo-blue",
    danger: "bg-duo-red",
    yellow: "bg-duo-yellow",
  };

  const barColor = colors[color];

  return (
    <div
      className={cn(
        "relative h-4 w-full bg-duo-gray rounded-full overflow-hidden",
        className
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn("absolute top-0 left-0 h-full rounded-full", barColor)}
      >
        {/* Shine effect */}
        <div className="absolute top-1 left-2 right-2 h-[20%] bg-white/20 rounded-full" />
      </motion.div>
    </div>
  );
};

export default ProgressBar;
