const internalOrigin = 'http://essaycoach.local';

export function safeInternalCallbackUrl(callbackUrl: string | null): string {
  if (
    !callbackUrl ||
    !callbackUrl.startsWith('/') ||
    callbackUrl.startsWith('//') ||
    callbackUrl.includes('\\')
  ) {
    return '/dashboard';
  }

  const target = new URL(callbackUrl, internalOrigin);
  if (target.origin !== internalOrigin) return '/dashboard';
  return `${target.pathname}${target.search}${target.hash}`;
}
