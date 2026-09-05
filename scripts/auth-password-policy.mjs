import { readFileSync } from 'node:fs';

const env = Object.fromEntries(readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line))
  .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]));
const ref = new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0];
if (!env.SUPABASE_ACCESS_TOKEN) throw new Error('Thiếu SUPABASE_ACCESS_TOKEN');
const endpoint = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const headers = { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
async function config(method = 'GET', body) {
  const response = await fetch(endpoint, { method, headers, body: body && JSON.stringify(body) });
  if (!response.ok) throw new Error(`Auth config: HTTP ${response.status}`);
  return response.json();
}
const select = c => ({ password_min_length: c.password_min_length, password_required_characters: c.password_required_characters });
console.log('Before:', select(await config()));
if (process.argv.includes('--apply')) {
  await config('PATCH', { password_min_length: 8, password_required_characters: '' });
  const after = await config();
  if (after.password_min_length !== 8 || after.password_required_characters) throw new Error('Chính sách chưa đồng bộ');
  console.log('Verified:', select(after));
}
