/* /api/admin-login — admin parolini tekshiradi (x-admin-key). To'g'ri bo'lsa 200, noto'g'ri bo'lsa 401. */
const { isAdminRequest } = require("./_lib");

module.exports = require("./_lib").safe(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  // Live Server / boshqa manzildan ochilgan login.html ham tekshira olsin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!isAdminRequest(req)) return res.status(401).json({ error: "Parol noto‘g‘ri" });
  res.status(200).json({ ok: true });
}, "admin-login");
