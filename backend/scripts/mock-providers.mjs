// Stand-ins for the platforms PostStreak connects to (TikTok, Instagram, Threads, Facebook and
// YouTube), for trying the whole connect → sync → disconnect flow on localhost. The real
// platforms require an https redirect address and an approved app, so they cannot be used from
// one machine; these speak the same endpoints with the same shapes.
//
//   node scripts/mock-providers.mjs            (listens on http://127.0.0.1:4010)
//
// Each platform lives under its own prefix, which is what the API's TIKTOK_MOCK_ORIGIN etc. point at:
//   TIKTOK_MOCK_ORIGIN=http://127.0.0.1:4010/tiktok      INSTAGRAM_MOCK_ORIGIN=http://127.0.0.1:4010/instagram
//   THREADS_MOCK_ORIGIN=…/threads   FACEBOOK_MOCK_ORIGIN=…/facebook   YOUTUBE_MOCK_ORIGIN=…/youtube
// (all but TikTok receive each call under the real platform's host name, e.g. /instagram/graph.instagram.com/v25.0/me)
// Local testing only. The API refuses any non-localhost value for those settings.
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { json, text } from './mocks/http.mjs';
import * as facebook from './mocks/facebook.mjs';
import * as instagram from './mocks/instagram.mjs';
import * as threads from './mocks/threads.mjs';
import * as tiktok from './mocks/tiktok.mjs';
import * as youtube from './mocks/youtube.mjs';

const PLATFORMS = { tiktok, instagram, threads, facebook, youtube };

/**
 * The stand-in server (not yet listening). `publicOrigin` is the address links in its pages must
 * use: a phone needs this computer's address, not 127.0.0.1.
 */
export function createMockServer(publicOrigin) {
  const PUBLIC = publicOrigin.replace(/\/+$/, '');
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', PUBLIC);
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' });
      return res.end();
    }
    if (url.pathname === '/' || url.pathname === '/health') return json(res, 200, { ok: true, platforms: Object.keys(PLATFORMS) });

    const [, name, ...rest] = url.pathname.split('/');
    const platform = PLATFORMS[name];
    if (!platform) return text(res, 404, `no stand-in for "${name}"`);
    const inner = new URL(url);
    inner.pathname = '/' + rest.join('/');
    try {
      await platform.handle(req, res, inner, `${PUBLIC}/${name}`);
    } catch (err) {
      console.error(`[${name}]`, err);
      if (!res.headersSent) text(res, 500, 'stand-in error');
    }
  });
}

// Started directly (not imported by a test)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const PORT = Number(process.env.MOCK_PROVIDERS_PORT ?? 4010);
  const HOST = process.env.MOCK_PROVIDERS_HOST ?? '127.0.0.1';
  const PUBLIC = process.env.MOCK_PROVIDERS_PUBLIC ?? `http://127.0.0.1:${PORT}`;
  createMockServer(PUBLIC).listen(PORT, HOST, () =>
    console.log(`stand-in platforms on http://${HOST}:${PORT}  (${Object.keys(PLATFORMS).join(', ')})`),
  );
}
