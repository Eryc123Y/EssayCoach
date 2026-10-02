import { describe, expect, it } from 'vitest';

import { prepareRequestHeaders } from './proxy-trust.mjs';

const trustedProxies = new Set(['127.0.0.1', '::1']);
const forged = () => ({
  host: 'essays.example.edu',
  'x-forwarded-for': '203.0.113.9',
  'x-forwarded-host': 'attacker.example',
  'x-forwarded-proto': 'https',
  forwarded: 'for=203.0.113.9;host=attacker.example',
  'x-essaycoach-client-ip': '198.51.100.1',
  'x-essaycoach-client-ip-secret': 'guessed',
});

describe('prepareRequestHeaders', () => {
  it('drops forwarded and internal headers from a direct caller and records the socket address', () => {
    const headers: Record<string, string> = forged();
    prepareRequestHeaders(headers, '::ffff:192.0.2.10', { trustProxy: true, trustedProxies, secret: 's3cret' });

    expect(headers['x-forwarded-host']).toBeUndefined();
    expect(headers['x-forwarded-proto']).toBeUndefined();
    expect(headers['x-forwarded-for']).toBeUndefined();
    expect(headers.forwarded).toBeUndefined();
    expect(headers.host).toBe('essays.example.edu');
    expect(headers['x-essaycoach-client-ip']).toBe('192.0.2.10');
    expect(headers['x-essaycoach-client-ip-secret']).toBe('s3cret');
  });

  it('drops forwarded headers even from loopback when no proxy is trusted', () => {
    const headers: Record<string, string> = forged();
    prepareRequestHeaders(headers, '127.0.0.1', { trustProxy: false, trustedProxies, secret: 's' });

    expect(headers['x-forwarded-host']).toBeUndefined();
    expect(headers['x-essaycoach-client-ip']).toBe('127.0.0.1');
  });

  it('keeps a trusted proxy\'s headers and uses the address it appended', () => {
    const headers: Record<string, string> = { ...forged(), 'x-forwarded-for': '198.51.100.7, 203.0.113.9' };
    prepareRequestHeaders(headers, '127.0.0.1', { trustProxy: true, trustedProxies, secret: 's' });

    expect(headers['x-forwarded-host']).toBe('attacker.example');
    expect(headers['x-forwarded-proto']).toBe('https');
    expect(headers['x-essaycoach-client-ip']).toBe('203.0.113.9');
    expect(headers['x-essaycoach-client-ip-secret']).toBe('s');
  });
});
