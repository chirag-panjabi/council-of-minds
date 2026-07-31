import { Persona, PersonaRule } from '@/types';

/* Hallmark · utility: systemPromptAssembler · spec: spec_prompt_system.md (§9.1 & §9.2) */

export interface SystemPromptAssemblyOptions {
  persona: Persona;
  councilRole?: 'chairman' | 'skeptic' | 'synthesizer' | 'member';
  summaryBuffer?: string;
  responseDirective?: string;
  userName?: string;
  sessionTopic?: string;
}

function expandTemplateVariables(text: string, userName?: string, sessionTopic?: string): string {
  if (!text) return '';

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const effectiveUserName = userName?.trim() || 'User';
  const effectiveTopic = sessionTopic?.trim() || 'General Inquiry';

  return text
    .replace(/\{\{\s*user_name\s*\}\}/gi, effectiveUserName)
    .replace(/\{\{\s*username\s*\}\}/gi, effectiveUserName)
    .replace(/\{\{\s*current_date\s*\}\}/gi, dateFormatted)
    .replace(/\{\{\s*date\s*\}\}/gi, dateFormatted)
    .replace(/\{\{\s*session_topic\s*\}\}/gi, effectiveTopic)
    .replace(/\{\{\s*topic\s*\}\}/gi, effectiveTopic);
}

export function assembleSystemPrompt(options: SystemPromptAssemblyOptions): string {
  const { persona, councilRole, summaryBuffer, responseDirective, userName, sessionTopic } = options;

  const sections: string[] = [];

  // 1. Identity & Core Stance
  const rawSystemPrompt = persona.systemPrompt || '';
  const expandedSystemPrompt = expandTemplateVariables(rawSystemPrompt, userName, sessionTopic);

  sections.push(`## IDENTITY & PERSPECTIVE
You are ${persona.name}, a ${persona.role || 'Council Expert'}.
${expandedSystemPrompt}`);

  // 2. Advanced Structured Behavioral Rules
  if (persona.advancedRules && persona.advancedRules.length > 0) {
    const activeRules = persona.advancedRules.filter((r: PersonaRule) => r.enabled !== false);
    if (activeRules.length > 0) {
      const rulesFormatted = activeRules
        .map((r: PersonaRule) => `- [${r.category.toUpperCase()}] ${expandTemplateVariables(r.content, userName, sessionTopic)}`)
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
    sections.push(`## CURRENT TURN DIRECTIVE\n${expandTemplateVariables(responseDirective.trim(), userName, sessionTopic)}`);
  }

  return sections.join('\n\n');
}
