// netlify/functions/upload-image.js
import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
};

export default async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: 'OK' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // bảo vệ bằng admin token
  const adminToken = event.headers['x-admin-token'] || event.headers['X-Admin-Token'];
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { dataUrl, filename, folder = 'uploads' } = JSON.parse(event.body || '{}');
    if (!dataUrl || !filename) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing dataUrl or filename' }) };
    }

    // tách base64
    const [meta, base64] = dataUrl.split(',');
    const contentType = (meta.match(/data:(.*?);base64/) || [])[1] || 'application/octet-stream';
    const buffer = Buffer.from(base64, 'base64');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const BUCKET = process.env.SUPABASE_BUCKET || 'site-assets';

    const safe = filename.replace(/\s+/g, '-');
    const path = `${folder}/${Date.now()}-${safe}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType,
      upsert: true,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ url: data.publicUrl, path }),
    };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
}
