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
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { code, code_verifier } = await request.json();

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

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  },
};
