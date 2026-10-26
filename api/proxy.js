/**
 * OINST — Secure server-side API proxy (Vercel Serverless Function)
 * -----------------------------------------------------------------
 * The real API key lives ONLY in an environment variable
 * (OINST_API_KEY) and is never sent to the browser, so it cannot leak
 * from the client bundle or DevTools network tab.
 *
 *   GET /api/proxy?cmd=number&query=9093614290
 *
 * Response shape (stable, easy for the frontend to consume):
 *   { ok, cmd, query, status, cached, data, raw }
 */

// Whitelist of commands the site is allowed to call.
// Anything outside this list is rejected, so the endpoint can't be
// abused to hit arbitrary upstream commands.
const ALLOWED_COMMANDS = new Set([
  'vehicle',        // Vehicle RC
  'vehicleinfo',    // Vehicle Info
  'vehiclechallan', // Vehicle Challan
  'vehicleall',     // Vehicle All
  'phoneinfo',      // Phone Info
  'number',         // Number
  'hp',             // HP
  'upi',            // UPI
  'pan',            // PAN
  'pan2',           // PAN v2
  'tg',             // Telegram
  'family',         // Family
  'aadhar',         // Aadhaar
  'all',            // All (master)
]);

const UPSTREAM_ENDPOINT = 'https://admin.gbssystems.com/public/api/v1/api.php';

// Guard rails: keeps a single request from being used to hammer upstream.
const MAX_QUERY_LENGTH = 64;
const UPSTREAM_TIMEOUT_MS = 25000;

module.exports = async function handler(req, res) {
  // ---- 1. Only GET ------------------------------------------------------
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { ok: false, error: 'Method not allowed. Use GET.' });
  }

  // ---- 2. Read + validate the server-side key --------------------------
  const apiKey = process.env.OINST_API_KEY || process.env.GBS_API_KEY;
  if (!apiKey) {
    return send(res, 500, {
      ok: false,
      error: 'API key is not configured on the server.',
      hint: 'Set OINST_API_KEY in Vercel → Settings → Environment Variables.',
    });
  }

  // ---- 3. Normalise + whitelist the incoming parameters ----------------
  // Vercel gives us req.query as an object, but we also support a raw
  // `?cmd=x&query=y` passthrough for local/manual testing.
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const cmd = String(url.searchParams.get('cmd') || '').trim().toLowerCase();
  const query = String(url.searchParams.get('query') || '').trim();

  if (!ALLOWED_COMMANDS.has(cmd)) {
    return send(res, 400, {
      ok: false,
      error: `Unsupported command "${cmd || '(empty)'}".`,
      allowed: [...ALLOWED_COMMANDS],
    });
  }

  if (!query || query.length > MAX_QUERY_LENGTH) {
    return send(res, 400, {
      ok: false,
      error: `Query must be 1–${MAX_QUERY_LENGTH} characters long.`,
    });
  }

  // ---- 4. Call the upstream provider -----------------------------------
  const upstreamUrl =
    `${UPSTREAM_ENDPOINT}?key=${encodeURIComponent(apiKey)}` +
    `&cmd=${encodeURIComponent(cmd)}` +
    `&query=${encodeURIComponent(query)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const startedAt = Date.now();
    // `redirect: 'manual'` is important: when the provider is patched or the
    // key is rejected it answers with a 302 to an external page. Following
    // that redirect would hand us a useless HTML document instead of JSON.
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'OINST/1.0 (+https://oinst.kryzo.space)',
      },
    });

    const raw = await upstreamRes.text();
    clearTimeout(timer);

    // The provider is inconsistent: sometimes JSON, sometimes plain text.
    // Try to parse, but always keep the raw text as a fallback.
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      data = null;
    }

    const isRedirect = upstreamRes.status >= 300 && upstreamRes.status < 400;
    const redirectTo = upstreamRes.headers.get('location') || null;
    const looksLikeHtml = /^\s*<(?:!doctype|html)/i.test(raw);

    // ---- Provider gate: redirect or HTML instead of data --------------
    if (isRedirect || (looksLikeHtml && data === null)) {
      return send(res, 200, {
        ok: false,
        code: 'PROVIDER_UNAVAILABLE',
        cmd,
        query,
        status: upstreamRes.status,
        redirect: redirectTo,
        error: 'The upstream provider is temporarily unavailable.',
        hint:
          'gbssystems.com answered with a redirect/HTML notice instead of JSON ' +
          '(commonly shown as "API patched, 1 day for update"). This is a ' +
          'provider-side outage — no key or configuration change on OINST can fix it. ' +
          'Please try again later.',
      });
    }

    return send(res, 200, {
      ok: true,
      cmd,
      query,
      status: upstreamRes.status,
      elapsedMs: Date.now() - startedAt,
      data,                                        // parsed object (or null)
      raw: raw.length > 200000 ? raw.slice(0, 200000) : raw, // untouched body
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err && err.name === 'AbortError';
    return send(res, aborted ? 504 : 502, {
      ok: false,
      error: aborted
        ? 'Upstream provider timed out. Please try again.'
        : 'Failed to reach the upstream provider.',
      detail: String(err && err.message ? err.message : err),
    });
  }
};

/** Small JSON responder that always disables caching. */
function send(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(status).json(payload);
}
