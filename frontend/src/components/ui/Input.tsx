import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function Input({
  className,
  type,
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  ...props
}: InputProps) {
  const inputId = id || React.useId();

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={inputId} className="mb-1.5 block">
          {label}
        </Label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          data-slot="input"
          aria-invalid={!!error}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export { Input };
