import { Persona, PersonaRule } from '@/types';

/* Hallmark · utility: systemPromptAssembler · spec: spec_prompt_system.md (§9.1) */

export interface SystemPromptAssemblyOptions {
  persona: Persona;
  councilRole?: 'chairman' | 'skeptic' | 'synthesizer' | 'member';
  summaryBuffer?: string;
  responseDirective?: string;
}

export function assembleSystemPrompt(options: SystemPromptAssemblyOptions): string {
  const { persona, councilRole, summaryBuffer, responseDirective } = options;

  const sections: string[] = [];

  // 1. Identity & Core Stance
  sections.push(`## IDENTITY & PERSPECTIVE
You are ${persona.name}, a ${persona.role || 'Council Expert'}.
${persona.systemPrompt}`);

  // 2. Advanced Structured Behavioral Rules
  if (persona.advancedRules && persona.advancedRules.length > 0) {
    const activeRules = persona.advancedRules.filter((r: PersonaRule) => r.enabled !== false);
    if (activeRules.length > 0) {
      const rulesFormatted = activeRules
        .map((r: PersonaRule) => `- [${r.category.toUpperCase()}] ${r.content}`)
        .join('\n');
      sections.push(`## ADVANCED BEHAVIORAL DIRECTIVES\n${rulesFormatted}`);
    }
  }

  // 3. Council Debate Role Directive
  if (councilRole) {
    let roleText = '';
    if (councilRole === 'chairman') {
      roleText = 'You are serving as the Chairman of this Council. Guide the debate, synthesize key perspectives, maintain decorum, and drive toward consensus.';
    } else if (councilRole === 'skeptic') {
      roleText = 'You are serving as the Council Skeptic. Rigorously stress-test assumptions, highlight blind spots, uncover edge cases, and challenge premature consensus.';
    } else if (councilRole === 'synthesizer') {
      roleText = 'You are serving as the Council Synthesizer. Review all debater arguments, identify points of agreement and disagreement, and produce a clear consensus briefing.';
    } else {
      roleText = 'You are an active Council Member. Offer sharp, domain-specific insights while directly addressing arguments made by other council debaters.';
    }
    sections.push(`## COUNCIL DEBATE ROLE FRAMEWORK\n${roleText}`);
  }

  // 4. Context Retention Summary Buffer
  if (summaryBuffer && summaryBuffer.trim()) {
    sections.push(`## PRIOR DIALECTIC SUMMARY BRIEFING\n${summaryBuffer.trim()}`);
  }

  // 5. Response Directive
  if (responseDirective && responseDirective.trim()) {
    sections.push(`## CURRENT TURN DIRECTIVE\n${responseDirective.trim()}`);
  }

  return sections.join('\n\n');
}
