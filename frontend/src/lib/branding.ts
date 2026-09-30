/**
 * Institution branding (PRD 07): name, logo and primary colour chosen by an
 * admin and shown on the landing page, sign-in and the dashboard.
 *
 * The values come from the server but are validated again here, and the colour
 * is adjusted until text on it is readable, so a poor choice (pale yellow, say)
 * can never make the interface unreadable.
 */

export interface Branding {
  name: string;
  logoUrl: string;
  primaryColor: string;
}

export const DEFAULT_BRANDING: Branding = { name: 'EssayCoach', logoUrl: '', primaryColor: '#0f766e' };

const HEX = /^#[0-9a-f]{6}$/i;
const LIGHT_SURFACE = '#ffffff';
const DARK_SURFACE = '#09090b';
const ON_DARK = '#ffffff';
const ON_LIGHT = '#09090b';
/** WCAG AA for normal-size text. */
const MIN_CONTRAST = 4.5;

export function parseBranding(raw: unknown): Branding {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const name = typeof value.name === 'string' ? value.name.trim().slice(0, 120) : '';
  const logo = typeof value.logo_url === 'string' ? value.logo_url.trim() : '';
  const color = typeof value.primary_color === 'string' ? value.primary_color.trim() : '';
  return {
    name: name.length >= 2 ? name : DEFAULT_BRANDING.name,
    logoUrl: isWebUrl(logo) ? logo : '',
    primaryColor: HEX.test(color) ? color.toLowerCase() : DEFAULT_BRANDING.primaryColor
  };
}

function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function toRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(hex: string, towards: string, amount: number): string {
  const from = toRgb(hex);
  const to = toRgb(towards);
  return toHex(from.map((v, i) => v + (to[i] - v) * amount) as [number, number, number]);
}

/**
 * The brand colour, nudged toward black (on light surfaces) or white (on dark
 * ones) until it reads clearly against the page, plus the text colour to put on
 * top of it. A colour that already passes is returned unchanged.
 */
export function accessibleShade(hex: string, surface: 'light' | 'dark'): { color: string; foreground: string } {
  const background = surface === 'light' ? LIGHT_SURFACE : DARK_SURFACE;
  const towards = surface === 'light' ? '#000000' : '#ffffff';
  let color = hex;
  for (let step = 1; contrastRatio(color, background) < MIN_CONTRAST && step <= 50; step++) {
    color = mix(hex, towards, step * 0.02);
  }
  const foreground = contrastRatio(color, ON_DARK) >= contrastRatio(color, ON_LIGHT) ? ON_DARK : ON_LIGHT;
  return { color, foreground };
}

/** Theme overrides for the brand colour, or null when the institution kept the default. */
export function brandingCss(branding: Branding): string | null {
  if (branding.primaryColor === DEFAULT_BRANDING.primaryColor) return null;
  const light = accessibleShade(branding.primaryColor, 'light');
  const dark = accessibleShade(branding.primaryColor, 'dark');
  // Only validated hex values reach this string.
  const tokens = (shade: { color: string; foreground: string }) =>
    `--primary:${shade.color};--primary-foreground:${shade.foreground};--sidebar-primary:${shade.color};--sidebar-primary-foreground:${shade.foreground};--ring:${shade.color};`;
  return `html:root{${tokens(light)}}html.dark{${tokens(dark)}}`;
}
