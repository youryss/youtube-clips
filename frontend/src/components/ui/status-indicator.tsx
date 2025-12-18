"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        pending: "bg-neutral-100 text-neutral-700",
        downloading: "bg-primary-100 text-primary-700",
        transcribing: "bg-primary-100 text-primary-700",
        analyzing: "bg-warning-100 text-warning-700",
        slicing: "bg-warning-100 text-warning-700",
        completed: "bg-success-100 text-success-700",
        failed: "bg-error-100 text-error-700",
        cancelled: "bg-neutral-100 text-neutral-700",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
);

const statusLabels: Record<string, string> = {
  pending: "Pending",
  downloading: "Downloading",
  transcribing: "Transcribing",
  analyzing: "Analyzing",
  slicing: "Slicing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const statusDotColors: Record<string, string> = {
  pending: "bg-neutral-500",
  downloading: "bg-primary-500 animate-pulse",
  transcribing: "bg-primary-500 animate-pulse",
  analyzing: "bg-warning-500 animate-pulse",
  slicing: "bg-warning-500 animate-pulse",
  completed: "bg-success-500",
  failed: "bg-error-500",
  cancelled: "bg-neutral-500",
};

type StatusType =
  | "pending"
  | "downloading"
  | "transcribing"
  | "analyzing"
  | "slicing"
  | "completed"
  | "failed"
  | "cancelled";

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  showDot?: boolean;
}

export function StatusIndicator({
  status,
  showDot = true,
  className,
  ...props
}: StatusIndicatorProps) {
  const validStatus = (
    status in statusLabels ? status : "pending"
  ) as StatusType;

  return (
    <span
      className={cn(statusVariants({ status: validStatus, className }))}
      {...props}
    >
      {showDot && (
        <span
          className={cn("size-1.5 rounded-full", statusDotColors[validStatus])}
        />
      )}
      {statusLabels[validStatus]}
    </span>
  );
}
