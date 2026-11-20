/* =====================================================================
   POST /api/telegram — bot webhook (Telegram o'zi shu manzilga yuboradi).
   Kompyuter yoqilishi shart emas: Vercel har bir xabarda funksiyani ishga tushiradi.
   ===================================================================== */
const {
  TOKEN, ADMINS, STATUS, STATUS_ICON, STATUS_NOTE, store, getProducts,
  esc, money, tg, siteUrl, webhookSecret, readJson
} = require("./_lib");

const isAdmin = id => ADMINS.includes(String(id));

const CATS = {
  forma: { title: "FORMA", icon: "👕" },
  butsa: { title: "BUTSA", icon: "👟" },
  kubok: { title: "KUBOK", icon: "🏆" },
  top: { title: "TO‘P", icon: "⚽" },
  boshqa: { title: "BOSHQA", icon: "🛍" }
};
const norm = s => String(s || "").toLowerCase().replace(/[^a-z]/g, "");
const CAT_RE = /menga\s+(forma|butsa|kubok|to.?p|boshqa)/i;

function who(u) {
  u = u || {};
  return u.username ? "@" + u.username : [u.first_name, u.last_name].filter(Boolean).join(" ") || "Mijoz";
}

function links(base) {
  return {
    shop: `${base}/telegram-app/`,
    site: `${base}/`
  };
}

function customerMenu(base) {
  return {
    keyboard: [
      [{ text: "🛒 Do‘konni ochish", web_app: { url: links(base).shop } }],
      [{ text: "Menga FORMA kerak edi" }, { text: "Menga BUTSA kerak edi" }],
      [{ text: "Menga KUBOK kerak edi" }, { text: "Menga TO‘P kerak edi" }],
      [{ text: "Menga BOSHQA narsa kerak edi" }]
    ],
    resize_keyboard: true
  };
}

function shopButtons(base) {
  const l = links(base);
  return {
    inline_keyboard: [
      [{ text: "🛒 Do‘konni ochish", web_app: { url: l.shop } }],
      [{ text: "🌐 Saytga o‘tish", url: l.site }]
    ]
  };
}

const send = (chat_id, text, reply_markup) =>
  tg("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...(reply_markup ? { reply_markup } : {}) });

async function tellAdmins(html) {
  for (const chat of ADMINS) await send(chat, html).catch(e => console.error("admin:", e.message));
}

const ADMIN_HELP = [
  "⚽ <b>Futbol Market — admin</b>",
  "",
  "/orders — oxirgi 10 ta buyurtma",
  "/new — hali yetkazilmagan buyurtmalar",
  "/stats — umumiy hisobot",
  "",
  "• Saytdan va Telegram do‘kondan tushgan buyurtmalar shu yerga keladi.",
  "• Buyurtma tagidagi tugmalar bilan holatni o‘zgartiring — mijozga xabar boradi.",
  "• Mijoz xabarlari ham shu yerga keladi. Unga javob berish uchun xabarga <b>reply</b> qiling."
].join("\n");

// pastdagi doimiy tugmalar (admin uchun)
const ADMIN_MENU = {
  keyboard: [[{ text: "📋 Buyurtmalar" }, { text: "🆕 Yangi" }], [{ text: "📊 Hisobot" }]],
  resize_keyboard: true
};

/* Bitta savat = bitta buyurtma (orderId bo'yicha guruh) */
function groupOrders(orders) {
  const map = new Map();
  for (const o of orders) {
    const k = o.orderId || "id:" + o.id;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(o);
  }
  return [...map.values()].sort((a, b) => Number(b[0].id) - Number(a[0].id));
}

function groupLine(g) {
  const f = g[0], st = f.status || "Yangi";
  const total = g.reduce((n, o) => n + Number(o.total || 0), 0);
  const items = g.map(o => `${esc(o.product)} × ${o.quantity}`).join(", ");
  return `${STATUS_ICON[st] || "📌"} <code>#${esc(f.orderId || String(f.id).slice(-6))}</code> ${items} — <b>${money(total)}</b>\n      ${esc(f.userName)}${f.phone ? ", " + esc(f.phone) : ""}`;
}

async function adminCommand(chat, cmd) {
  if (!store.enabled) return send(chat, "Baza ulanmagan (SUPABASE_URL). Buyurtmalar faqat shu chatga keladi.", ADMIN_MENU);
  const groups = groupOrders(await store.orders());
  if (cmd === "/orders") {
    const last = groups.slice(0, 10);
    return send(chat, last.length ? "<b>Oxirgi buyurtmalar</b>\n\n" + last.map(groupLine).join("\n") : "Hozircha buyurtma yo‘q.", ADMIN_MENU);
  }
  if (cmd === "/new") {
    const open = groups.filter(g => ["Yangi", "Tayyorlanmoqda", "Yetkazilmoqda"].includes(g[0].status || "Yangi")).slice(0, 15);
    return send(chat, open.length ? "<b>Yetkazilishi kerak</b>\n\n" + open.map(groupLine).join("\n") : "Hammasi yetkazilgan ✅", ADMIN_MENU);
  }
  // /stats
  const count = {};
  let revenue = 0;
  for (const g of groups) {
    const st = g[0].status || "Yangi";
    count[st] = (count[st] || 0) + 1;
    if (st !== "Bekor") revenue += g.reduce((n, o) => n + Number(o.total || 0), 0);
  }
  const rows = Object.entries(count).map(([k, v]) => `${STATUS_ICON[k] || "📌"} ${esc(k)}: <b>${v}</b>`).join("\n");
  return send(chat, `<b>Hisobot</b>\n\nJami buyurtmalar: <b>${groups.length}</b>\n${rows}\n\n💰 Tushum (bekorlarsiz): <b>${money(revenue)}</b>`, ADMIN_MENU);
}

async function onMessage(msg, base) {
  if (msg.chat.type !== "private") return;
  const chat = msg.chat.id;
  // yangi mahsulot xabarlari uchun foydalanuvchini eslab qolamiz
  if (store.enabled) await store.saveBotUser({ ...(msg.from || {}), id: chat }).catch(e => console.error("bot_users:", e.message));
  const text = String(msg.text || "").trim();
  const cmd = text.split(/[\s@]/)[0].toLowerCase();

  if (!ADMINS.length) {
    return send(chat, `Salom! 👋\nSizning chat ID: <code>${chat}</code>\n\nVercel → Settings → Environment Variables da <code>ADMIN_CHAT_ID=${chat}</code> qiling va qayta deploy qiling.`);
  }

  // Admin mijoz xabariga reply qildi -> javobni mijozga yuboramiz
  if (isAdmin(chat) && msg.reply_to_message) {
    const m = String(msg.reply_to_message.text || "").match(/ID:\s*(\d+)/);
    if (m) {
      try {
        if (text) await send(m[1], `👨‍💼 <b>Admin:</b> ${esc(text)}`);
        else await tg("copyMessage", { chat_id: m[1], from_chat_id: chat, message_id: msg.message_id });
        return send(chat, "Mijozga yuborildi ✅");
      } catch (e) {
        return send(chat, "Yuborib bo‘lmadi: " + esc(e.message));
      }
    }
  }

  if (cmd === "/start" || cmd === "/shop") {
    // «🛒 Do'kon» menyu tugmasi shu chatga ham alohida qo'yiladi
    await tg("setChatMenuButton", { chat_id: chat, menu_button: { type: "web_app", text: "🛒 Do‘kon", web_app: { url: links(base).shop } } }).catch(() => { });
    // admin o'z tugmalarini ko'radi (mijoz menyusi ularni almashtirib yubormasin)
    if (isAdmin(chat)) {
      await send(chat, ADMIN_HELP, ADMIN_MENU);
      return send(chat, "Do‘kon va sayt:", shopButtons(base));
    }
    await send(chat,
      `ASSALOMU ALAYKUM, ${esc(who(msg.from))}! 👋\n\n<b>Futbol Market</b> — original formalar, butsalar, to‘plar va kuboklar.\n\nPastdagi <b>«🛒 Do‘konni ochish»</b> tugmasini bosing yoki nima kerakligini tanlang.`,
      customerMenu(base));
    return send(chat, "Do‘kon va sayt:", shopButtons(base));
  }

  if (cmd === "/help") {
    return isAdmin(chat) ? send(chat, ADMIN_HELP, ADMIN_MENU) : send(chat, "Do‘konni ochish: /shop\nSavolingizni shu yerga yozing — admin javob beradi.", customerMenu(base));
  }

  if (isAdmin(chat)) {
    const low = text.toLowerCase();
    let c = cmd;
    if (!c.startsWith("/")) c = /buyurtma|orders/.test(low) ? "/orders" : /yangi|\bnew\b/.test(low) ? "/new" : /hisobot|stats|statistika/.test(low) ? "/stats" : "";
    if (["/orders", "/new", "/stats"].includes(c)) return adminCommand(chat, c);
  }

  const cm = text.match(CAT_RE);
  if (cm) {
    const key = norm(cm[1]);
    const c = CATS[key];
    if (!isAdmin(chat)) {
      await tellAdmins(`🛍 <b>Mijoz so‘rovi</b>\n👤 ${esc(who(msg.from))}\nID: <code>${chat}</code>\n\nMijoz: <b>Menga ${esc(c.title)} kerak edi</b>\n\n↩️ Javob berish uchun shu xabarga <b>reply</b> qiling.`);
    }
    if (key === "boshqa") return send(chat, "Yaxshi! 🙂 Nima kerakligini yozib yuboring ✍️\nAdmin tez orada javob beradi.");
    const list = (await getProducts()).filter(p => norm(p.cat) === key);
    const body = list.length
      ? `${c.icon} <b>${esc(c.title)}</b> bo‘yicha mahsulotlarimiz:\n\n` +
        list.map((p, i) => `${i + 1}. <b>${esc(p.name)}</b> — ${money(p.price)}`).join("\n") +
        "\n\nBuyurtma berish uchun do‘konni oching. Savol bo‘lsa shu yerga yozing."
      : `${c.icon} Hozircha bu bo‘limda mahsulot yo‘q. Admin siz bilan bog‘lanadi.`;
    return send(chat, body, shopButtons(base));
  }

  if (isAdmin(chat)) return send(chat, ADMIN_HELP, ADMIN_MENU);

  // Oddiy mijoz xabari -> adminga
  if (text && !text.startsWith("/")) {
    await tellAdmins(`💬 <b>Mijoz xabari</b>\n👤 ${esc(who(msg.from))}\nID: <code>${chat}</code>\n\n${esc(text)}\n\n↩️ Javob berish uchun shu xabarga <b>reply</b> qiling.`);
    return send(chat, "Xabaringiz adminga yuborildi ✅ Tez orada javob beramiz.");
  }
  if (!text) {
    for (const a of ADMINS) {
      await tg("forwardMessage", { chat_id: a, from_chat_id: chat, message_id: msg.message_id }).catch(() => { });
    }
    await tellAdmins(`📎 Yuqoridagi fayl: ${esc(who(msg.from))}\nID: <code>${chat}</code>\n↩️ Javob uchun shu xabarga <b>reply</b> qiling.`);
    return send(chat, "Adminga yuborildi ✅");
  }
  return send(chat, "Do‘konni ochish uchun pastdagi tugmani bosing 👇", customerMenu(base));
}

/* Holat tugmasi: holat xabarning oxirgi qatorida saqlanadi, baza kerak emas */
async function onCallback(cb) {
  const answer = text => tg("answerCallbackQuery", { callback_query_id: cb.id, text }).catch(() => { });
  if (!isAdmin(cb.from.id) && !isAdmin(cb.message && cb.message.chat.id)) return answer("Ruxsat yo‘q");

  const [kind, code, customer] = String(cb.data || "").split(":");
  const status = STATUS[code];
  const m = cb.message;
  if (kind !== "s" || !status || !m || !m.text) return answer("Eskirgan tugma");

  const text = m.text;
  const cut = text.lastIndexOf("\n") + 1;
  const prefix = `${STATUS_ICON[status]} Holat: `;
  const entities = (m.entities || []).filter(e => e.offset + e.length <= cut);
  entities.push({ type: "bold", offset: cut + prefix.length, length: status.length });

  try {
    await tg("editMessageText", {
      chat_id: m.chat.id, message_id: m.message_id,
      text: text.slice(0, cut) + prefix + status, entities,
      link_preview_options: { is_disabled: true }, reply_markup: m.reply_markup
    });
  } catch (e) {
    if (/not modified/i.test(e.message)) return answer("Holat allaqachon: " + status);
    throw e;
  }
  await answer("Holat: " + status);

  const id = (text.match(/#(FM-[A-Z0-9]+)/) || [])[1] || "";
  // admin paneldagi holat ham yangilanadi
  if (id && store.enabled) await store.setStatusByOrderId(id, status).catch(e => console.error(e.message));
  if (customer && customer !== "0") {
    await send(customer, `<code>#${esc(id)}</code> — ${STATUS_NOTE[status]}`).catch(() => { });
  }
}

module.exports = require("./_lib").safe(async (req, res) => {
  if (req.method !== "POST") return res.status(200).send("Futbol Market bot webhook ishlayapti ✅");
  if (!TOKEN || req.headers["x-telegram-bot-api-secret-token"] !== webhookSecret()) {
    return res.status(401).send("unauthorized");
  }
  try {
    const u = await readJson(req);
    const base = siteUrl(req);
    if (u.message) await onMessage(u.message, base);
    else if (u.callback_query) await onCallback(u.callback_query);
  } catch (e) {
    console.error("[bot]", e.message);
  }
  // Har doim 200: aks holda Telegram shu xabarni qayta-qayta yuboradi
  res.status(200).json({ ok: true });
}, "telegram");
