import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { expect } from 'vitest';
import * as matchers from 'jest-axe';

expect.extend(matchers.toHaveNoViolations);
import { vi } from 'vitest';
HTMLDialogElement.prototype.showModal = vi.fn();
HTMLDialogElement.prototype.close = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() })
}));

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
});
