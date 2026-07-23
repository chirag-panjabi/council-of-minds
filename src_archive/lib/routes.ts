/**
 * Route helpers for the Framework Engine application.
 * Centralizes all URL string generation to ensure consistent and type-safe routing.
 */

export const routes = {
  /** Root landing or dashboard */
  home: '/',
  
  /** Onboarding flow */
  onboarding: '/onboarding',
  
  /** Global application settings */
  settings: '/settings',
  
  /** Persona library and management */
  personas: '/personas',
  
  /** Create a new persona */
  personaCreate: '/personas/create',
  
  /** Edit an existing persona by ID */
  personaEdit: (id: string) => `/personas/edit/${encodeURIComponent(id)}`,
  
  /** New 1-on-1 chat session */
  chatOneOnOneNew: '/chat/1-on-1',
  
  /** Existing 1-on-1 chat session by ID */
  chatOneOnOne: (sessionId: string) => `/chat/1-on-1/${encodeURIComponent(sessionId)}`,
  
  /** New Council chat session */
  chatCouncilNew: '/chat/council',
  
  /** Existing Council chat session by ID */
  chatCouncil: (sessionId: string) => `/chat/council/${encodeURIComponent(sessionId)}`,
  
  /** Global analytics dashboard */
  analytics: '/analytics',
};
