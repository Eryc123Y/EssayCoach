// Request-header hygiene for server.mjs (plain Node, so this file is .mjs).
import { isIP } from 'node:net';

import { CLIENT_IP_HEADER, CLIENT_IP_SECRET_HEADER } from './client-ip-headers.mjs';

const FORWARDED_HEADERS = ['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-port', 'forwarded'];

function normalize(address) {
  return address?.startsWith('::ffff:') ? address.slice(7) : address;
}

/**
 * Prepare an incoming request's headers before Next sees them.
 *
 * - Callers can never supply the internal client-IP headers.
 * - Forwarded headers are kept only when `trustProxy` is set and the socket
 *   peer is one of `trustedProxies`; otherwise they are dropped, so Next fills
 *   them from the real connection and nothing downstream (login limiter,
 *   sign-in redirects) can be steered by a direct caller.
 * - The client address (socket peer, or the right-most X-Forwarded-For entry
 *   written by a trusted proxy) is recorded with the per-process secret.
 */
export function prepareRequestHeaders(headers, socketAddress, { trustProxy, trustedProxies, secret }) {
  delete headers[CLIENT_IP_HEADER];
  delete headers[CLIENT_IP_SECRET_HEADER];
  const peer = normalize(socketAddress);
  const fromTrustedProxy = Boolean(trustProxy && peer && trustedProxies.has(peer));
  let address = peer;
  if (fromTrustedProxy) {
    // The trusted proxy appends the address it accepted; entries to its left
    // came from further away and may be forged.
    const forwarded = normalize(String(headers['x-forwarded-for'] || '').split(',').pop()?.trim());
    if (forwarded && isIP(forwarded)) address = forwarded;
  } else {
    for (const name of FORWARDED_HEADERS) delete headers[name];
  }
  if (address) {
    headers[CLIENT_IP_HEADER] = address;
    headers[CLIENT_IP_SECRET_HEADER] = secret;
  }
  return headers;
}
