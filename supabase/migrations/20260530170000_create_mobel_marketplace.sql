create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  image_url text
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  title text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  stock_count integer default 0 check (stock_count >= 0),
  images text[] default '{}',
  dimensions jsonb,
  material text,
  color text,
  style text check (style in ('modern', 'classic', 'scandinavian', 'industrial', 'minimalist')),
  is_published boolean default false,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.products add column if not exists deleted_at timestamptz;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id),
  status text default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  total_price numeric(10,2),
  shipping_address jsonb,
  created_at timestamptz default now()
);

alter table public.orders alter column buyer_id drop not null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_title text,
  quantity integer not null check (quantity > 0),
  price_at_purchase numeric(10,2)
);

alter table public.order_items add column if not exists product_title text;

do $$
begin
  alter table public.order_items drop constraint if exists order_items_product_id_fkey;
  alter table public.order_items
    add constraint order_items_product_id_fkey
    foreign key (product_id) references public.products(id) on delete set null;
end $$;

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_seller_id_idx on public.products(seller_id);
create index if not exists products_published_idx on public.products(is_published, created_at desc);
create index if not exists orders_buyer_id_idx on public.orders(buyer_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

create or replace function public.place_public_order(shipping jsonb, items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  order_total numeric(10,2);
  requested_count integer;
  available_count integer;
begin
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Order must contain at least one product';
  end if;

  if coalesce(shipping->>'fullName', '') = ''
    or coalesce(shipping->>'email', '') = ''
    or coalesce(shipping->>'phone', '') = ''
    or coalesce(shipping->>'address', '') = ''
    or coalesce(shipping->>'city', '') = '' then
    raise exception 'Shipping details are incomplete';
  end if;

  create temporary table requested_order_items (
    product_id uuid primary key,
    quantity integer not null
  ) on commit drop;

  insert into requested_order_items (product_id, quantity)
  select item.product_id, sum(item.quantity)::integer
  from jsonb_to_recordset(items) as item(product_id uuid, quantity integer)
  group by item.product_id;

  if exists (select 1 from requested_order_items where quantity <= 0 or product_id is null) then
    raise exception 'Every order item must contain a product and a positive quantity';
  end if;

  perform 1
  from public.products p
  join requested_order_items item on item.product_id = p.id
  for update of p;

  select count(*) into requested_count from requested_order_items;

  select count(*), coalesce(sum(p.price * item.quantity), 0) + 90
  into available_count, order_total
  from requested_order_items item
  join public.products p on p.id = item.product_id
  where p.is_published = true
    and p.deleted_at is null
    and p.stock_count >= item.quantity;

  if available_count <> requested_count then
    raise exception 'One or more products are unavailable';
  end if;

  insert into public.orders (buyer_id, total_price, shipping_address)
  values (null, order_total, shipping)
  returning id into new_order_id;

  insert into public.order_items (order_id, product_id, product_title, quantity, price_at_purchase)
  select new_order_id, p.id, p.title, item.quantity, p.price
  from requested_order_items item
  join public.products p on p.id = item.product_id;

  update public.products p
  set stock_count = p.stock_count - item.quantity
  from requested_order_items item
  where p.id = item.product_id;

  return new_order_id;
end;
$$;

revoke all on function public.place_public_order(jsonb, jsonb) from public;
grant execute on function public.place_public_order(jsonb, jsonb) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.categories, public.products to anon, authenticated;
grant all privileges on table public.profiles, public.categories, public.products, public.orders, public.order_items to authenticated;
revoke all privileges on table public.profiles, public.orders, public.order_items from anon;
notify pgrst, 'reload schema';

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select auth.uid() is not null;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, avatar_url, role)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', email),
  raw_user_meta_data->>'avatar_url',
  'admin'
from auth.users
on conflict (id) do update set
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  role = 'admin';

drop policy if exists "Profiles are readable by everyone" on public.profiles;
drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Categories are publicly readable" on public.categories;
create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Published products are publicly readable" on public.products;
create policy "Published products are publicly readable"
  on public.products for select
  using ((is_published = true and deleted_at is null) or public.is_admin());

drop policy if exists "Sellers can create own products" on public.products;
drop policy if exists "Admins can create products" on public.products;
create policy "Admins can create products"
  on public.products for insert
  to authenticated
  with check (
    seller_id = auth.uid()
    and public.is_admin()
  );

drop policy if exists "Sellers can update own products" on public.products;
drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Sellers can delete own products" on public.products;
drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Buyers can read own orders" on public.orders;
drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Buyers can create own orders" on public.orders;

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Sellers can update orders containing own products" on public.orders;
drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Buyers can read own order items" on public.order_items;
drop policy if exists "Admins can read order items" on public.order_items;
create policy "Admins can read order items"
  on public.order_items for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Buyers can create order items for own orders" on public.order_items;

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items"
  on public.order_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.categories (name, slug, image_url) values
  ('Seating', 'seating', 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=900&q=80'),
  ('Tables', 'tables', 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=900&q=80'),
  ('Storage', 'storage', 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=900&q=80'),
  ('Lighting', 'lighting', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80')
on conflict (slug) do update set
  name = excluded.name,
  image_url = excluded.image_url;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product images are publicly readable" on storage.objects;
create policy "Product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Sellers can upload product images" on storage.objects;
drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_admin()
  );

drop policy if exists "Sellers can update own product images" on storage.objects;
drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and owner_id = auth.uid()::text and public.is_admin())
  with check (bucket_id = 'product-images' and owner_id = auth.uid()::text and public.is_admin());

drop policy if exists "Sellers can delete own product images" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and owner_id = auth.uid()::text and public.is_admin());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
