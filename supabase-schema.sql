create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  quantity text not null default '',
  category text not null,
  image text not null default '',
  description text not null default '',
  sort_order integer not null default 0
);

alter table public.products enable row level security;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Products are readable by everyone" on public.products;
create policy "Products are readable by everyone"
  on public.products for select
  using (true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
  on public.products for insert to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into public.products (
  id, name, price, quantity, category, image, description, sort_order
) values
  ('p1', 'Spin Master Mini Red & Green', 65, '1 Box - 10 pcs', 'Ground Chakkars', '', '1 Box - 10 pcs', 1),
  ('p2', 'Spin Master Max Red & Green', 124, '1 Box - 10 pcs', 'Ground Chakkars', '', '1 Box - 10 pcs', 2),
  ('p3', '4" Elephant Lakshmi Dlx', 180, '1 Pkt - 5 Pieces', 'Crackers', '', '1 Pkt - 5 Pieces', 3),
  ('p4', 'Color Fountain', 95, '1 Box - 5 pcs', 'Fountains', '', '1 Box', 4),
  ('p5', 'Rocket Special', 150, '1 Box - 10 pcs', 'Rockets', '', '1 Box', 5),
  ('p6', 'Electric Sparklers', 75, '1 Pkt - 10 pcs', 'Sparklers', '', '10 pcs', 6),
  ('p7', 'Diwali Gift Box', 499, '1 Box', 'Gift Boxes', '', 'Family celebration pack', 7),
  ('p8', 'Special Combo Pack', 999, '1 Combo Pack', 'Special Combo Packs', '', 'Festival combo', 8)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end
$$;
