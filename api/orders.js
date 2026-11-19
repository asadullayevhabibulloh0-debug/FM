/* =====================================================================
   /api/orders (Vercel)
     POST            — saytdan yoki Telegram Mini App'dan buyurtma (hamma uchun)
     GET             — admin panel uchun ro'yxat          (x-admin-key kerak)
     PUT    ?id=..   — bitta qatorni tahrirlash           (x-admin-key kerak)
     PUT    ?orderId=FM-..  — butun buyurtma: holat, ism, telefon, manzil
     DELETE ?id=.. | ?orderId=..  — o'chirish             (x-admin-key kerak)
   /api/orders/<id> manzili vercel.json orqali ?id=<id> ga yo'naltiriladi.
   Buyurtma bot orqali ADMIN_CHAT_ID ga boradi; Supabase ulangan bo'lsa admin panelga ham.
   ===================================================================== */
const {
  TOKEN, ADMINS, readJson,
  store, getProducts, pickOrderEdit, notifyNewOrder, notifyCustomerStatus, isAdminRequest, buildOrder, OrderError
} = require("./_lib");

async function create(req, res) {
  if (!TOKEN || !ADMINS.length) return res.status(503).json({ error: "Bot sozlanmagan (BOT_TOKEN / ADMIN_CHAT_ID)." });

  let body;
  try { body = await readJson(req); } catch (e) { return res.status(400).json({ error: "JSON xato" }); }

  let built;
  try { built = buildOrder(body, await getProducts()); }
  catch (e) {
    if (e instanceof OrderError) return res.status(e.status).json({ error: e.message });
    throw e;
  }
  const { order, lines } = built;

  // Sayt va Telegram buyurtmasi bir xil yo'l bilan Supabase'ga yoziladi -> admin panel ikkalasini ham ko'radi
  let saved = false, saveError = "";
  if (store.enabled) {
    for (let attempt = 0; attempt < 2 && !saved; attempt++) {
      try { await store.addOrders(lines); saved = true; }
      catch (e) { saveError = e.message; console.error(`saqlanmadi (${order.source}, urinish ${attempt + 1}):`, e.message); }
    }
  } else saveError = "Supabase ulanmagan (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)";

  // Bazaga yozilmagan bo'lsa admin Telegram xabarida buni ko'radi (buyurtma yo'qolmaydi)
  const delivered = await notifyNewOrder(order, saved ? "" : saveError);
  if (!delivered && !saved) return res.status(502).json({ error: "Buyurtma saqlanmadi: " + saveError });
  res.status(201).json({ ok: true, saved, id: order.id, total: order.total, discount: order.discount, payment: order.payment,
    ...(saved ? {} : { warning: "Admin panelga yozilmadi: " + saveError }) });
}

module.exports = require("./_lib").safe(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "POST") return create(req, res);

  /* ----- admin panel ----- */
  if (!["GET", "PUT", "DELETE"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  if (!store.enabled) return res.status(501).json({ error: "Baza ulanmagan: Vercel'da SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY ni yozing." });
  if (!isAdminRequest(req)) return res.status(401).json({ error: "Admin paroli kerak" });

  const q = new URL(req.url, "http://x").searchParams;
  const id = String((req.query && req.query.id) || q.get("id") || "");
  const orderId = String((req.query && req.query.orderId) || q.get("orderId") || "");
  if (req.method === "GET") return res.status(200).json(await store.orders());
  if (!id && !orderId) return res.status(400).json({ error: "id yoki orderId kerak" });

  if (req.method === "DELETE") {
    await (orderId ? store.deleteByOrderId(orderId) : store.deleteOrder(id));
    return res.status(200).json({ ok: true });
  }

  let patch;
  try { patch = await readJson(req); } catch (e) { return res.status(400).json({ error: "JSON xato" }); }
  const clean = pickOrderEdit(patch);

  // butun buyurtma (savat): holat, ism, telefon, manzil — mijozga bitta xabar boradi
  if (orderId) {
    const before = (await store.orders()).find(o => o.orderId === orderId);
    if (!before) return res.status(404).json({ error: "Topilmadi" });
    const rows = await store.updateByOrderId(orderId, clean);
    if (clean.status && clean.status !== before.status) await notifyCustomerStatus(before, clean.status);
    return res.status(200).json(rows);
  }

  const before = (await store.orders()).find(o => String(o.id) === id);
  const next = await store.updateOrder(id, clean);
  if (!next) return res.status(404).json({ error: "Topilmadi" });
  if (before && clean.status && clean.status !== before.status) await notifyCustomerStatus(next, clean.status);
  res.status(200).json(next);
}, "orders");
