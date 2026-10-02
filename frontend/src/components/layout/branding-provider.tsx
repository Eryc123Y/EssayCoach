'use client';

import React from 'react';
import { brandingCss, DEFAULT_BRANDING, parseBranding, type Branding } from '@/lib/branding';

const BrandingContext = React.createContext<Branding>(DEFAULT_BRANDING);
const UpdateBrandingContext = React.createContext<(value: unknown) => void>(() => undefined);

export function useBranding(): Branding {
  return React.useContext(BrandingContext);
}

/** Publishes a successfully saved organization response to the whole app. */
export function useUpdateBranding(): (value: unknown) => void {
  return React.useContext(UpdateBrandingContext);
}

/**
 * Loads the institution's public branding once and applies its colour to the
 * theme. The page renders with the default branding until the response
 * arrives, and keeps it if the request fails.
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = React.useState<Branding>(DEFAULT_BRANDING);
  const updateBranding = React.useCallback((value: unknown) => {
    setBranding(parseBranding(value));
  }, []);

  React.useEffect(() => {
    let current = true;
    fetch('/api/v2/organization/branding/')
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (current && body) updateBranding(body);
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [updateBranding]);

  const css = brandingCss(branding);
  return (
    <BrandingContext.Provider value={branding}>
      <UpdateBrandingContext.Provider value={updateBranding}>
        {css && <style data-branding>{css}</style>}
        {children}
      </UpdateBrandingContext.Provider>
    </BrandingContext.Provider>
  );
}
