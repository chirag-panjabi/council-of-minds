import { describe, it, expect } from 'vitest';
import { routes } from '../routes';

describe('Route Helpers', () => {
  it('should provide static routes correctly', () => {
    expect(routes.home).toBe('/');
    expect(routes.onboarding).toBe('/onboarding');
    expect(routes.settings).toBe('/settings');
    expect(routes.personas).toBe('/personas');
    expect(routes.personaCreate).toBe('/personas/create');
    expect(routes.chatOneOnOneNew).toBe('/chat/1-on-1');
    expect(routes.chatCouncilNew).toBe('/chat/council');
    expect(routes.analytics).toBe('/analytics');
  });

  it('should generate dynamic persona edit route', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(routes.personaEdit(id)).toBe(`/personas/edit/${id}`);
  });

  it('should encode dynamic parameters in persona edit route', () => {
    const maliciousId = 'invalid/path?query=1';
    expect(routes.personaEdit(maliciousId)).toBe('/personas/edit/invalid%2Fpath%3Fquery%3D1');
  });

  it('should generate dynamic 1-on-1 chat route', () => {
    const sessionId = 'session-123';
    expect(routes.chatOneOnOne(sessionId)).toBe('/chat/1-on-1/session-123');
  });

  it('should encode dynamic parameters in 1-on-1 chat route', () => {
    const maliciousId = 'invalid/path#hash';
    expect(routes.chatOneOnOne(maliciousId)).toBe('/chat/1-on-1/invalid%2Fpath%23hash');
  });

  it('should generate dynamic council chat route', () => {
    const sessionId = 'council-456';
    expect(routes.chatCouncil(sessionId)).toBe('/chat/council/council-456');
  });

  it('should encode dynamic parameters in council chat route', () => {
    const maliciousId = '<script>alert(1)</script>';
    expect(routes.chatCouncil(maliciousId)).toBe('/chat/council/%3Cscript%3Ealert(1)%3C%2Fscript%3E');
  });
});
