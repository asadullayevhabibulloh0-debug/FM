/* /api/health — brauzerda oching: https://SAYT/api/health  (Supabase qaysi qadamda to'xtayotganini ko'rsatadi) */
const { checkSupabase, store, TOKEN, ADMINS, ADMIN_KEY, tg, siteUrl } = require("./_lib");

module.exports = require("./_lib").safe(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const steps = await checkSupabase();
  const env = { BOT_TOKEN: !!TOKEN, ADMIN_CHAT_ID: ADMINS.length > 0, ADMIN_KEY: !!ADMIN_KEY, SUPABASE: store.enabled };
  const ok = steps.length > 0 && steps.every(s => s.ok);
  // Telegram: token va webhook shu saytga ulanganmi
  const tgSteps = [];
  if (TOKEN) {
    try {
      const me = await tg("getMe");
      tgSteps.push({ name: "BOT_TOKEN to'g'ri", ok: true, detail: "@" + me.username });
      const info = await tg("getWebhookInfo");
      const want = siteUrl(req) + "/api/telegram";
      tgSteps.push({ name: "Webhook shu saytga ulangan", ok: info.url === want,
        detail: info.url === want ? want : `hozir: ${info.url || "(yo'q)"} — /api/setup-bot ni oching` });
      if (info.last_error_message) tgSteps.push({ name: "Oxirgi webhook xatosi", ok: false, detail: info.last_error_message });
    } catch (e) { tgSteps.push({ name: "BOT_TOKEN to'g'ri", ok: false, detail: e.message }); }
  } else tgSteps.push({ name: "BOT_TOKEN berilgan", ok: false, detail: "Vercel → Environment Variables" });
  const tgOk = tgSteps.every(s => s.ok) && ADMINS.length > 0;
  const tgRows = tgSteps.map(s => `<tr><td>${s.ok ? "✅" : "❌"}</td><td>${s.name}</td><td>${String(s.detail).replace(/</g, "&lt;")}</td></tr>`).join("");
  const rows = steps.map(s => `<tr><td>${s.ok ? "✅" : "❌"}</td><td>${s.name}</td><td>${String(s.detail).replace(/</g, "&lt;")}</td></tr>`).join("");
  const envRows = Object.entries(env).map(([k, v]) => `<tr><td>${v ? "✅" : "❌"}</td><td>${k}</td><td></td></tr>`).join("");
  res.status(ok ? 200 : 500).setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Health</title>
<body style="font-family:system-ui;max-width:760px;margin:24px auto;padding:0 12px"><h2>${ok ? "✅ Supabase ishlayapti" : "❌ Supabase ishlamayapti"}</h2>
<table cellpadding="6" border="1" style="border-collapse:collapse;width:100%"><tr><th></th><th>Tekshiruv</th><th>Tafsilot</th></tr>${rows}</table>
<h2>${tgOk ? "✅ Telegram bot ishlayapti" : "❌ Telegram bot sozlanmagan"}</h2>
<table cellpadding="6" border="1" style="border-collapse:collapse;width:100%"><tr><th></th><th>Tekshiruv</th><th>Tafsilot</th></tr>${tgRows}</table>
<p><a href="/api/setup-bot">Botni sozlash → /api/setup-bot</a></p>
<h3>Environment</h3><table cellpadding="6" border="1" style="border-collapse:collapse"><tr><th></th><th>Nom</th><th></th></tr>${envRows}</table></body>`);
}, "health");
