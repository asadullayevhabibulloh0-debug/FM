# Futbol Market — deploy to Vercel

## 1. Supabase (once)
Supabase → SQL Editor → paste `supabase/schema.sql` → **Run**.
Safe to re-run. If the tables already exist, running only `supabase/OLD_PRICE_MIGRATION.sql` is enough
(it adds the `old_price` column the admin panel needs when you edit a product).

## 2. Upload to Vercel
Pick one:
- **CLI:** double-click `DEPLOY.bat` (runs `npx vercel --prod`). The folder is already linked to the `futbol-market` project.
- **GitHub:** push the folder to a repo → Vercel → Add New Project → import it. Framework: **Other**, no build command.

`.env` is never uploaded (see `.vercelignore` / `.gitignore`), so set the variables in Vercel.

## 3. Environment variables
Vercel → Project → Settings → Environment Variables. You can paste the whole `.env` file into the first field and Vercel splits it.

| Name | Required | What |
|---|---|---|
| `BOT_TOKEN` | yes | from @BotFather |
| `ADMIN_CHAT_ID` | yes | your Telegram chat ID (comma-separate several) |
| `SUPABASE_URL` | yes | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | the **secret** / service_role key (not publishable/anon) |
| `ADMIN_KEY` | strongly recommended | admin panel password. Empty = anyone can open `/admin.html` |
| `PUBLIC_URL` | optional | `https://futbol-market.vercel.app` |

After changing variables → Deployments → **Redeploy**.

## 4. Connect the Telegram bot (once)
Open `https://futbol-market.vercel.app/api/setup-bot` → click **"Botni shu saytga ulash"**.
(If `ADMIN_KEY` is set: `/api/setup-bot?run=1&key=YOUR_PASSWORD`.)
This sets the webhook, the 🛒 Do'kon menu button and the bot commands. Use the production domain, not a preview URL.

## 5. Check
`https://futbol-market.vercel.app/api/health` — every row should be ✅ (Supabase + Telegram).
Then send `/start` to the bot and place a test order.
