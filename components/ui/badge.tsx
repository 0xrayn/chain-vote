import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-[0.65rem] tracking-widest transition-colors",
  {
    variants: {
      variant: {
        active:
          "bg-[rgba(0,245,160,0.08)] text-[var(--neon)] border border-[rgba(0,245,160,0.25)]",
        ended:
          "bg-[rgba(74,122,155,0.08)] text-[var(--muted)] border border-[rgba(74,122,155,0.25)]",
        pending:
          "bg-[rgba(255,165,2,0.08)] text-[var(--warn)] border border-[rgba(255,165,2,0.25)]",
        info:
          "bg-[rgba(0,212,255,0.08)] text-[var(--neon2)] border border-[rgba(0,212,255,0.25)]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={{ fontFamily: "var(--font-mono)" }}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
