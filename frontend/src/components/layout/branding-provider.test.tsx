import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandMark, BrandName } from './brand-mark';
import { BrandingProvider } from './branding-provider';

function respondWith(body: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => body }));
}

function renderBrand() {
  return render(
    <BrandingProvider>
      <BrandMark />
      <BrandName />
    </BrandingProvider>
  );
}

describe('BrandingProvider', () => {
  beforeEach(() => document.head.querySelectorAll('style[data-branding]').forEach((node) => node.remove()));
  afterEach(() => vi.unstubAllGlobals());

  it('shows the saved name and logo, and themes the app with the saved colour', async () => {
    respondWith({ name: 'School of Writing', logo_url: 'https://example.edu/logo.png', primary_color: '#7c3aed' });
    const { container } = renderBrand();

    expect(await screen.findByText('School of Writing')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.edu/logo.png');
    expect(container.querySelector('style[data-branding]')?.textContent).toContain('html:root{--primary:');
  });

  it('keeps the default look when the request fails', async () => {
    respondWith({}, false);
    const { container } = renderBrand();

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText('EssayCoach')).toBeInTheDocument();
    expect(container.querySelector('style[data-branding]')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('never renders a logo or colour that is not safe', async () => {
    respondWith({ name: 'School', logo_url: 'javascript:alert(1)', primary_color: 'red;}body{display:none' });
    const { container } = renderBrand();

    expect(await screen.findByText('School')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('style[data-branding]')).toBeNull();
  });

  it('falls back to the default mark when the logo cannot be loaded', async () => {
    respondWith({ name: 'School', logo_url: 'https://example.edu/broken.png', primary_color: '#0f766e' });
    const { container } = renderBrand();

    const img = await waitFor(() => {
      const found = container.querySelector('img');
      expect(found).not.toBeNull();
      return found as HTMLImageElement;
    });
    fireEvent.error(img);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
