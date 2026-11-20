/* =====================================================================
   FUTBOL MARKET — kompyuterdagi sayt serveri (http://localhost:3000)
   Mahsulotlar va buyurtmalar: .env da SUPABASE_URL bo'lsa Supabase'da (Vercel bilan bitta baza),
   bo'lmasa data.json da. Admin panel (admin.html) shu yerdan o'qiydi.
   Buyurtmani tekshirish Vercel bilan bir xil: api/_lib.js -> buildOrder
   ===================================================================== */
require('./load-env');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { CARD_METHODS, buildOrder, OrderError, isAdminRequest, store, getProducts, uploadImage, cleanProduct, pickOrderEdit, notifyNewOrder, notifyCustomerStatus, announceProduct, TOKEN } = require('./api/_lib');

const ROOT = __dirname, DATA = path.join(ROOT, 'data.json');
const PORT = Number(process.env.PORT) || 3000;

function load() {
    if (!fs.existsSync(DATA)) {
        const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8'));
        fs.writeFileSync(DATA, JSON.stringify({ products, orders: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA, 'utf8'));
}
function save(d) { fs.writeFileSync(DATA, JSON.stringify(d, null, 2)); }

// data.json — Supabase ulanmaganda (store bilan bir xil amallar)
const fileStore = {
    async products() { return load().products; },
    async orders() { return load().orders; },
    async addOrders(lines) { const d = load(); d.orders.push(...lines); save(d); },
    async updateOrder(id, patch) {
        const d = load(), i = d.orders.findIndex(a => String(a.id) === id);
        if (i < 0) return null;
        d.orders[i] = { ...d.orders[i], ...patch, id: d.orders[i].id }; save(d);
        return d.orders[i];
    },
    async deleteOrder(id) { const d = load(); d.orders = d.orders.filter(a => String(a.id) !== id); save(d); },
    async updateByOrderId(orderId, patch) {
        const d = load(), rows = d.orders.filter(a => a.orderId === orderId);
        rows.forEach(a => Object.assign(a, patch)); save(d);
        return rows;
    },
    async deleteByOrderId(orderId) { const d = load(); d.orders = d.orders.filter(a => a.orderId !== orderId); save(d); },
    async saveProduct(p) {
        const d = load(), i = d.products.findIndex(a => String(a.id) === String(p.id));
        if (i < 0) d.products.push(p); else d.products[i] = p;
        save(d); return p;
    },
    async deleteProduct(id) { const d = load(); d.products = d.products.filter(a => String(a.id) !== id); save(d); }
};
const db = store.enabled ? { ...store, products: getProducts } : fileStore;

/* Kompyuterdagi bot foydalanuvchilari: index.js xotirasidan yoki bot-state.json dan + Telegram'dan buyurtma berganlar */
async function announceLocal(prod) {
    let chats = [];
    if (typeof global.FM_BOT_SUBSCRIBERS === 'function') chats = global.FM_BOT_SUBSCRIBERS();
    else {
        try { const st = JSON.parse(fs.readFileSync(path.join(ROOT, 'bot-state.json'), 'utf8')); chats = [...(st.subscribers || []), ...(st.menuChats || [])]; } catch (e) { }
    }
    if (!store.enabled) { try { (await db.orders()).forEach(o => o.tgUserId && chats.push(String(o.tgUserId))); } catch (e) { } }
    const base = [process.env.PUBLIC_URL, process.env.WEBAPP_URL].map(v => String(v || '').trim()).find(v => /^https:\/\//i.test(v));
    try {
        const r = await announceProduct(prod, { base: base ? new URL(base).origin : '', rootDir: ROOT, extraChats: chats, deadlineMs: 10 * 60 * 1000 });
        if (r.blocked.length && typeof global.FM_BOT_DROP === 'function') global.FM_BOT_DROP(r.blocked);
    } catch (e) { console.error("[e'lon] xato:", e.message); }
}

function send(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
}
function body(req) {
    return new Promise((resolve, reject) => {
        let b = '';
        req.on('data', c => { b += c; if (b.length > 10e6) { reject(new Error('So‘rov juda katta. Rasmni kichikroq qilib qayta yuklang (10 MB gacha).')); req.destroy(); } });
        req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(e); } });
    });
}

// Admin amallari: shu kompyuterning o'zidan (localhost) yoki ADMIN_KEY paroli bilan.
// Tunnel (cloudflared) orqali kelgan so'rovda cf-connecting-ip bo'ladi — u "tashqi" hisoblanadi.
function adminOk(req) {
    const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) &&
        !req.headers['cf-connecting-ip'] && !req.headers['x-forwarded-for'];
    return local || isAdminRequest(req);
}

async function api(req, res, p) {
    // Admin login: shu kompyuterdan (localhost) parolsiz, internet orqali kelsa ADMIN_KEY bilan
    if (p === '/api/admin-login') {
        return adminOk(req) ? send(res, 200, { ok: true }) : send(res, 401, { error: 'Parol noto‘g‘ri' });
    }
    const isPublic = (req.method === 'GET' && p === '/api/products') || (req.method === 'POST' && p === '/api/orders') || p === '/api/card-lookup';
    if (!isPublic && !adminOk(req)) return send(res, 401, { error: 'Admin paroli kerak' });

    // karta egasining ismi: faqat rasmiy bank/provayder API'si ulangan bo'lsa (api/_cardholder.js). Karta raqami saqlanmaydi.
    if (p === '/api/card-lookup') {
        const ch = require('./api/_cardholder');
        if (req.method === 'GET') return send(res, 200, { configured: ch.configured() });
        if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
        if (!ch.configured()) return send(res, 501, { configured: false, message: ch.NOT_CONFIGURED_MESSAGE });
        const x = await body(req), number = String(x.number || '').replace(/\D/g, '');
        if (!CARD_METHODS.includes(String(x.network || '')) || number.length !== 16) return send(res, 400, { configured: true, message: 'Karta raqami noto‘g‘ri' });
        try {
            const r = await ch.lookupHolder(String(x.network), number);
            return send(res, 200, { configured: true, holderName: r.holderName || '' });
        } catch (e) { console.error('card-lookup:', e.message); return send(res, 502, { configured: true, message: 'Bank API’sidan javob olinmadi. Keyinroq urinib ko‘ring.' }); }
    }

    if (req.method === 'GET' && p === '/api/products') return send(res, 200, await db.products());
    if (req.method === 'POST' && p === '/api/products') {
        const x = await body(req);
        const prod = cleanProduct(x, { id: Number(x.id) || Date.now(), img: './card.png', sizes: [], custom: false });
        if (!prod.name || !prod.price || !prod.sizes.length) return send(res, 400, { error: 'Nomi, narx va o‘lchamlar kerak' });
        if (store.enabled) { prod.img = await uploadImage(prod.img, prod.id); prod.customBackImage = await uploadImage(prod.customBackImage, String(prod.id) + "-back"); }
        const saved = await db.saveProduct(prod);
        // yangi mahsulot: bot foydalanuvchilariga xabar fonda yuboriladi (admin kutib qolmaydi)
        if (x.notify !== false && TOKEN) announceLocal(saved);
        return send(res, 201, x.notify !== false && TOKEN ? { ...saved, announced: { background: true } } : saved);
    }

    if (req.method === 'GET' && p === '/api/orders') return send(res, 200, await db.orders());
    // butun buyurtma (savat): /api/orders?orderId=FM-...
    const orderId = new URL(req.url, 'http://x').searchParams.get('orderId');
    if (p === '/api/orders' && orderId && req.method === 'DELETE') {
        await db.deleteByOrderId(orderId);
        return send(res, 200, { ok: true });
    }
    if (p === '/api/orders' && orderId && req.method === 'PUT') {
        const clean = pickOrderEdit(await body(req));
        const before = (await db.orders()).find(o => o.orderId === orderId);
        if (!before) return send(res, 404, { error: 'not found' });
        const rows = await db.updateByOrderId(orderId, clean);
        if (clean.status && clean.status !== before.status) await notifyCustomerStatus(before, clean.status);
        return send(res, 200, rows);
    }
    if (req.method === 'POST' && p === '/api/orders') {
        // sayt va Telegram Mini App buyurtmasi. Bot (index.js) yangi yozuvni ko'rib adminga yuboradi.
        try {
            const { order, lines } = buildOrder(await body(req), await db.products());
            await db.addOrders(lines);
            // bot shu kompyuterda ishlamasa (Vercel webhook rejimi), adminga xabarni o'zimiz yuboramiz
            if (!global.FM_BOT_POLLING) await notifyNewOrder(order);
            return send(res, 201, { ok: true, id: order.id, total: order.total, discount: order.discount, payment: order.payment });
        } catch (e) {
            if (e instanceof OrderError) return send(res, e.status, { error: e.message });
            throw e;
        }
    }

    const m = p.match(/^\/api\/(orders|products)\/(.+)$/);
    if (m) {
        const type = m[1], id = decodeURIComponent(m[2]);
        if (req.method === 'PUT' && type === 'orders') {
            const next = await db.updateOrder(id, pickOrderEdit(await body(req)));
            return next ? send(res, 200, next) : send(res, 404, { error: 'not found' });
        }
        if (req.method === 'PUT') {
            const old = (await db.products()).find(a => String(a.id) === id);
            if (!old) return send(res, 404, { error: 'not found' });
            const prod = cleanProduct(await body(req), old);
            if (store.enabled) { prod.img = await uploadImage(prod.img, prod.id); prod.customBackImage = await uploadImage(prod.customBackImage, String(prod.id) + "-back"); }
            return send(res, 200, await db.saveProduct(prod));
        }
        if (req.method === 'DELETE') {
            await (type === 'orders' ? db.deleteOrder(id) : db.deleteProduct(id));
            return send(res, 200, { ok: true });
        }
    }
    return send(res, 404, { error: 'not found' });
}

// Internetga (tunnel orqali) ochilganda maxfiy fayllar ko'rinmasligi kerak
const BLOCKED = new Set(['data.json', 'bot-state.json', 'server.js', 'index.js', 'load-env.js', 'setup-bot.js', 'telegram-local.js',
    'package.json', 'START.bat', 'README.txt', 'THEME_LANG_README.txt', 'bot-setup.html', 'vercel.json']);
const TYPES = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary'
};

function serveFile(res, p) {
    let rel = decodeURIComponent(p === '/' ? '/index.html' : p);
    if (rel.endsWith('/')) rel += 'index.html';
    const fp = path.normalize(path.join(ROOT, rel));
    const parts = path.relative(ROOT, fp).split(path.sep);
    if (!fp.startsWith(ROOT + path.sep) || parts.some(s => s.startsWith('.')) || parts[0] === 'api' || parts[0] === 'FUTBOL_MARKET_FIXED' ||
        (parts.length === 1 && BLOCKED.has(parts[0]))) {
        res.writeHead(404); return res.end('Not found');
    }
    fs.stat(fp, (e, st) => {
        if (!e && st.isDirectory()) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
        fs.readFile(fp, (err, b) => {
            if (err) { res.writeHead(404); return res.end('Not found'); }
            res.writeHead(200, { 'Content-Type': TYPES[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
            res.end(b);
        });
    });
}

const server = http.createServer(async (req, res) => {
    const p = new URL(req.url, 'http://x').pathname;
    if (req.method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' });
        return res.end();
    }
    if (p.startsWith('/api/')) {
        try { return await api(req, res, p); } catch (e) { return send(res, 500, { error: e.message }); }
    }
    serveFile(res, p);
});
server.listen(PORT, '0.0.0.0', () => console.log(`Admin paroli: ${process.env.ADMIN_KEY ? 'YOQILGAN (ADMIN_KEY bor)' : 'O‘CHIQ (parolsiz)'}`) || console.log(`Futbol Market: http://localhost:${PORT} (baza: ${store.enabled ? 'Supabase' : 'data.json'})`));
