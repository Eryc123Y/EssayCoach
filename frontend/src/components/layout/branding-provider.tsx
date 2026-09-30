'use client';

import React from 'react';
import { brandingCss, DEFAULT_BRANDING, parseBranding, type Branding } from '@/lib/branding';

const BrandingContext = React.createContext<Branding>(DEFAULT_BRANDING);

export function useBranding(): Branding {
  return React.useContext(BrandingContext);
}

/**
 * Loads the institution's public branding once and applies its colour to the
 * theme. The page renders with the default branding until the response
 * arrives, and keeps it if the request fails.
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = React.useState<Branding>(DEFAULT_BRANDING);

  React.useEffect(() => {
    let current = true;
    fetch('/api/v2/organization/branding/')
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (current && body) setBranding(parseBranding(body));
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, []);

  const css = brandingCss(branding);
  return (
    <BrandingContext.Provider value={branding}>
      {css && <style data-branding>{css}</style>}
      {children}
    </BrandingContext.Provider>
  );
}
