import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSessionDateGroup } from '../date-grouping';

describe('date-grouping', () => {
  beforeEach(() => {
    // Mock system time to a fixed date
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('groups today correctly', () => {
    const today = new Date(2024, 0, 15, 8, 0, 0).getTime();
    expect(getSessionDateGroup(today)).toBe('Today');
  });

  it('groups yesterday correctly', () => {
    const yesterday = new Date(2024, 0, 14, 23, 59, 59).getTime();
    expect(getSessionDateGroup(yesterday)).toBe('Yesterday');
  });

  it('groups previous 7 days correctly', () => {
    const threeDaysAgo = new Date(2024, 0, 12, 12, 0, 0).getTime();
    const sevenDaysAgo = new Date(2024, 0, 8, 12, 0, 0).getTime();
    
    expect(getSessionDateGroup(threeDaysAgo)).toBe('Previous 7 Days');
    expect(getSessionDateGroup(sevenDaysAgo)).toBe('Previous 7 Days');
  });

  it('groups older correctly', () => {
    const eightDaysAgo = new Date(2024, 0, 7, 23, 59, 59).getTime();
    expect(getSessionDateGroup(eightDaysAgo)).toBe('Older');
  });
});
