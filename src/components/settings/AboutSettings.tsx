"use client";

import * as React from 'react';

export function AboutSettings() {
  return (
    <section aria-labelledby="about-setup-title" className="space-y-6 rounded-xl border bg-card p-5 shadow-sm mt-6">
      <div>
        <h2 id="about-setup-title" className="text-xl font-semibold">About</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Application metadata and useful links.
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="font-medium">Version</span>
          <span className="text-muted-foreground">v1.0.0</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b">
          <span className="font-medium">Documentation</span>
          <a href="#" className="text-blue-500 hover:underline">View Docs</a>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-medium">Source Code</span>
          <a href="#" className="text-blue-500 hover:underline">GitHub Repository</a>
        </div>
      </div>
    </section>
  );
}
