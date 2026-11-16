-- FUTBOL MARKET: UZUM CARD chegirmasi
-- Supabase -> SQL Editor -> shu faylni bir marta Run qiling (qayta ishga tushirsa ham xavfsiz).
alter table public.orders
  add column if not exists discount integer not null default 0;
