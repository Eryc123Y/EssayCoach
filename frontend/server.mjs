// Production entry point: `pnpm start [-H host] [-p port]`.
//
// Next.js route handlers cannot see the socket address, and a browser that
// reaches Next directly can put anything in X-Forwarded-For. This server
// records the address it actually accepted the connection from (or, when
// TRUST_PROXY_FORWARDED_FOR=true and the peer is a trusted proxy, the address
// that proxy wrote) in an internal header signed with a per-process secret.
// The login route forwards that address to Django's login limiter only when
// the secret matches, so starting Next any other way simply forwards nothing.
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { isIP } from 'node:net';
import next from 'next';

import { CLIENT_IP_HEADER, CLIENT_IP_SECRET_ENV, CLIENT_IP_SECRET_HEADER } from './src/lib/client-ip-headers.mjs';

function option(flags, fallback) {
  const args = process.argv.slice(2);
  for (const flag of flags) {
    const index = args.indexOf(flag);
    if (index !== -1 && args[index + 1]) return args[index + 1];
  }
  return fallback;
}

const hostname = option(['-H', '--hostname'], process.env.HOSTNAME || '0.0.0.0');
const port = Number(option(['-p', '--port'], process.env.PORT || '3000'));

const trustProxy = process.env.TRUST_PROXY_FORWARDED_FOR === 'true';
const trustedProxies = new Set(
  (process.env.TRUSTED_PROXY_ADDRESSES || '127.0.0.1,::1')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

function normalize(address) {
  return address?.startsWith('::ffff:') ? address.slice(7) : address;
}

function clientAddress(req) {
  const peer = normalize(req.socket.remoteAddress);
  if (trustProxy && peer && trustedProxies.has(peer)) {
    // The trusted proxy appends the address it accepted; entries to its left
    // came from further away and may be forged.
    const forwarded = String(req.headers['x-forwarded-for'] || '')
      .split(',')
      .pop()
      ?.trim();
    if (forwarded && isIP(normalize(forwarded))) return normalize(forwarded);
  }
  return peer;
}

const secret = randomBytes(32).toString('hex');
process.env[CLIENT_IP_SECRET_ENV] = secret;

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

createServer((req, res) => {
  // Never let a caller supply the internal headers.
  delete req.headers[CLIENT_IP_HEADER];
  delete req.headers[CLIENT_IP_SECRET_HEADER];
  const address = clientAddress(req);
  if (address) {
    req.headers[CLIENT_IP_HEADER] = address;
    req.headers[CLIENT_IP_SECRET_HEADER] = secret;
  }
  handle(req, res);
}).listen(port, hostname, () => {
  console.log(`> EssayCoach ready on http://${hostname}:${port}`);
});
