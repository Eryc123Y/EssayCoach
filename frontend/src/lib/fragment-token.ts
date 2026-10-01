export type FragmentToken =
  | { token: string; invalid: false }
  | { token: null; invalid: boolean };

/**
 * Reads a `token` from a URL fragment without allowing malformed percent
 * escapes to throw while a client page is mounting.
 */
export function parseFragmentToken(hash: string): FragmentToken {
  if (!hash.startsWith('#')) return { token: null, invalid: false };

  const tokenPart = hash.slice(1).split('&').find((part) => part.startsWith('token='));
  if (!tokenPart) return { token: null, invalid: false };

  const encodedToken = tokenPart.slice('token='.length);
  if (!encodedToken) return { token: null, invalid: false };

  try {
    const token = decodeURIComponent(encodedToken.replace(/\+/g, ' '));
    return token ? { token, invalid: false } : { token: null, invalid: false };
  } catch {
    return { token: null, invalid: true };
  }
}
