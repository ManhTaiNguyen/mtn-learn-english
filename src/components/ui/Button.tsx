import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "green" | "blue" | "orange" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "green", size = "md", className, children, ...props }, ref) => {
    const variants = {
      green: "bg-duo-green hover:bg-[#61da02] border-duo-green-dark text-white",
      blue: "bg-duo-blue hover:bg-[#24bcff] border-duo-blue-dark text-white",
      orange: "bg-[#ff9600] hover:bg-[#ffa524] border-[#d77d00] text-white",
      danger: "bg-duo-red hover:bg-[#ff5c5c] border-[#d13b3b] text-white",
      ghost: "bg-transparent hover:bg-gray-100 border-transparent text-gray-500 border-b-0 shadow-none active:translate-y-0",
      outline: "bg-white hover:bg-gray-50 border-duo-gray text-[#afafaf] border-b-4",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
      xl: "px-10 py-5 text-xl uppercase tracking-wider",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center font-bold transition-all rounded-2xl active:translate-y-[2px] active:border-b-0 disabled:opacity-50 disabled:pointer-events-none",
          variant !== "ghost" && "border-b-4 active:mt-[2px]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
