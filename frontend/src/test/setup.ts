import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation to fix useSearchParams null issue in tests
// Reference: https://github.com/vercel/next.js/issues/64180
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/test'),
  useLayoutEffect: vi.fn((fn) => {
    if (typeof window !== 'undefined') {
      // Execute effect in browser environment
      fn();
    }
  }),
}));
