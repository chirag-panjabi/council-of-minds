import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import Page from './page';

const router = { replace: vi.fn() };

vi.mock('next/navigation', () => ({ useRouter: () => router }));

beforeEach(() => {
  window.localStorage.clear();
  router.replace.mockReset();
  window.localStorage.setItem('framework-engine:onboarding', JSON.stringify({
    hasCompletedSetup: false,
    hasSkippedSetup: true,
  }));
});

test('allows safe browsing after setup is skipped and shows the generation gate', async () => {
  render(<Page />);
  expect(await screen.findByRole('heading', { name: 'Think with a council of perspectives.' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Provider setup required for generation' })).toBeInTheDocument();
  expect(router.replace).not.toHaveBeenCalled();
});
