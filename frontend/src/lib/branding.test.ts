import { describe, expect, it } from 'vitest';
import { accessibleShade, brandingCss, contrastRatio, DEFAULT_BRANDING, parseBranding } from './branding';

describe('parseBranding', () => {
  it('keeps valid values and normalises the colour', () => {
    expect(parseBranding({ name: ' School of Writing ', logo_url: 'https://example.edu/logo.png', primary_color: '#AABBCC' })).toEqual({
      name: 'School of Writing',
      logoUrl: 'https://example.edu/logo.png',
      primaryColor: '#aabbcc'
    });
  });

  it('drops a logo that is not an http(s) URL and a colour that is not six-digit hex', () => {
    const parsed = parseBranding({ name: 'X School', logo_url: 'javascript:alert(1)', primary_color: 'red;background:url(x)' });
    expect(parsed.logoUrl).toBe('');
    expect(parsed.primaryColor).toBe(DEFAULT_BRANDING.primaryColor);
  });

  it('falls back to the defaults for a missing or unusable response', () => {
    expect(parseBranding(null)).toEqual(DEFAULT_BRANDING);
    expect(parseBranding({ name: ' ' })).toEqual(DEFAULT_BRANDING);
  });
});

describe('accessibleShade', () => {
  it('leaves an already readable colour alone', () => {
    const shade = accessibleShade('#0f766e', 'light');
    expect(shade.color).toBe('#0f766e');
    expect(shade.foreground).toBe('#ffffff');
  });

  it('darkens a pale colour until it reads on a light page', () => {
    const shade = accessibleShade('#ffeb3b', 'light');
    expect(shade.color).not.toBe('#ffeb3b');
    expect(contrastRatio(shade.color, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(shade.color, shade.foreground)).toBeGreaterThanOrEqual(4.5);
  });

  it('lightens a dark colour until it reads on a dark page', () => {
    const shade = accessibleShade('#1a237e', 'dark');
    expect(contrastRatio(shade.color, '#09090b')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(shade.color, shade.foreground)).toBeGreaterThanOrEqual(4.5);
  });

  it('always yields readable text on the button, whatever colour is chosen', () => {
    for (const hex of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#808080', '#fdd835']) {
      for (const surface of ['light', 'dark'] as const) {
        const { color, foreground } = accessibleShade(hex, surface);
        expect(contrastRatio(color, foreground), `${hex} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe('brandingCss', () => {
  it('does not retheme the app when the institution kept the default colour', () => {
    expect(brandingCss(DEFAULT_BRANDING)).toBeNull();
  });

  it('overrides the primary tokens for light and dark themes', () => {
    const css = brandingCss({ ...DEFAULT_BRANDING, primaryColor: '#7c3aed' });
    expect(css).toContain('html:root{--primary:');
    expect(css).toContain('html.dark{--primary:');
  });
});
