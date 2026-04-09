import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium tracking-widest transition-all duration-200 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "border border-[var(--neon)] text-[var(--neon)] bg-[rgba(0,245,160,0.05)] hover:bg-[rgba(0,245,160,0.12)] hover:shadow-[0_0_20px_rgba(0,245,160,0.2)]",
        neon2:
          "border border-[var(--neon2)] text-[var(--neon2)] bg-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.12)] hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]",
        ghost:
          "border border-[var(--border)] text-[var(--muted)] bg-transparent hover:border-[var(--muted)] hover:text-[var(--text)]",
        danger:
          "border border-[var(--danger)] text-[var(--danger)] bg-[rgba(255,71,87,0.05)] hover:bg-[rgba(255,71,87,0.12)]",
      },
      size: {
        sm: "px-3 py-1.5 text-[0.65rem]",
        default: "px-4 py-2",
        lg: "px-6 py-3 text-sm",
        icon: "w-9 h-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{ fontFamily: "var(--font-mono)", ...props.style }}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
