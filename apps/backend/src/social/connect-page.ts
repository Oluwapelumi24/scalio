import type { ConnectOutcome } from './social-connections.service';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** The small page Meta's login returns to. Works the same whether it was opened from the app or the website. */
export function renderConnectPage(o: ConnectOutcome): string {
  const back = o.returnUrl
    ? `<a class="btn" href="${esc(o.returnUrl)}">Back to Scalio</a>`
    : '<p class="hint">You can close this page and go back to the Scalio app.</p>';
  const choices = o.kind === 'choose' && o.pages && o.pendingId
    ? `<form method="post" action="/social/meta/choose">
        <input type="hidden" name="pendingId" value="${esc(o.pendingId)}">
        ${o.pages.map((p) => `<button class="choice" name="pageId" value="${esc(p.id)}">
            <strong>${esc(p.name)}</strong><span>${p.instagram ? `Instagram: @${esc(p.instagram)}` : 'No Instagram account linked'}</span>
          </button>`).join('')}
      </form>`
    : back;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)} · Scalio</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f4f6fb;color:#0a0a0a;margin:0;padding:48px 16px}
  main{max-width:420px;margin:0 auto;background:#fff;border:1px solid #dce3f0;border-radius:14px;padding:28px}
  h1{font-size:22px;margin:0 0 8px} p{line-height:1.5;color:#3a3a3a}
  .btn{display:inline-block;margin-top:12px;background:#04080f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600}
  .choice{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;margin-top:10px;padding:14px;border:1px solid #dce3f0;border-radius:10px;background:#fff;font:inherit;cursor:pointer;text-align:left}
  .choice span,.hint{color:#7a7a7a;font-size:14px}
</style></head>
<body><main><h1>${esc(o.title)}</h1><p>${esc(o.message)}</p>${choices}</main></body></html>`;
}
