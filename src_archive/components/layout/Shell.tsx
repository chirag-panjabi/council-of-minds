"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex h-screen bg-background text-foreground selection:bg-primary/20">
      <Sidebar />
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative">
        <div className="mx-auto h-full max-w-5xl p-4 md:p-6 lg:p-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
