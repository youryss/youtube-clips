"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressBarVariants = cva(
  "h-2 rounded-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-primary",
        primary: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        error: "bg-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
  showPercentage?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = false,
  showPercentage = false,
  variant,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)} {...props}>
      {(showLabel || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {showLabel && label && (
            <span className="text-muted-foreground">{label}</span>
          )}
          {showPercentage && (
            <span className="font-medium text-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(progressBarVariants({ variant }))}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
