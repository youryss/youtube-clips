"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const errorMessage = error.message || "An unexpected error occurred";
  const isNotFound =
    errorMessage.includes("not found") ||
    errorMessage.includes("Clip not found");
  const isUnauthorized = errorMessage.includes("Unauthorized");

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          {isNotFound
            ? "Clip Not Found"
            : isUnauthorized
            ? "Unauthorized"
            : "Error Loading Clip"}
        </h1>

        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded">
          <p className="text-sm font-medium text-destructive mb-1">
            Error Details:
          </p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {isNotFound && (
          <div className="mb-6 p-4 bg-muted rounded">
            <p className="text-sm text-muted-foreground mb-4">
              The clip could not be found. It may not exist, or you may not have
              permission to access it.
            </p>
            <p className="text-sm text-muted-foreground mb-2">You can:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
              <li>Check the clips list to find valid clip IDs</li>
              <li>Create a new job to generate clips</li>
              <li>Verify you&apos;re logged in with the correct account</li>
            </ul>
          </div>
        )}

        {isUnauthorized && (
          <div className="mb-6 p-4 bg-muted rounded">
            <p className="text-sm text-muted-foreground mb-4">
              Your session may have expired. Please log in again to continue.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {!isUnauthorized && (
            <>
              <Button asChild variant="outline">
                <Link href="/clips">← Back to Clips</Link>
              </Button>
              <Button onClick={reset} variant="default">
                Try Again
              </Button>
            </>
          )}
          {isUnauthorized && (
            <Button asChild variant="default">
              <Link href="/login">Go to Login</Link>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
