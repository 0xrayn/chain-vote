import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-lg px-4 py-3 text-sm outline-none transition-all duration-200 resize-vertical",
          "placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea";

export { Textarea };
