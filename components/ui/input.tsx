import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg px-4 py-2 text-sm outline-none transition-all duration-200",
          "placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50",
          "focus:ring-0",
          className
        )}
        style={{
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          fontFamily: "var(--font-syne)",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--neon2)";
          e.target.style.boxShadow = "0 0 10px rgba(0,212,255,0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border)";
          e.target.style.boxShadow = "none";
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
