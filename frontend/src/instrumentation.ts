export async function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' ||
    process.env.NEXT_RUNTIME === 'edge'
  ) {
    if (
      !process.env.NEXT_PUBLIC_SENTRY_DISABLED &&
      process.env.NODE_ENV === 'production'
    ) {
      await import('./instrumentation-sentry');
    }
  }
}

export const onRequestError = async (
  ...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>
) => {
  if (
    !process.env.NEXT_PUBLIC_SENTRY_DISABLED &&
    process.env.NODE_ENV === 'production'
  ) {
    const { captureRequestError } = await import('@sentry/nextjs');
    return captureRequestError(...args);
  }
};
