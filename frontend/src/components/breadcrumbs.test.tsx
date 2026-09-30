import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './breadcrumbs';

vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: 'en' })
}));
vi.mock('@/hooks/use-breadcrumbs', () => ({
  useBreadcrumbs: () => [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Rubrics', link: '/dashboard/rubrics' },
    { title: 'Details', link: '/dashboard/rubrics/1' }
  ]
}));

describe('Breadcrumbs', () => {
  it('keeps every direct child of the list an <li> so assistive technology reads it as a list', () => {
    render(<Breadcrumbs />);
    const list = screen.getByRole('navigation', { name: 'breadcrumb' }).querySelector('ol');
    expect(list).not.toBeNull();
    const children = Array.from(list!.children);
    expect(children.length).toBeGreaterThan(0);
    expect(children.map((child) => child.tagName)).toEqual(children.map(() => 'LI'));
    expect(children.some((child) => child.getAttribute('role') === 'presentation')).toBe(false);
  });

  it('marks the current page and hides the separators from assistive technology', () => {
    const { container } = render(<Breadcrumbs />);
    expect(screen.getByText('Details').closest('li')).not.toBeNull();
    expect(screen.getByText('Details')).toHaveAttribute('aria-current', 'page');
    const separators = container.querySelectorAll('[data-slot="breadcrumb-separator"]');
    expect(separators.length).toBe(2);
    separators.forEach((separator) => expect(separator).toHaveAttribute('aria-hidden', 'true'));
  });
});
