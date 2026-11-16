/* =====================================================================
   /api/card-lookup — karta egasining ismi (faqat rasmiy API ulangan bo'lsa)
     GET   -> { configured: true|false }   (sahifa API borligini bilib olishi uchun)
     POST  { network, number } -> { configured:true, holderName } | 501 { configured:false, message }
   Karta raqami saqlanmaydi, logga yozilmaydi. Pul yechilmaydi.
   ===================================================================== */
const { readJson, CARD_METHODS } = require("./_lib");
const { configured, lookupHolder, NOT_CONFIGURED_MESSAGE } = require("./_cardholder");

// oddiy cheklov (bir manzildan daqiqada 10 ta) — serverless'da faqat qisman ishlaydi, lekin suiiste'molni kamaytiradi
const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 60000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 500) hits.clear();
  return list.length > 10;
}

function luhn(num) {
  let sum = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) { let d = +num[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } sum += d; alt = !alt; }
  return sum % 10 === 0;
}

module.exports = require("./_lib").safe(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") return res.status(200).json({ configured: configured() });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!configured()) return res.status(501).json({ configured: false, message: NOT_CONFIGURED_MESSAGE });

  const ip = String(req.headers["x-forwarded-for"] || (req.socket && req.socket.remoteAddress) || "").split(",")[0].trim();
  if (limited(ip)) return res.status(429).json({ configured: true, message: "Juda ko‘p so‘rov. Biroz kuting." });

  let body;
  try { body = await readJson(req); } catch (e) { return res.status(400).json({ message: "JSON xato" }); }
  const network = String(body.network || "");
  const number = String(body.number || "").replace(/\D/g, "");
  if (!CARD_METHODS.includes(network) || number.length !== 16 || !luhn(number)) {
    return res.status(400).json({ configured: true, message: "Karta raqami noto‘g‘ri" });
  }

  try {
    const { holderName } = await lookupHolder(network, number);
    if (!holderName) return res.status(200).json({ configured: true, holderName: "", message: "Provayder karta egasining ismini qaytarmadi." });
    return res.status(200).json({ configured: true, holderName });
  } catch (e) {
    // diqqat: xabarda karta raqami bo'lmaydi
    console.error("card-lookup:", e.message);
    return res.status(502).json({ configured: true, message: "Bank API’sidan javob olinmadi. Keyinroq urinib ko‘ring." });
  }
}, "card-lookup");
