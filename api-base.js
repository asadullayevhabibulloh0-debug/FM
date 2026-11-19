/* Sayt, admin panel va login sahifalari /api/... ni QAYERDAN olishini aniqlaydi.
   1) Sahifa turgan serverda /api bo'lsa (Vercel yoki START.bat -> localhost:3000) — o'shani ishlatadi.
   2) Bo'lmasa (VS Code Live Server :5500/5502, faylni ikki marta bosib ochish, boshqa hosting) —
      avval kompyuterdagi serverga (localhost:3000), u ham bo'lmasa Vercel'dagi asosiy saytga ulanadi.
   Natija: sayt ham, Telegram Mini App ham BITTA Supabase bazasiga yozadi va admin panel hammasini ko'radi.
   Hamma sahifalarga <script src="./api-base.js"></script> bilan (boshqa skriptlardan OLDIN) ulanadi. */
(function () {
  // Vercel'dagi asosiy sayt manzili (.env dagi PUBLIC_URL bilan bir xil). Domen o'zgarsa shu yerni yangilang.
  const PRODUCTION = "https://futbol-market-f53.vercel.app";

  const nativeFetch = window.fetch.bind(window);
  let base = "";
  const isJson = r => (r.headers.get("content-type") || "").includes("json");
  const tryBase = async b => {
    try {
      const r = await nativeFetch(b + "/api/products", { cache: "no-store" });
      return r.ok && isJson(r);
    } catch (e) { return false; }
  };
  const probe = (async () => {
    if (location.protocol !== "file:" && await tryBase("")) return;   // shu serverning o'zida /api bor
    const fallbacks = ["http://localhost:3000", "http://127.0.0.1:3000", PRODUCTION]
      .filter(b => b !== location.origin);
    for (const b of fallbacks) {
      if (await tryBase(b)) { base = b; console.warn("[api-base] /api bu serverda yo'q — " + b + " ishlatilmoqda"); return; }
    }
    console.error("[api-base] Hech qaysi API serverga ulanib bo'lmadi");
  })();
  window.FM_API_READY = probe;
  window.FM_API_BASE = () => base;
  window.fetch = async function (u, o) {
    if (typeof u === "string" && u.startsWith("/api/")) { await probe; return nativeFetch(base + u, o); }
    return nativeFetch(u, o);
  };
})();
