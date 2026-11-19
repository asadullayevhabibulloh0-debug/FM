/* =====================================================================
   FUTBOL MARKET — umumiy kod: Vercel funksiyalari (api/*.js) va
   kompyuterdagi server (server.js) shu faylni ishlatadi.
   "_" bilan boshlangan fayl Vercel'da API manzili bo'lmaydi.

   Vercel Environment Variables:
     BOT_TOKEN      — @BotFather tokeni
     ADMIN_CHAT_ID  — buyurtmalar keladigan chat ID (bir nechta: 123,456)
     ADMIN_KEY      — admin panel paroli (Vercel'dagi admin.html uchun)
     SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — Supabase (Project Settings → API).
       Shu bo'lsa buyurtmalar, mahsulotlar va rasmlar saqlanadi va admin panelda ko'rinadi.
   ===================================================================== */

const crypto = require("crypto");
const productsFile = require("../products.json");

const TOKEN = (process.env.BOT_TOKEN || "").trim();
const ADMINS = (process.env.ADMIN_CHAT_ID || "").split(",").map(s => s.trim()).filter(Boolean);
const ADMIN_KEY = (process.env.ADMIN_KEY || "").trim();

const DELIVERY_FEE = 10000;
const PRINT_FEE = 50000;

/* ---------------- To'lov usullari ----------------
   Bu faqat tanlangan usulni QAYD qiladi: pul yechilmaydi, o'tkazilmaydi, CVV/SMS so'ralmaydi.
   Karta raqami serverga umuman kelmaydi — brauzer faqat oxirgi 4 raqamni yuboradi. */
const PAYMENT_METHODS = ["UZCARD", "HUMO", "UZUM CARD", "VISA", "Naqd pul"];
const CARD_METHODS = ["UZCARD", "HUMO", "UZUM CARD", "VISA"];
const DISCOUNTS = { "UZUM CARD": 20000 };   // butun buyurtmaga BIR marta (so'm)

// to'lov nomini standart ko'rinishga keltiradi; noma'lum bo'lsa null
function normPayment(v) {
  const k = String(v || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (k === "UZCARD") return "UZCARD";
  if (k === "HUMO") return "HUMO";
  if (k === "UZUMCARD" || k === "UZUM") return "UZUM CARD";
  if (k === "VISA") return "VISA";
  if (k === "NAQDPUL" || k === "NAQD" || k === "CASH") return "Naqd pul";
  return null;
}

// chegirma faqat serverda hisoblanadi (brauzerdan kelgan qiymatga ishonilmaydi)
function discountFor(payment, subtotal) {
  return Math.max(0, Math.min(DISCOUNTS[payment] || 0, subtotal));
}

// Admin paneldagi va index.js dagi holat nomlari bilan bir xil
const STATUS = { t: "Tayyorlanmoqda", y: "Yetkazilmoqda", d: "Yetkazildi", c: "Bekor" };
const STATUS_ICON = { "Yangi": "🆕", "Tayyorlanmoqda": "📦", "Yetkazilmoqda": "🚚", "Yetkazildi": "✅", "Bekor": "❌" };
const STATUS_NOTE = {
  "Tayyorlanmoqda": "Buyurtmangiz tayyorlanmoqda 📦",
  "Yetkazilmoqda": "Buyurtmangiz yo‘lda! Kuryer tez orada yetib boradi 🚚",
  "Yetkazildi": "Buyurtmangiz yetkazildi. Xaridingiz uchun rahmat! ✅",
  "Bekor": "Buyurtmangiz bekor qilindi. Savollar bo‘lsa shu yerga yozing ❌"
};

const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const money = n => Number(n || 0).toLocaleString("en-US").replace(/,/g, " ") + " so‘m";
const clip = (s, n) => String(s ?? "").trim().slice(0, n);
const MAP_RE = /^https:\/\/(www\.google\.com\/maps\?q=|maps\.google\.com\/\?q=)(-?[\d.]+),(-?[\d.]+)$/;

// Webhook so'rovi rostdan Telegramdan kelganini tekshirish uchun (tokendan hosil qilinadi)
const webhookSecret = () => crypto.createHash("sha256").update("fm-webhook:" + TOKEN).digest("hex").slice(0, 48);

async function tg(method, params = {}) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  const j = await r.json();
  if (!j.ok) throw new Error(`${method}: ${j.description}`);
  return j.result;
}

function siteUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `https://${host}`;
}

/* ---------------- Saqlash: Supabase (REST, paket kerak emas) ----------------
   Jadvallar: supabase/schema.sql. Kalit faqat serverda turadi (brauzerga berilmaydi). */

const SB_URL = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
const SB_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();
const IMG_BUCKET = "product-images";

function sbHeaders(extra = {}) {
  // eski kalit (eyJ...) JWT — Authorization ga ham yoziladi; yangi sb_secret_... faqat apikey da
  return { apikey: SB_KEY, ...(SB_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${SB_KEY}` } : {}), ...extra };
}

async function sb(query, { method = "GET", body, prefer } = {}) {
  let r;
  try {
    r = await fetch(`${SB_URL}/rest/v1/${query}`, {
      method,
      headers: sbHeaders({ "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) }),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(8000)
    });
  } catch (e) {
    throw new Error("Supabase ga ulanib bo'lmadi (" + e.message + "). SUPABASE_URL noto'g'ri yoki loyiha Paused bo'lishi mumkin.");
  }
  const text = await r.text();
  let j = null;
  try { j = text ? JSON.parse(text) : null; } catch (e) { /* JSON emas */ }
  if (!r.ok) {
    const msg = (j && (j.message || j.error || j.hint)) || text.slice(0, 160) || "";
    const hint = r.status === 404 || (j && /PGRST205/.test(j.code || "")) ? " — jadval yo'q: schema.sql ni SQL Editor'da Run qiling"
      : r.status === 401 || r.status === 403 ? " — kalit noto'g'ri (secret/service_role kalit va URL bitta loyihadan bo'lsin)" : "";
    throw new Error(`Supabase HTTP ${r.status}: ${msg}${hint}`);
  }
  return j;
}

/* /api/health uchun: Supabase qaysi qadamda to'xtayotganini aytadi (kalit ko'rsatilmaydi) */
async function checkSupabase() {
  const steps = [];
  const add = (name, ok, detail = "") => { steps.push({ name, ok, detail }); return ok; };
  if (!add("SUPABASE_URL berilgan", !!SB_URL, SB_URL ? "" : "Vercel → Settings → Environment Variables ga SUPABASE_URL yozing, so'ng qayta deploy qiling")) return steps;
  if (!add("SUPABASE_SERVICE_ROLE_KEY berilgan", !!SB_KEY, SB_KEY ? "" : "Vercel da SUPABASE_SERVICE_ROLE_KEY yo'q")) return steps;
  add("URL formati to'g'ri", /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(SB_URL), SB_URL);
  add("Kalit turi", !SB_KEY.startsWith("sb_publishable_") && !(SB_KEY.startsWith("eyJ") && /"role":"anon"/.test(Buffer.from(SB_KEY.split(".")[1] || "", "base64url").toString())),
    SB_KEY.startsWith("sb_publishable_") ? "Bu publishable kalit — secret kerak" : "");
  for (const t of ["products", "orders"]) {
    try { const rows = await sb(`${t}?select=id&limit=1`); add(`"${t}" jadvali`, true, `${rows.length ? "ma'lumot bor" : "bo'sh"}`); }
    catch (e) { add(`"${t}" jadvali`, false, e.message); }
  }
  try {
    const b = await fetch(`${SB_URL}/storage/v1/bucket/${IMG_BUCKET}`, { headers: sbHeaders(), signal: AbortSignal.timeout(8000) });
    add(`Storage "${IMG_BUCKET}"`, b.ok, b.ok ? "" : `HTTP ${b.status} — schema.sql ni Run qiling`);
  } catch (e) { add(`Storage "${IMG_BUCKET}"`, false, e.message); }
  return steps;
}

// admin panel / bot camelCase ishlatadi, bazada snake_case: userName <-> user_name
const ORDER_FIELDS = ["id", "orderId", "source", "tgUserId", "userId", "userName", "email", "productId", "product", "category",
  "size", "quantity", "custom", "shirtName", "shirtNumber", "shirtColor", "customBackImage", "unitPrice", "delivery", "total", "phone", "address", "location",
  "payment", "cardLast4", "discount", "note", "status", "date"];
const toSnake = k => k.replace(/[A-Z]/g, c => "_" + c.toLowerCase());
const toCamel = k => k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

function toOrderRow(o) {
  const row = {};
  for (const k of ORDER_FIELDS) if (o[k] !== undefined) row[toSnake(k)] = o[k];
  if (row.user_id != null) row.user_id = String(row.user_id);
  return row;
}
const fromOrderRow = row => Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v]));
const isId = id => /^\d{1,18}$/.test(String(id));
const PRODUCT_COLS = "id,name,cat,price,old_price,img,sizes,custom,custom_back_image,custom_text_color";
const PRODUCT_COLS_LEGACY = "id,name,cat,price,img,sizes,custom,custom_back_image,custom_text_color";   // old_price ustuni hali yo'q bo'lsa
const fromProductRow = row => {
  const p = { ...row, customBackImage: row.custom_back_image || "", customTextColor: row.custom_text_color || "" };
  if (row.old_price != null) p.oldPrice = Number(row.old_price) || 0;
  delete p.old_price;
  return p;
};

const store = {
  enabled: !!(SB_URL && SB_KEY),
  async orders() {
    return (await sb("orders?select=*&order=id.asc")).map(fromOrderRow);
  },
  async addOrders(lines, { upsert = false } = {}) {
    if (!lines.length) return;
    const prefer = (upsert ? "resolution=merge-duplicates," : "") + "return=minimal";
    try {
      await sb("orders", { method: "POST", body: lines.map(toOrderRow), prefer });
    } catch (e) {
      // Supabase'da "discount" ustuni hali qo'shilmagan bo'lsa buyurtma yo'qolmasin (migratsiya: supabase/DISCOUNT_MIGRATION.sql)
      if (!/discount/i.test(e.message)) throw e;
      console.error("orders.discount ustuni yo'q — supabase/DISCOUNT_MIGRATION.sql ni ishga tushiring. Chegirmasiz saqlanmoqda.");
      await sb("orders", { method: "POST", body: lines.map(l => { const r = toOrderRow(l); delete r.discount; return r; }), prefer });
    }
  },
  async updateOrder(id, patch) {
    if (!isId(id)) return null;
    const row = toOrderRow(patch);
    delete row.id;
    const rows = Object.keys(row).length
      ? await sb(`orders?id=eq.${id}`, { method: "PATCH", body: row, prefer: "return=representation" })
      : await sb(`orders?id=eq.${id}&select=*`);
    return rows[0] ? fromOrderRow(rows[0]) : null;
  },
  async deleteOrder(id) {
    if (isId(id)) await sb(`orders?id=eq.${id}`, { method: "DELETE" });
  },
  async setStatusByOrderId(orderId, status) {
    const rows = await sb(`orders?order_id=eq.${encodeURIComponent(orderId)}&select=id`, { method: "PATCH", body: { status }, prefer: "return=representation" });
    return rows.length;
  },
  // bitta buyurtmaning (savatning) hamma qatorlari
  async updateByOrderId(orderId, patch) {
    const row = toOrderRow(patch);
    delete row.id;
    if (!Object.keys(row).length) return [];
    return (await sb(`orders?order_id=eq.${encodeURIComponent(orderId)}`, { method: "PATCH", body: row, prefer: "return=representation" })).map(fromOrderRow);
  },
  async deleteByOrderId(orderId) {
    await sb(`orders?order_id=eq.${encodeURIComponent(orderId)}`, { method: "DELETE" });
  },
  async products() {
    let rows;
    try { rows = await sb(`products?select=${PRODUCT_COLS}&order=id.asc`); }
    catch (e) {
      if (!/old_price/i.test(e.message)) throw e;   // migratsiya qilinmagan baza: eski ustunlar bilan o'qiymiz
      rows = await sb(`products?select=${PRODUCT_COLS_LEGACY}&order=id.asc`);
    }
    return rows.map(fromProductRow);
  },
  // qo'shish yoki tahrirlash (id bo'yicha). camelCase maydonlar bazadagi snake_case ustunlarga aylantiriladi.
  async saveProduct(p) {
    const payload = {
      id: p.id, name: p.name, cat: p.cat, price: p.price, img: p.img, sizes: p.sizes, custom: !!p.custom,
      custom_back_image: p.customBackImage || "", custom_text_color: p.customTextColor || "#FFFFFF"
    };
    if (p.oldPrice !== undefined) payload.old_price = Math.max(0, Math.round(Number(p.oldPrice) || 0));
    const save = (body, cols) => sb(`products?select=${cols}`, { method: "POST", body, prefer: "resolution=merge-duplicates,return=representation" });
    let rows;
    try { rows = await save(payload, PRODUCT_COLS); }
    catch (e) {
      if (!/old_price/i.test(e.message)) throw e;
      console.error("products.old_price ustuni yo'q — supabase/OLD_PRICE_MIGRATION.sql ni Run qiling. Eski narxsiz saqlanmoqda.");
      delete payload.old_price;
      rows = await save(payload, PRODUCT_COLS_LEGACY);
    }
    return rows[0] ? fromProductRow(rows[0]) : rows[0];
  },
  async deleteProduct(id) {
    if (isId(id)) await sb(`products?id=eq.${id}`, { method: "DELETE" });
  }
};

/* Supabase Storage bucket mavjudligini tekshiradi; yo'q bo'lsa server kaliti bilan yaratadi. */
let bucketReady = null;
async function ensureImageBucket() {
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    const headers = sbHeaders();
    const check = await fetch(`${SB_URL}/storage/v1/bucket/${IMG_BUCKET}`, { headers, signal: AbortSignal.timeout(10000) });
    if (check.ok) return;
    if (check.status !== 404) {
      const detail = (await check.text()).slice(0, 240);
      throw new Error(`Storage bucket tekshirilmadi (HTTP ${check.status}): ${detail}`);
    }
    const create = await fetch(`${SB_URL}/storage/v1/bucket`, {
      method: "POST",
      headers: sbHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id: IMG_BUCKET, name: IMG_BUCKET, public: true, fileSizeLimit: 5242880, allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"] }),
      signal: AbortSignal.timeout(10000)
    });
    if (!create.ok && create.status !== 409) {
      const detail = (await create.text()).slice(0, 240);
      throw new Error(`Storage bucket yaratilmadi (HTTP ${create.status}): ${detail}`);
    }
  })().catch(err => { bucketReady = null; throw err; });
  return bucketReady;
}

/* Admin panel yuborgan data URL rasmni Storage'ga joylaydi va public URL qaytaradi. */
async function uploadImage(dataUrl, id) {
  const value = String(dataUrl || "");
  if (!value) return "";
  if (!value.startsWith("data:")) return value; // oldindan yuklangan URL
  const m = value.match(/^data:(image\/(png|jpe?g|webp|gif|avif));base64,([A-Za-z0-9+/=\r\n]+)$/i);
  if (!m) throw new Error("Rasm formati noto'g'ri. PNG, JPG yoki WEBP rasm tanlang.");
  if (!SB_URL || !SB_KEY) throw new Error("Supabase server kaliti sozlanmagan (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  await ensureImageBucket();
  const ext = m[2].toLowerCase() === "jpeg" ? "jpg" : m[2].toLowerCase();
  const file = `${String(id).replace(/[^a-zA-Z0-9_-]/g, "_")}-${Date.now()}.${ext}`;
  const r = await fetch(`${SB_URL}/storage/v1/object/${IMG_BUCKET}/${file}`, {
    method: "POST",
    headers: sbHeaders({ "Content-Type": m[1].toLowerCase(), "x-upsert": "true", "cache-control": "31536000" }),
    body: Buffer.from(m[3].replace(/[\r\n]/g, ""), "base64"),
    signal: AbortSignal.timeout(20000)
  });
  if (!r.ok) throw new Error(`Supabase Storage yuklash xatosi (HTTP ${r.status}): ${(await r.text()).slice(0, 240)}`);
  return `${SB_URL}/storage/v1/object/public/${IMG_BUCKET}/${file}`;
}

async function getProducts() {
  if (store.enabled) {
    try { const list = await store.products(); if (Array.isArray(list) && list.length) return list; }
    catch (e) { console.error("getProducts:", e.message); }
  }
  return productsFile;
}

/* Admin paneldan kelgan mahsulot maydonlarini tozalash */
function cleanProduct(x, old = {}) {
  const p = { ...old };
  if (x.name !== undefined) p.name = String(x.name).trim().slice(0, 80);
  if (x.cat !== undefined) p.cat = String(x.cat).trim().slice(0, 30);
  if (x.price !== undefined) p.price = Math.max(0, Math.round(Number(x.price) || 0));
  if (x.oldPrice !== undefined || x.old_price !== undefined) {
    const value = x.oldPrice !== undefined ? x.oldPrice : x.old_price;
    p.oldPrice = Math.max(0, Math.round(Number(value) || 0));
  }
  if (x.sizes !== undefined) p.sizes = (Array.isArray(x.sizes) ? x.sizes : String(x.sizes).split(",")).map(s => String(s).trim()).filter(Boolean).slice(0, 20);
  if (x.custom !== undefined) p.custom = !!x.custom;
  if (x.img !== undefined) p.img = String(x.img);
  const backImage = x.customBackImage !== undefined ? x.customBackImage : x.custom_back_image;
  const textColor = x.customTextColor !== undefined ? x.customTextColor : x.custom_text_color;
  if (backImage !== undefined) p.customBackImage = String(backImage || "");
  if (textColor !== undefined) p.customTextColor = /^#[0-9a-f]{6}$/i.test(String(textColor)) ? String(textColor).toUpperCase() : "#FFFFFF";
  return p;
}

/* Yangi buyurtma: adminlarga xabar (holat tugmalari bilan) va Telegram mijozga tasdiq.
   Qaytaradi: nechta admin chatiga yetib bordi. */
async function notifyNewOrder(order, saveWarning = "") {
  if (!TOKEN) return 0;
  let delivered = 0;
  // ogohlantirish holat qatoridan OLDIN turadi (holat tugmalari xabarning oxirgi qatorini almashtiradi)
  const warn = saveWarning ? `⚠️ <b>Admin panelga (Supabase) yozilmadi:</b> ${esc(String(saveWarning).slice(0, 300)).replace(/\n/g, " ")} — /api/health ni tekshiring` : "";
  for (const chat of ADMINS) {
    try {
      await tg("sendMessage", {
        chat_id: chat, text: orderText(order, "Yangi", warn), parse_mode: "HTML",
        disable_web_page_preview: true, reply_markup: statusKeyboard(order.tgUserId)
      });
      delivered++;
      const m = order.location.match(MAP_RE);
      if (m) await tg("sendLocation", { chat_id: chat, latitude: +m[2], longitude: +m[3] }).catch(() => { });
    } catch (e) {
      console.error("admin ga yuborilmadi:", e.message);
    }
  }
  if (order.tgUserId) {
    await tg("sendMessage", { chat_id: order.tgUserId, parse_mode: "HTML", text: customerConfirmText(order) }).catch(() => { });
  }
  return delivered;
}

/* Admin panelda holat o'zgarsa — Telegram orqali buyurtma bergan mijozga bitta xabar */
async function notifyCustomerStatus(line, status) {
  if (!TOKEN || !line || !line.tgUserId || !STATUS_NOTE[status]) return;
  await tg("sendMessage", {
    chat_id: line.tgUserId, parse_mode: "HTML",
    text: `<code>#${esc(line.orderId || line.id)}</code> — ${STATUS_NOTE[status]}`
  }).catch(e => console.error("mijozga yuborilmadi:", e.message));
}

// admin panel buyurtmada shu maydonlarni o'zgartira oladi
const ORDER_EDITABLE = ["userName", "quantity", "status", "total", "unitPrice", "phone", "address"];
const pickOrderEdit = patch => Object.fromEntries(Object.entries(patch || {}).filter(([k]) => ORDER_EDITABLE.includes(k)));

/* Admin panel so'rovi (Vercel'da ADMIN_KEY bilan himoyalangan) */
function isAdminRequest(req) {
  if (!ADMIN_KEY) return true; // ADMIN_KEY bo'sh = admin panel PAROLSIZ (hamma kira oladi)
  return safeEqual(String(req.headers["x-admin-key"] || ""), ADMIN_KEY);
}

/* parolni solishtirish: bayt uzunligi bo'yicha (o'zbekcha/kirill harfli parolda ham xato bermaydi) */
function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

/* Har bir API funksiyasini o'raydi: xato bo'lsa Vercel'ning "500 FUNCTION_INVOCATION_FAILED"
   sahifasi o'rniga aniq sababni ko'rsatadi (kalitlar ko'rsatilmaydi). */
function safe(handler, name) {
  return async (req, res) => {
    try { return await handler(req, res); }
    catch (e) {
      console.error(`[${name}]`, e && e.stack || e);
      if (res.headersSent) { try { res.end(); } catch (x) { } return; }
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify({ error: `Server xatosi (${name}): ${e && e.message || e}` }));
    }
  };
}

/* Telegram Mini App initData imzosini tekshirish (https://core.telegram.org/bots/webapps) */
function verifyInitData(initData) {
  if (!initData || !TOKEN) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(TOKEN).digest();
  const calc = crypto.createHmac("sha256", secret).update(check).digest("hex");
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  if (Date.now() / 1000 - Number(params.get("auth_date") || 0) > 86400) return null;
  try { return JSON.parse(params.get("user") || "null"); } catch (e) { return null; }
}

/* ---------------- Buyurtma: tekshirish va yozuvlarga aylantirish ---------------- */

class OrderError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function normPhone(v) {
  let d = String(v || "").replace(/\D/g, "");
  if (d.length === 9) d = "998" + d;
  return d.length >= 9 && d.length <= 15 ? "+" + d : null;
}

function buildItem(line, products) {
  const p = products.find(x => String(x.id) === String(line.productId))
    || products.find(x => x.name === (line.product || line.name));
  if (!p) throw new OrderError(400, "Mahsulot topilmadi: " + clip(line.product || line.name || line.productId, 40));

  const size = String(line.size || "");
  if (!(p.sizes || []).map(String).includes(size)) throw new OrderError(400, `${p.name}: o‘lcham noto‘g‘ri`);

  const qty = Number(line.quantity ?? line.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new OrderError(400, `${p.name}: miqdor noto‘g‘ri`);

  const custom = !!(line.custom && p.custom);
  const shirtName = custom ? clip(line.shirtName, 12).toUpperCase() : "";
  const shirtNumber = custom ? String(parseInt(line.shirtNumber, 10) || "") : "";
  if (custom && (!shirtName || !(+shirtNumber >= 1 && +shirtNumber <= 99))) throw new OrderError(400, `${p.name}: ism va raqam kerak`);

  // narxni serverda qayta hisoblaymiz — brauzerdan kelgan narxga ishonmaymiz
  return { productId: p.id, name: p.name, cat: p.cat, size, qty, custom, shirtName, shirtNumber,
    shirtColor: custom ? (p.customTextColor || "#FFFFFF") : "",
    customBackImage: custom ? (p.customBackImage || "") : "",
    unitPrice: Number(p.price) + (custom ? PRINT_FEE : 0) };
}

/* body: { orders:[...], initData?, note? } | [...] | bitta yozuv (eski sayt formati).
   Qaytaradi: order (xabar uchun umumiy ko'rinish) va lines (admin panel / data.json yozuvlari). */
function buildOrder(body, products) {
  const raw = Array.isArray(body) ? body : Array.isArray(body.orders) ? body.orders : [body];
  if (!raw.length || raw.length > 30) throw new OrderError(400, "Savat bo‘sh yoki juda katta");
  const items = raw.map(l => buildItem(l, products));

  const f = raw[0];
  const tgUser = verifyInitData(body.initData);
  if (body.initData && TOKEN && !tgUser) throw new OrderError(401, "Telegram ma’lumoti tasdiqlanmadi. Mini App'ni qayta oching.");

  const phone = normPhone(f.phone);
  const address = clip(f.address, 300);
  const location = MAP_RE.test(f.location || "") ? f.location : "";
  if (!phone) throw new OrderError(400, "Telefon raqam noto‘g‘ri");
  if (address.length < 5 && !location) throw new OrderError(400, "Manzil kerak");

  // to'lov usuli: faqat qayd qilinadi. Chegirma va yakuniy summa shu yerda, serverda hisoblanadi.
  const method = normPayment(f.payment);
  const isCard = CARD_METHODS.includes(method);
  const last4 = String(f.cardLast4 || "");
  if (isCard && !/^\d{4}$/.test(last4)) throw new OrderError(400, "Karta raqami noto‘g‘ri");

  const now = Date.now();
  const subtotal = items.reduce((n, x) => n + x.unitPrice * x.qty, 0);
  const discount = discountFor(method, subtotal);
  const order = {
    id: "FM-" + now.toString(36).slice(-5).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase(),
    source: tgUser ? "tg" : "web",
    tgUserId: tgUser ? tgUser.id : null,
    name: clip(f.userName || f.name || (tgUser && tgUser.first_name) || "Mijoz", 60),
    contact: tgUser ? (tgUser.username ? "@" + tgUser.username : "tg id " + tgUser.id) : clip(f.email, 80),
    phone, address, location,
    payment: method || (f.payment === "Karta" ? "Karta" : clip(f.payment || "Naqd pul", 40)),   // eski "Karta" / Mini App qiymatlari buzilmaydi
    cardLast4: (isCard || !method) && /^\d{4}$/.test(last4) ? last4 : "",   // faqat oxirgi 4 raqam; naqd pulda yo'q
    note: clip(body.note || f.note, 200),
    items, subtotal, delivery: DELIVERY_FEE, discount, total: subtotal + DELIVERY_FEE - discount
  };

  // admin.html / data.json formati: har bir mahsulot alohida yozuv, orderId bilan bog'langan
  const date = new Date(now).toISOString();
  // chegirma butun buyurtmaga bitta marta: qatorlarga ketma-ket taqsimlanadi (jami = discount, hech bir qator manfiy bo'lmaydi)
  let left = discount;
  const lines = items.map((x, i) => {
    const gross = x.unitPrice * x.qty;
    const d = Math.min(left, gross);
    left -= d;
    return {
      id: now + i, orderId: order.id, source: order.source, tgUserId: order.tgUserId,
      userId: f.userId ?? null, userName: order.name, email: order.contact,
      productId: x.productId, product: x.name, category: x.cat, size: x.size, quantity: x.qty,
      custom: x.custom, shirtName: x.shirtName, shirtNumber: x.shirtNumber, shirtColor: x.shirtColor,
      customBackImage: x.customBackImage, unitPrice: x.unitPrice,
      delivery: i === 0 ? DELIVERY_FEE : 0, discount: d, total: gross + (i === 0 ? DELIVERY_FEE : 0) - d,
      phone, address, location, payment: order.payment, cardLast4: order.cardLast4, note: order.note,
      status: "Yangi", date
    };
  });
  return { order, lines, tgUser };
}

/* Buyurtma xabari (admin uchun). Holat xabarning oxirgi qatorida turadi. */
function orderText(o, status, warning = "") {
  const items = o.items.map((x, i) => {
    const extra = x.custom ? ` • yozuv: ${esc(x.shirtName)} #${esc(x.shirtNumber)}` : "";
    return `${i + 1}. <b>${esc(x.name)}</b>\n    O‘lcham: ${esc(x.size)} × ${x.qty}${extra}\n    ${money(x.unitPrice * x.qty)}`;
  }).join("\n");
  const pay = o.payment === "Naqd pul" || !o.payment
    ? `💵 ${esc(o.payment || "Naqd pul")}`
    : `💳 ${esc(o.payment)}${o.cardLast4 ? " •••• " + esc(o.cardLast4) : ""}`;

  return [
    `🛒 <b>Buyurtma</b> <code>#${esc(o.id)}</code> · ${o.source === "tg" ? "📱 Telegram" : "🌐 Sayt"}`,
    "",
    `👤 ${esc(o.name)}${o.contact ? " (" + esc(o.contact) + ")" : ""}`,
    `📞 ${esc(o.phone)}`,
    o.address ? `📍 ${esc(o.address)}` : null,
    o.location ? `🗺 <a href="${esc(o.location)}">Xaritada ochish</a>` : null,
    pay,
    o.note ? `📝 ${esc(o.note)}` : null,
    "",
    items,
    "",
    `🚚 Yetkazib berish: ${money(o.delivery)}`,
    o.discount ? `🎁 ${esc(o.payment)} chegirmasi: −${money(o.discount)}` : null,
    `💰 <b>Jami: ${money(o.total)}</b>`,
    warning || null,
    `${STATUS_ICON[status] || "📌"} Holat: <b>${esc(status)}</b>`
  ].filter(x => x !== null).join("\n");
}

function customerConfirmText(o) {
  const list = o.items.map(x => `• ${esc(x.name)} — ${esc(x.size)} × ${x.qty}`).join("\n");
  return `✅ <b>Buyurtmangiz qabul qilindi</b> <code>#${esc(o.id)}</code>\n\n${list}\n\n${o.discount ? `🎁 Chegirma: −${money(o.discount)}\n` : ""}💰 Jami: <b>${money(o.total)}</b>\n\nAdmin tez orada ${esc(o.phone)} raqamiga qo‘ng‘iroq qiladi. Holat o‘zgarsa shu yerga xabar keladi.`;
}

// callback_data: s:<holat kodi>:<mijoz telegram id yoki 0>  (64 baytgacha)
function statusKeyboard(customerId) {
  const c = customerId || 0;
  return {
    inline_keyboard: [
      [{ text: "📦 Tayyorlanmoqda", callback_data: `s:t:${c}` }, { text: "🚚 Yetkazilmoqda", callback_data: `s:y:${c}` }],
      [{ text: "✅ Yetkazildi", callback_data: `s:d:${c}` }, { text: "❌ Bekor", callback_data: `s:c:${c}` }]
    ]
  };
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

module.exports = {
  safe, safeEqual, TOKEN, ADMINS, ADMIN_KEY, DELIVERY_FEE, PRINT_FEE, PAYMENT_METHODS, CARD_METHODS, DISCOUNTS, normPayment, discountFor, STATUS, STATUS_ICON, STATUS_NOTE, MAP_RE,
  esc, money, tg, siteUrl, verifyInitData, orderText, customerConfirmText, statusKeyboard, webhookSecret, readJson,
  store, checkSupabase, getProducts, uploadImage, cleanProduct, pickOrderEdit, notifyNewOrder, notifyCustomerStatus, ORDER_FIELDS, isAdminRequest, buildOrder, OrderError
};
