// Small helpers shared by the local mock platforms.

export function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(body));
}

export function text(res, status, body) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' });
  res.end(body);
}

export function redirect(res, location) {
  res.writeHead(302, { location });
  res.end();
}

async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export async function readForm(req) {
  return Object.fromEntries(new URLSearchParams(await body(req)));
}

export async function readJson(req) {
  try {
    return JSON.parse((await body(req)) || '{}');
  } catch {
    return {};
  }
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * The "Allow PostStreak?" page of a stand-in platform. Plain HTML so it works in any browser,
 * with a clear banner that this is a local stand-in, not the real platform.
 */
export function consentPage(res, { provider, scopes, clientKey, accounts, cancel }) {
  const rows = accounts
    .map(
      (a) => `<a class="who" href="${esc(a.allow)}"><b>${esc(a.label)}</b><span>${esc(a.detail)}</span><i>Allow</i></a>`,
    )
    .join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(provider)} (local stand-in)</title>
<style>
*{box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#f7f5f0;color:#171420;margin:0;display:grid;place-items:center;min-height:100vh;padding:12px}
main{width:min(440px,100%);background:#fff;border-radius:22px;padding:26px;box-shadow:0 14px 40px rgba(63,37,191,.12)}
.banner{background:#fff4d6;border:1px solid #f1d58a;color:#6b4e00;border-radius:12px;padding:10px 12px;font-size:13px;margin-bottom:16px}
h1{font-size:21px;margin:0 0 6px}p{color:#5b576b;font-size:14px;line-height:1.5;margin:6px 0}
ul{margin:10px 0 16px;padding-left:18px;color:#5b576b;font-size:13.5px}
.who{display:flex;align-items:center;gap:6px 10px;flex-wrap:wrap;text-decoration:none;color:inherit;border:1.5px solid #e6e1f5;border-radius:14px;padding:12px 14px;margin-top:10px}
.who b{flex:0 1 auto}.who span{flex:1 1 60px;min-width:0;color:#8a859b;font-size:12.5px}.who i{font-style:normal;font-weight:800;color:#5b3ee8;margin-left:auto}
.who:hover{border-color:#5b3ee8;background:#faf8ff}
.cancel{display:block;text-align:center;margin-top:18px;color:#8a859b;font-size:14px}
</style></head><body><main>
<div class="banner"><b>Local test page.</b> This stands in for ${esc(provider)} on your machine. The real ${esc(provider)} cannot reach localhost.</div>
<h1>Allow PostStreak to connect?</h1>
<p>Pick which test creator you are. PostStreak will be able to read:</p>
<ul>${scopes.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
${rows}
<a class="cancel" href="${esc(cancel)}">Cancel</a>
<p style="font-size:11.5px;color:#a9a5b8;margin-top:14px">client: ${esc(clientKey)}</p>
</main></body></html>`;
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
}
