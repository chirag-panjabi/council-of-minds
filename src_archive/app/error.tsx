"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed,
    // but keep keys secure per our architecture.
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center">
      <div className="flex max-w-md flex-col items-center justify-center space-y-6 rounded-xl border border-border/50 bg-card p-8 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Something went wrong!</h2>
          <p className="text-sm text-muted-foreground">
            We encountered an unexpected error. Please try again.
          </p>
        </div>
        
        <button
          onClick={() => reset()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
