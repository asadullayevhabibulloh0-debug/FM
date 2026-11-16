/* Supabase ulanishini tekshiradi:  node check-supabase.js   (yoki START.bat o'zi chaqiradi) */
require('./load-env');
const URL_ = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim();
const ok = m => console.log('  [OK]   ' + m), bad = m => console.log('  [XATO] ' + m), info = m => console.log('         ' + m);
let failed = false;
const fail = (m, hint) => { failed = true; bad(m); if (hint) info(hint); };

function jwtRole(k) { try { return JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString()).role; } catch (e) { return null; } }

async function get(pathq) {
  const h = { apikey: KEY, ...(KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + KEY } : {}) };
  const r = await fetch(URL_ + pathq, { headers: h, signal: AbortSignal.timeout(15000) });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { }
  return { status: r.status, j, t };
}

(async () => {
  console.log('\nSupabase tekshiruvi\n');
  if (!URL_ || !KEY) { fail('.env da SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY yo‘q', 'Sayt data.json bilan ishlaydi, Supabase ishlatilmaydi.'); return end(); }
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(URL_)) fail('SUPABASE_URL noto‘g‘ri ko‘rinadi: ' + URL_, 'To‘g‘risi: https://<loyiha-id>.supabase.co (oxirida /rest/v1 bo‘lmasin)');
  if (KEY.startsWith('sb_publishable_')) return end(fail('Bu publishable kalit. Serverga SECRET kerak.', 'Supabase → Project Settings → API Keys → "Secret keys" dan sb_secret_... ni oling va SUPABASE_SERVICE_ROLE_KEY ga yozing.'));
  if (KEY.startsWith('eyJ') && jwtRole(KEY) === 'anon') return end(fail('Bu eski "anon" kalit. service_role kalit kerak.', 'Project Settings → API → service_role.'));
  ok('Kalit turi to‘g‘ri (' + (KEY.startsWith('sb_secret_') ? 'sb_secret' : 'service_role') + ')');

  for (const t of ['products', 'orders']) {
    let r;
    try { r = await get(`/rest/v1/${t}?select=id&limit=1`); }
    catch (e) { return end(fail('Supabase ga ulanib bo‘lmadi: ' + e.message, 'Internet, VPN yoki SUPABASE_URL ni tekshiring. Loyiha "Paused" bo‘lib qolgan bo‘lishi mumkin — dashboard da Restore bosing.')); }
    if (r.status === 200) ok(`"${t}" jadvali bor`);
    else if (r.status === 401 || r.status === 403) return end(fail(`Kalit qabul qilinmadi (${r.status}): ` + ((r.j && (r.j.message || r.j.hint)) || ''), 'Kalitni qaytadan nusxalang (boshida/oxirida bo‘sh joy bo‘lmasin), URL va kalit bitta loyihadan bo‘lsin.'));
    else if (r.status === 404 || (r.j && /PGRST205|PGRST106/.test(r.j.code || ''))) fail(`"${t}" jadvali yo‘q`, 'Supabase → SQL Editor → New query → supabase/schema.sql ni to‘liq joylab Run bosing.');
    else fail(`"${t}" javobi kutilmagan: HTTP ${r.status} ${r.t.slice(0, 150)}`);
  }

  if (!failed) {
    const p = await get('/rest/v1/products?select=id'); const o = await get('/rest/v1/orders?select=id');
    ok(`Mahsulotlar: ${p.j.length}, buyurtmalar: ${o.j.length}`);
    if (!p.j.length) info('Mahsulotlar bo‘sh — schema.sql dagi boshlang‘ich mahsulotlarni qayta Run qiling yoki: npm run db-migrate');
    const b = await get('/storage/v1/bucket/product-images').catch(() => ({ status: 0 }));
    if (b.status === 200) ok('Rasm papkasi (product-images) bor'); else fail('Storage da "product-images" papkasi yo‘q', 'schema.sql ni Run qiling (u papkani ham yaratadi) — aks holda admin paneldan rasm yuklab bo‘lmaydi.');
  }
  end();
})();

function end() {
  console.log(failed ? '\n  Natija: Supabase TAYYOR EMAS (yuqoridagi xatolarni tuzating).\n' : '\n  Natija: Supabase ishlayapti ✔\n');
  process.exit(failed ? 1 : 0);
}
