import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'jest-axe';

// Pages
import DashboardPage from '../page';
import PersonasPage from '../personas/page';
import AnalyticsPage from '../analytics/page';
import SettingsPage from '../settings/page';
import { Sidebar } from '../../components/layout/Sidebar';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('@/lib/analytics/analytics-service', () => ({
  getUsageSummary: vi.fn().mockResolvedValue({
    totalKnownTokens: 1000,
    estimatedSpendUsd: 0.05,
    mostActivePersonaId: 'persona-1',
    unavailableCount: 0,
    catalogVersion: '1.0',
    catalogPublishedAt: '2023-01-01',
  }),
  getUsageByModel: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/db/repositories/persona', () => ({
  personaRepository: {
    search: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
    toggleFavorite: vi.fn(),
    toggleArchive: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('Automated Accessibility Tests (jest-axe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('DashboardPage has no accessibility violations', async () => {
    // Setup state for DashboardPage to render normally
    window.localStorage.setItem('framework-engine:onboarding', JSON.stringify({
      hasCompletedSetup: false,
      hasSkippedSetup: true,
    }));
    const { container } = render(<DashboardPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('PersonasPage has no accessibility violations', async () => {
    const { container } = render(<PersonasPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('AnalyticsPage has no accessibility violations', async () => {
    const { container } = render(<AnalyticsPage />);
    // Wait for the async load
    await new Promise(resolve => setTimeout(resolve, 0));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SettingsPage has no accessibility violations', async () => {
    const { container } = render(<SettingsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Sidebar has no accessibility violations', async () => {
    const { container } = render(<Sidebar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
