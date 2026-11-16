-- FUTBOL MARKET: mahsulotning "eski narxi" (admin panelda tahrirlashda ishlatiladi)
-- Supabase -> SQL Editor -> shu faylni bir marta Run qiling (qayta ishga tushirsa ham xavfsiz).
alter table public.products
  add column if not exists old_price integer not null default 0;
