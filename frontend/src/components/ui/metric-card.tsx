"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const iconColorClasses = {
  primary: "bg-primary-100 text-primary-600",
  success: "bg-success-100 text-success-600",
  warning: "bg-warning-100 text-warning-600",
  error: "bg-error-100 text-error-600",
  info: "bg-primary-100 text-primary-600",
};

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  iconColor?: keyof typeof iconColorClasses;
  change?: {
    value: number;
    label?: string;
  };
  description?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  iconColor = "primary",
  change,
  description,
  className,
  ...props
}: MetricCardProps) {
  return (
    <Card className={cn("", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change && (
              <p
                className={cn(
                  "text-xs font-medium",
                  change.value >= 0 ? "text-success" : "text-error"
                )}
              >
                {change.value >= 0 ? "+" : ""}
                {change.value}%{change.label && ` ${change.label}`}
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                iconColorClasses[iconColor]
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
