/* =====================================================================
   /api/products (Vercel) — sayt, Telegram Mini App va bot uchun yagona ro'yxat
     GET             — hamma uchun (Supabase'dagi ro'yxat, bo'lmasa products.json)
     POST / PUT ?id / DELETE ?id — admin panel (x-admin-key va Supabase kerak)
   Yuklangan rasm Supabase Storage (product-images) ga tushadi.
   ===================================================================== */
const { readJson, store, getProducts, uploadImage, cleanProduct, isAdminRequest } = require("./_lib");

const MAX_IMG = 2800000; // Vercel so'rov chegarasi uchun: rasm ~2 MB gacha

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(await getProducts());
  }

  if (!store.enabled) return res.status(501).json({ error: "Baza ulanmagan: Vercel'da SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY ni yozing." });
  if (!isAdminRequest(req)) return res.status(401).json({ error: "Admin paroli kerak" });

  const id = String((req.query && req.query.id) || new URL(req.url, "http://x").searchParams.get("id") || "");

  if (req.method === "DELETE") {
    await store.deleteProduct(id);
    return res.status(200).json({ ok: true });
  }

  let body;
  try { body = await readJson(req); } catch (e) { return res.status(400).json({ error: "JSON xato" }); }
  if (String(body.img || "").length > MAX_IMG || String(body.customBackImage || "").length > MAX_IMG)
    return res.status(413).json({ error: "Rasm juda katta (har biri 2 MB gacha bo‘lsin)" });

  let p;
  if (req.method === "POST") {
    p = cleanProduct(body, { id: Number(body.id) || Date.now(), img: "./card.png", sizes: [], custom: false });
    if (!p.name || !p.price || !p.sizes.length) return res.status(400).json({ error: "Nomi, narx va o‘lchamlar kerak" });
  } else if (req.method === "PUT") {
    const old = (await getProducts()).find(x => String(x.id) === id);
    if (!old) return res.status(404).json({ error: "Topilmadi" });
    p = cleanProduct(body, old);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    p.img = await uploadImage(p.img, p.id);
    p.customBackImage = await uploadImage(p.customBackImage, String(p.id) + "-back");
  } catch (e) {
    console.error("Product image upload:", e.message);
    return res.status(502).json({ error: e.message || "Rasmni Supabase Storage'ga yuklab bo‘lmadi" });
  }
  const saved = await store.saveProduct(p);
  res.status(req.method === "POST" ? 201 : 200).json(saved);
};
