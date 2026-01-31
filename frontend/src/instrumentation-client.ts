// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

if (
  !process.env.NEXT_PUBLIC_SENTRY_DISABLED &&
  process.env.NODE_ENV === 'production'
) {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Add optional integrations for additional features
      integrations: [Sentry.replayIntegration()],

      // Adds request headers and IP for users, for more info visit
      sendDefaultPii: true,

      // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
      tracesSampleRate: 1,

      // Define how likely Replay events are sampled.
      // This sets the sample rate to be 10%. You may want this to be 100% while
      // in development and sample at a lower rate in production
      replaysSessionSampleRate: 0.1,

      // Define how likely Replay events are sampled when an error occurs.
      replaysOnErrorSampleRate: 1.0,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false
    });
  });
}

export const onRouterTransitionStart = async (
  ...args: Parameters<
    typeof import('@sentry/nextjs').captureRouterTransitionStart
  >
) => {
  if (
    !process.env.NEXT_PUBLIC_SENTRY_DISABLED &&
    process.env.NODE_ENV === 'production'
  ) {
    const { captureRouterTransitionStart } = await import('@sentry/nextjs');
    return captureRouterTransitionStart(...args);
  }
};
