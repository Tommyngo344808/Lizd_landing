// netlify/functions/sendOrder.js  (ESM)
const TOKEN = process.env.PAGE_ACCESS_TOKEN;
const ADMIN_PSIDS = (process.env.ADMIN_PSIDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ok  = (data)=>({ statusCode:200, headers:{ 'Content-Type':'application/json', ...CORS }, body: JSON.stringify(data) });
const bad = (msg, code=400)=>({ statusCode:code, headers:{ 'Content-Type':'text/plain; charset=utf-8', ...CORS }, body:String(msg) });

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode:204, headers:CORS };
  if (event.httpMethod !== 'POST') return bad('Method Not Allowed', 405);

  if (!TOKEN || !ADMIN_PSIDS.length) {
    return bad('Missing PAGE_ACCESS_TOKEN or ADMIN_PSIDS');
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return bad('invalid json'); }

  // Nội dung bạn muốn gửi về Messenger
  const text = body.text || body.message || body.msg || '';
  if (!text) return bad('missing text');

  const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(TOKEN)}`;

  const payloads = ADMIN_PSIDS.map(psid => ({
    messaging_type: 'UPDATE',
    recipient: { id: psid },
    message: { text }
  }));

  const results = await Promise.allSettled(
    payloads.map(p =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      }).then(r => r.json())
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
  return ok({ ok:true, sent, results });
}
