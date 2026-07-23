"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background text-foreground">
          <div className="flex max-w-md flex-col items-center justify-center space-y-6 rounded-xl border border-border/50 bg-card p-8 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Catastrophic Error</h2>
              <p className="text-sm text-muted-foreground">
                The application encountered a critical error and could not recover.
              </p>
            </div>
            
            <button
              onClick={() => reset()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
