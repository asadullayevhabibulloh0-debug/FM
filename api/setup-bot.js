/* =====================================================================
   /api/setup-bot — Telegram botni shu Vercel saytiga ulash (kompyuter kerak emas)

     https://SAYT/api/setup-bot            -> holatni ko'rsatadi (webhook qayerga ulangan)
     https://SAYT/api/setup-bot?run=1      -> botni shu saytga ulaydi
                                              (ADMIN_KEY bo'lsa: ?run=1&key=PAROL)

   Nima qiladi (setup-bot.js bilan bir xil):
     - webhook -> https://SAYT/api/telegram (maxfiy secret_token bilan)
     - «🛒 Do'kon» menyu tugmasi -> https://SAYT/telegram-app/
     - /start /shop /help buyruqlari va bot tavsifi
   Har deploydan keyin qayta bosish shart emas: domen o'zgarmasa webhook saqlanib qoladi.
   ===================================================================== */
const crypto = require("crypto");
const { TOKEN, ADMINS, ADMIN_KEY, tg, siteUrl, webhookSecret, esc } = require("./_lib");

function keyOk(req) {
  if (!ADMIN_KEY) return true;
  const q = new URL(req.url, "http://x").searchParams;
  const key = String(req.headers["x-admin-key"] || q.get("key") || "");
  return key.length === ADMIN_KEY.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(ADMIN_KEY));
}

async function connect(site) {
  const shop = site + "/telegram-app/";
  const done = [];
  await tg("setWebhook", {
    url: site + "/api/telegram",
    secret_token: webhookSecret(),
    allowed_updates: ["message", "callback_query"]
  });
  done.push("Webhook → " + site + "/api/telegram");

  const menu = { type: "web_app", text: "🛒 Do‘kon", web_app: { url: shop } };
  await tg("setChatMenuButton", { menu_button: menu });
  let fixed = 0;
  for (const chat of ADMINS) {
    try { await tg("setChatMenuButton", { chat_id: chat, menu_button: menu }); fixed++; } catch (e) { }
  }
  done.push("«🛒 Do‘kon» tugmasi → " + shop + (fixed ? ` (+${fixed} admin chat)` : ""));

  await tg("setMyCommands", {
    commands: [
      { command: "start", description: "Boshlash" },
      { command: "shop", description: "Do‘konni ochish" },
      { command: "help", description: "Yordam" }
    ]
  });
  await tg("setMyDescription", {
    description:
      "⚽ Futbol Market — original formalar, butsalar, to‘plar va kuboklar.\n\n" +
      "«🛒 Do‘kon» tugmasini bosing: mahsulotni tanlang, savatga qo‘shing va buyurtma bering. " +
      "Forma orqasiga ism va raqam yozib beramiz.\n\nSayt: " + site
  }).catch(() => { });
  await tg("setMyShortDescription", {
    short_description: "⚽ Formalar, butsalar, to‘plar, kuboklar. Sayt: " + site.replace(/^https:\/\//, "")
  }).catch(() => { });
  done.push("Buyruqlar va tavsif yozildi");
  return done;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const site = siteUrl(req);
  const q = new URL(req.url, "http://x").searchParams;
  const out = [];
  let ok = true;

  const page = (body, code) => res.status(code || (ok ? 200 : 500)).end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Telegram bot sozlash</title><body style="font-family:system-ui;max-width:760px;margin:24px auto;padding:0 12px;line-height:1.5">${body}</body>`);

  if (!TOKEN) {
    ok = false;
    return page(`<h2>❌ BOT_TOKEN yo‘q</h2><p>Vercel → Project → Settings → Environment Variables ga <code>BOT_TOKEN</code> qo‘shing, so‘ng <b>Redeploy</b> qiling.</p>`);
  }

  let me;
  try { me = await tg("getMe"); }
  catch (e) {
    ok = false;
    return page(`<h2>❌ BOT_TOKEN noto‘g‘ri</h2><p>${esc(e.message)}</p><p>@BotFather dan tokenni qayta oling va Vercel'da yangilang.</p>`);
  }

  if (q.get("run")) {
    if (!keyOk(req)) {
      ok = false;
      return page(`<h2>🔒 Parol kerak</h2><p>Manzil oxiriga <code>&amp;key=ADMIN_KEY</code> qo‘shing.</p>`, 401);
    }
    try {
      const done = await connect(site);
      out.push(`<h2>✅ @${esc(me.username)} shu saytga ulandi</h2><ul>${done.map(d => `<li>${esc(d)}</li>`).join("")}</ul>`);
    } catch (e) {
      ok = false;
      out.push(`<h2>❌ Ulab bo‘lmadi</h2><p>${esc(e.message)}</p>`);
    }
  }

  const info = await tg("getWebhookInfo").catch(e => ({ error: e.message }));
  const want = site + "/api/telegram";
  const linked = info.url === want;
  if (!q.get("run")) ok = linked;
  const lastErr = info.last_error_message
    ? `${esc(info.last_error_message)} (${new Date(info.last_error_date * 1000).toISOString().replace("T", " ").slice(0, 16)} UTC)` : "—";
  const runLink = "?run=1" + (ADMIN_KEY ? "&key=" : "");

  const publicUrl = String(process.env.PUBLIC_URL || "").trim().replace(/\/+$/, "");
  const wrongHost = publicUrl && publicUrl !== site;

  out.push(`
<h2>${linked ? "✅" : "⚠️"} Telegram bot: @${esc(me.username)}</h2>
<table cellpadding="6" border="1" style="border-collapse:collapse;width:100%">
<tr><td>Webhook hozir</td><td><code>${esc(info.url || "(yo‘q)")}</code></td></tr>
<tr><td>Bo‘lishi kerak</td><td><code>${esc(want)}</code></td></tr>
<tr><td>Kutilayotgan xabarlar</td><td>${Number(info.pending_update_count || 0)}</td></tr>
<tr><td>Oxirgi xato</td><td>${lastErr}</td></tr>
<tr><td>ADMIN_CHAT_ID</td><td>${ADMINS.length ? "✅ " + ADMINS.length + " ta" : "❌ yo‘q — botga /start yuboring, u ID ni aytadi"}</td></tr>
</table>
${wrongHost ? `<p style="color:#b45309">⚠️ Siz <code>${esc(site)}</code> ni ochdingiz, PUBLIC_URL esa <code>${esc(publicUrl)}</code>. Botni asosiy (production) domenga ulang — preview manzillar Vercel himoyasi tufayli Telegramga yopiq bo‘ladi.</p>` : ""}
<p>${linked ? "Bot shu saytga ulangan. Qayta ulash shart emas." : "Bot hali shu saytga ulanmagan."}
<br><a href="${runLink}" style="display:inline-block;margin-top:8px;padding:10px 16px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none">${linked ? "Qayta ulash" : "Botni shu saytga ulash"}</a>
${ADMIN_KEY ? "<br><small>ADMIN_KEY o‘rnatilgan: havola oxiriga parolni yozing.</small>" : ""}</p>
<p><small>Supabase holati: <a href="/api/health">/api/health</a></small></p>`);
  page(out.join("\n"));
};
