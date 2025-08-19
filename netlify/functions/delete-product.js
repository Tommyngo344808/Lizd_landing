// netlify/functions/delete-product.js
import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
};

export default async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: 'OK' };
  }
  if (!['POST', 'DELETE'].includes(event.httpMethod)) {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // xác thực admin
  const sentToken = event.headers['x-admin-token'] || event.headers['X-Admin-Token'] || '';
  if (process.env.ADMIN_TOKEN && sentToken !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { id } = JSON.parse(event.body || '{}');
    if (!id) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing id' }) };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY
    );
    const table = process.env.PRODUCTS_TABLE || 'products';

    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select('id')
      .limit(1);

    if (error) throw error;
    if (!data || !data.length) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Product not found' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ ok: true, id: data[0].id }),
    };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
}
