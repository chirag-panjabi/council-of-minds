import { describe, it, expect } from 'vitest';
import { getInitials, generateAvatarSvg } from '../avatar';

describe('avatar utility', () => {
  describe('getInitials', () => {
    it('returns ? for empty name', () => {
      expect(getInitials('')).toBe('?');
    });

    it('returns first two letters of a single word', () => {
      expect(getInitials('Assistant')).toBe('AS');
      expect(getInitials('Bot')).toBe('BO');
    });

    it('returns first letter of first and last word', () => {
      expect(getInitials('Code Expert')).toBe('CE');
      expect(getInitials('Senior Software Engineer')).toBe('SE');
    });
    
    it('handles extra spaces', () => {
      expect(getInitials('  Creative   Writer  ')).toBe('CW');
    });
  });

  describe('generateAvatarSvg', () => {
    it('generates an SVG string containing the initials', () => {
      const svg = generateAvatarSvg('Creative Writer');
      expect(svg).toContain('data:image/svg+xml;utf8,');
      expect(decodeURIComponent(svg)).toContain('CW');
    });
    
    it('is deterministic for the same name', () => {
      const svg1 = generateAvatarSvg('Code Expert');
      const svg2 = generateAvatarSvg('Code Expert');
      expect(svg1).toBe(svg2);
    });
  });
});
