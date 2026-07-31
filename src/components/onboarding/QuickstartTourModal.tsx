'use client';

import { useState } from 'react';
import { X, Users, MessageSquare, Sparkles, Shield, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

/* Hallmark · component: QuickstartTourModal · genre: studio · theme: studio · spec: spec_onboarding.md (§10.8) */

interface QuickstartTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickstartTourModal({ isOpen, onClose }: QuickstartTourModalProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('framework-engine:has_seen_quickstart_tour', 'true');
    }
    onClose();
  };

  const steps = [
    {
      num: 1,
      title: 'Dialectic Debate Engine',
      icon: Users,
      iconColor: 'text-[var(--color-accent)]',
      bgColor: 'bg-[var(--color-accent-subtle)]/40',
      description: 'Assemble a Council of Minds to debate dilemmas across multiple personas. Choose Round Robin, Dynamic Moderator, or Free Dialectic execution modes with automatic turn caps.',
    },
    {
      num: 2,
      title: '1-on-1 Thought Partner Dialogues',
      icon: MessageSquare,
      iconColor: 'text-sky-600',
      bgColor: 'bg-sky-500/10',
      description: 'Engage in deep, single-persona consultations with domain experts. Enjoy real-time token streaming, custom context retention strategies, and in-session search (⌘F).',
    },
    {
      num: 3,
      title: 'Persona Studio & Advanced Directives',
      icon: Sparkles,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      description: 'Craft custom personas with structured rules (Tone, Argument Style, Taboo Topics). Track prompt revisions with version history snapshotting and 1-click persona cloning.',
    },
    {
      num: 4,
      title: 'Sovereign BYOK & Privacy Telemetry',
      icon: Shield,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      description: 'Your data stays 100% in local IndexedDB. Audit storage consumption, track 24-hour peak token heatmaps, model efficiency matrices, and zero-egress key inventories.',
    },
  ];

  const current = steps[activeStep - 1];
  const StepIcon = current.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-2xl max-w-xl w-full p-6 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold flex items-center gap-1.5">
              <span>Quickstart Tour</span>
              <span className="text-[var(--color-ink-muted)]">• Step {activeStep} of 4</span>
            </div>
            <h2 className="font-display text-2xl font-normal text-[var(--color-ink)]">
              Welcome to Council of Minds
            </h2>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 rounded focus:outline-none"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num as any)}
              className={`h-1.5 rounded-full transition-all ${
                activeStep === s.num
                  ? 'bg-[var(--color-accent)]'
                  : activeStep > s.num
                  ? 'bg-emerald-500'
                  : 'bg-[var(--color-border)]'
              }`}
              title={`Go to step ${s.num}: ${s.title}`}
            />
          ))}
        </div>

        {/* Active Step Feature Display */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${current.bgColor}`}>
              <StepIcon className={`w-6 h-6 ${current.iconColor}`} />
            </div>
            <div>
              <div className="text-xs font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
                Feature Highlight {current.num}
              </div>
              <h3 className="font-display text-xl text-[var(--color-ink)]">{current.title}</h3>
            </div>
          </div>

          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed font-body">
            {current.description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-hairline)]">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline focus:outline-none"
          >
            Dismiss Tour
          </button>

          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                className="btn-hallmark text-xs gap-1 focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            {activeStep < 4 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none"
              >
                Next Feature <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none"
              >
                Got It! Let’s Begin <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
