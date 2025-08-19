// netlify/functions/add-product.js
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

  const adminToken = event.headers['x-admin-token'] || event.headers['X-Admin-Token'];
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { name, price, list_price, description, image_urls = [] } = JSON.parse(event.body || '{}');
    if (!name) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing product name' }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const table = process.env.PRODUCTS_TABLE || 'products';

    const { data, error } = await supabase
      .from(table)
      .insert([{
        name,
        price: price ?? null,
        list_price: list_price ?? null,
        description: description ?? null,
        image_urls: image_urls.length ? image_urls : null,
        active: true,
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ data }),
    };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
}
