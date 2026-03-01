/**
 * Utility to get the correct API URL for server-side requests.
 * Replaces localhost with 127.0.0.1 to avoid Node.js IPv6 resolution issues.
 */
export function getServerApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(
    'localhost',
    '127.0.0.1'
  );
}
