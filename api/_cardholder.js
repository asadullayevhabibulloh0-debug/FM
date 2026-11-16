/* =====================================================================
   Karta egasining ismini RASMIY bank / to'lov provayderi API'si orqali olish (tayyor adapter).

   MUHIM QOIDALAR:
   - API ulanmagan bo'lsa ism TAXMIN QILINMAYDI va DEMO ism ko'rsatilmaydi: configured:false qaytadi.
   - Karta raqami faqat shu so'rov davomida xotirada turadi: bazaga YOZILMAYDI, logga CHIQARILMAYDI.
   - Ism faqat ekranda ko'rsatiladi, buyurtmaga/bazaga saqlanmaydi.
   - Hech qanday pul yechilmaydi, CVV/SMS so'ralmaydi.

   ULASH (Vercel Environment Variables yoki .env):
     CARD_HOLDER_API_URL  = provayderning "karta egasini aniqlash" manzili (https://...)
     CARD_HOLDER_API_KEY  = provayder bergan maxfiy kalit (faqat serverda)
     CARD_HOLDER_API_AUTH = (ixtiyoriy) "Bearer" (standart) yoki "X-Api-Key"

   Quyidagi lookupHolder() — umumiy namuna: provayder hujjatiga qarab SO'ROV va JAVOB
   formatini shu funksiya ichida moslang (boshqa fayl o'zgarmaydi).
   ===================================================================== */

const API_URL = (process.env.CARD_HOLDER_API_URL || "").trim();
const API_KEY = (process.env.CARD_HOLDER_API_KEY || "").trim();
const API_AUTH = (process.env.CARD_HOLDER_API_AUTH || "Bearer").trim();

const configured = () => /^https:\/\//i.test(API_URL) && !!API_KEY;

const NOT_CONFIGURED_MESSAGE =
  "Karta egasining ismi ko‘rsatilmaydi: bank yoki to‘lov provayderi API’si hali ulanmagan. " +
  "Buyurtmani davom ettirishingiz mumkin.";

/* Qaytaradi: { holderName } yoki xato tashlaydi. number — faqat raqamlar (16 ta). */
async function lookupHolder(network, number) {
  const headers = { "Content-Type": "application/json" };
  if (/^x-api-key$/i.test(API_AUTH)) headers["X-Api-Key"] = API_KEY;
  else headers.Authorization = `Bearer ${API_KEY}`;

  const r = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ network, card_number: number }),   // <- provayder formatiga moslang
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error("Provayder javobi: HTTP " + r.status);   // karta raqami xatoga yozilmaydi
  const j = await r.json();
  const name = String(j.holder_name || j.holderName || j.owner || j.cardholder || "").trim();   // <- javob maydoni
  return { holderName: name.slice(0, 80) };
}

module.exports = { configured, lookupHolder, NOT_CONFIGURED_MESSAGE };
