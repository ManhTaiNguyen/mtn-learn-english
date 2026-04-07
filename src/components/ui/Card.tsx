import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  hoverable?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ active = false, hoverable = true, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border-2 border-duo-gray rounded-2xl p-4 transition-all",
          hoverable && "hover:bg-gray-50 cursor-pointer active:translate-y-[2px]",
          active && "border-duo-blue bg-blue-50/50",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
