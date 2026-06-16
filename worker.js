// Cloudflare Worker — Atlassian OAuth token exchange proxy
// Deploy this at: https://workers.cloudflare.com
//
// Environment variables to set in the Worker dashboard:
//   ATLASSIAN_CLIENT_SECRET  — your Atlassian OAuth app secret

const CLIENT_ID    = '4pvBUKXizARwLAaGwfVKbsYMCadXBtxo';
const REDIRECT_URI = 'https://dimagi-internal.github.io/connect-doc-review/';
const ALLOWED_ORIGIN = 'https://dimagi-internal.github.io';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    // Accept POST; treat anything else as a debug probe
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed', method: request.method }), {
        status: 405, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const body = await request.text();
    let code, code_verifier;
    try { ({ code, code_verifier } = JSON.parse(body)); }
    catch { return new Response(JSON.stringify({ error: 'invalid_json', body }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }); }

    const upstream = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'authorization_code',
        client_id:     CLIENT_ID,
        client_secret: env.ATLASSIAN_CLIENT_SECRET,
        code,
        redirect_uri:  REDIRECT_URI,
        code_verifier,
      }),
    });

    const upstreamBody = await upstream.text();
    return new Response(upstreamBody, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  },
};
