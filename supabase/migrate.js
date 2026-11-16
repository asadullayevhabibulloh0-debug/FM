/* =====================================================================
   Eski ma'lumotlarni Supabase'ga ko'chirish (bir marta):
     node supabase/migrate.js

   Qayerdan oladi:
     - data.json (kompyuterdagi buyurtmalar va mahsulotlar), bo'lsa
     - Upstash Redis (eski Vercel bazasi), .env da KV_REST_API_URL va KV_REST_API_TOKEN bo'lsa
   Qayta ishga tushirsa ham xavfsiz: bir xil id lar ustiga yoziladi, ikki marta qo'shilmaydi.
   Avval supabase/schema.sql ni Supabase SQL Editor'da ishga tushiring.
   ===================================================================== */
require('../local/load-env');
const fs = require('fs');
const path = require('path');
const { store, cleanProduct, ORDER_FIELDS } = require('../api/_lib');

const KV_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, '');
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

async function kv(...cmd) {
    const r = await fetch(KV_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cmd)
    });
    const j = await r.json();
    if (j.error) throw new Error('Redis: ' + j.error);
    return j.result;
}

(async () => {
    if (!store.enabled) {
        console.error('.env da SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY yozilmagan.');
        process.exit(1);
    }
    let products = [], orders = [];

    const dataFile = path.join(__dirname, '..', 'data.json');
    if (fs.existsSync(dataFile)) {
        const d = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        products.push(...(d.products || []));
        orders.push(...(d.orders || []));
        console.log(`data.json: ${(d.products || []).length} mahsulot, ${(d.orders || []).length} buyurtma`);
    }

    if (KV_URL && KV_TOKEN) {
        const raw = await kv('GET', 'fm:products');
        const kvProducts = raw ? JSON.parse(raw) : [];
        const flat = (await kv('HGETALL', 'fm:orders')) || [];
        const kvOrders = [];
        for (let i = 1; i < flat.length; i += 2) kvOrders.push(JSON.parse(flat[i]));
        console.log(`Redis: ${kvProducts.length} mahsulot, ${kvOrders.length} buyurtma`);
        products.push(...kvProducts);   // Redis'dagi (Vercel) ro'yxat ustun turadi
        orders.push(...kvOrders);
    }

    const byId = new Map();
    for (const p of products) byId.set(String(p.id), cleanProduct(p, { id: Number(p.id), img: './card.png', sizes: [], custom: false }));
    for (const p of byId.values()) await store.saveProduct(p);

    // ommaviy yozishda hamma qatorda bir xil maydonlar bo'lishi shart
    const full = o => ({
        ...Object.fromEntries(ORDER_FIELDS.map(k => [k, null])),
        quantity: 1, custom: false, delivery: 0, status: 'Yangi', date: new Date().toISOString(),
        ...Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ''))
    });
    const ordersById = new Map(orders.map(o => [String(o.id), full(o)]));
    const list = [...ordersById.values()].filter(o => /^\d+$/.test(String(o.id)));
    for (let i = 0; i < list.length; i += 200) {
        // bir xil id bo'lsa ustiga yoziladi
        await store.addOrders(list.slice(i, i + 200), { upsert: true });
    }

    console.log(`Supabase'ga yozildi: ${byId.size} mahsulot, ${list.length} buyurtma ✅`);
    console.log('Eslatma: data.json ichidagi base64 rasmlar shu holicha saqlandi; admin panelda qayta yuklasangiz Storage ga tushadi.');
})().catch(e => { console.error(e.message); process.exit(1); });
