// Production entry point: `pnpm start [-H host] [-p port]`.
//
// Next.js route handlers cannot see the socket address, and a browser that
// reaches Next directly can put anything in X-Forwarded-* headers. This server
// drops those headers unless TRUST_PROXY_FORWARDED_FOR=true and the socket
// peer is in TRUSTED_PROXY_ADDRESSES, and records the client address (the
// socket peer, or the address a trusted proxy wrote) in an internal header
// signed with a per-process secret. The login route forwards that address to
// Django's login limiter only when the secret matches, so starting Next any
// other way simply forwards nothing. See src/lib/proxy-trust.mjs.
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import next from 'next';

import { CLIENT_IP_SECRET_ENV } from './src/lib/client-ip-headers.mjs';
import { prepareRequestHeaders } from './src/lib/proxy-trust.mjs';

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

const secret = randomBytes(32).toString('hex');
process.env[CLIENT_IP_SECRET_ENV] = secret;

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

createServer((req, res) => {
  prepareRequestHeaders(req.headers, req.socket.remoteAddress, { trustProxy, trustedProxies, secret });
  handle(req, res);
}).listen(port, hostname, () => {
  console.log(`> EssayCoach ready on http://${hostname}:${port}`);
});
