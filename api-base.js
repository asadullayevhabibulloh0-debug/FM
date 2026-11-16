/* /api/... so'rovlari shu sahifaning serverida topilmasa (Live Server, noto'g'ri papka, API deploy bo'lmagan hosting),
   avtomatik kompyuterdagi serverga (http://localhost:3000, START.bat) ulanadi. Hamma sahifalarga <script src="./api-base.js"> bilan ulanadi. */
(function () {
  const nativeFetch = window.fetch.bind(window);
  let base = "";
  const isJson = r => (r.headers.get("content-type") || "").includes("json");
  const probe = (async () => {
    try { const r = await nativeFetch("/api/products", { cache: "no-store" }); if (r.ok || isJson(r)) return; } catch (e) { }
    for (const b of ["http://localhost:3000", "http://127.0.0.1:3000"]) {
      try {
        const r = await nativeFetch(b + "/api/products", { cache: "no-store" });
        if (r.ok) { base = b; console.warn("[api-base] /api bu serverda yo'q — " + b + " ishlatilmoqda"); return; }
      } catch (e) { }
    }
  })();
  window.FM_API_READY = probe;
  window.fetch = async function (u, o) {
    if (typeof u === "string" && u.startsWith("/api/")) { await probe; return nativeFetch(base + u, o); }
    return nativeFetch(u, o);
  };
})();
