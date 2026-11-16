/* /api/admin-login — admin parolini tekshiradi (x-admin-key). To'g'ri bo'lsa 200, noto'g'ri bo'lsa 401. */
const { isAdminRequest } = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!isAdminRequest(req)) return res.status(401).json({ error: "Parol noto‘g‘ri" });
  res.status(200).json({ ok: true });
};
