"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

export function LoadingSpinner({
  size = "md",
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
