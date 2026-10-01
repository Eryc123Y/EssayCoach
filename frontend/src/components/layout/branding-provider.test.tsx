import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandMark, BrandName } from './brand-mark';
import { BrandingProvider } from './branding-provider';
import { OrganizationSection } from '@/features/settings/components/organization-section';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock('@/service/request', () => ({ request: requestMock }));
vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: 'en', changeLocale: vi.fn() }),
}));

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

function renderOrganizationSettings() {
  return render(
    <BrandingProvider>
      <BrandName />
      <BrandMark />
      <OrganizationSection />
    </BrandingProvider>
  );
}

describe('BrandingProvider', () => {
  beforeEach(() => document.head.querySelectorAll('style[data-branding]').forEach((node) => node.remove()));
  afterEach(() => vi.unstubAllGlobals());

  it('publishes the saved organization branding to the rendered app immediately', async () => {
    const initial = { name: 'Old School', logo_url: '', primary_color: '#0f766e', invite_only: true, updated_at: '' };
    const saved = { name: 'New School', logo_url: 'https://example.edu/new.png', primary_color: '#7c3aed', invite_only: true, updated_at: '' };
    respondWith(initial);
    requestMock.mockImplementation(({ method }) => Promise.resolve(method === 'PUT' ? saved : initial));

    const { container } = renderOrganizationSettings();
    expect(await screen.findByText('Old School')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Institution name'), { target: { value: 'New School' } });
    fireEvent.change(screen.getByLabelText('Logo URL'), { target: { value: saved.logo_url } });
    fireEvent.change(container.querySelector('input[type="color"]') as HTMLInputElement, { target: { value: saved.primary_color } });
    fireEvent.click(screen.getByRole('button', { name: 'Save branding' }));

    expect(await screen.findByText('New School')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', saved.logo_url);
    expect(container.querySelector('style[data-branding]')?.textContent).toContain('--primary:#7c3aed');
    expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT' }));
  });

  it('keeps the existing app branding when saving fails', async () => {
    const initial = { name: 'Existing School', logo_url: 'https://example.edu/existing.png', primary_color: '#13579b', invite_only: true, updated_at: '' };
    respondWith(initial);
    requestMock.mockImplementation(({ method }) => method === 'PUT' ? Promise.reject(new Error('Save failed')) : Promise.resolve(initial));

    const { container } = renderOrganizationSettings();
    expect(await screen.findByText('Existing School')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Institution name'), { target: { value: 'Unsaved School' } });
    fireEvent.change(screen.getByLabelText('Logo URL'), { target: { value: 'https://example.edu/unsaved.png' } });
    fireEvent.change(container.querySelector('input[type="color"]') as HTMLInputElement, { target: { value: '#7c3aed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save branding' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');
    expect(screen.getByText('Existing School')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', initial.logo_url);
    expect(container.querySelector('style[data-branding]')?.textContent).not.toContain('--primary:#7c3aed');
  });

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
