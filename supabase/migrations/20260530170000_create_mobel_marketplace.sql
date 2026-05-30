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
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id),
  status text default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  total_price numeric(10,2),
  shipping_address jsonb,
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null check (quantity > 0),
  price_at_purchase numeric(10,2)
);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_seller_id_idx on public.products(seller_id);
create index if not exists products_published_idx on public.products(is_published, created_at desc);
create index if not exists orders_buyer_id_idx on public.orders(buyer_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
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

create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can manage profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Published products are publicly readable"
  on public.products for select
  using (is_published = true or seller_id = auth.uid() or public.is_admin());

create policy "Sellers can create own products"
  on public.products for insert
  with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

create policy "Sellers can update own products"
  on public.products for update
  using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());

create policy "Sellers can delete own products"
  on public.products for delete
  using (seller_id = auth.uid() or public.is_admin());

create policy "Buyers can read own orders"
  on public.orders for select
  using (
    buyer_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = orders.id and p.seller_id = auth.uid()
    )
  );

create policy "Buyers can create own orders"
  on public.orders for insert
  with check (buyer_id = auth.uid());

create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Sellers can update orders containing own products"
  on public.orders for update
  using (
    exists (
      select 1
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = orders.id and p.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = orders.id and p.seller_id = auth.uid()
    )
  );

create policy "Buyers can read own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.buyer_id = auth.uid()
    )
    or public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = order_items.product_id and p.seller_id = auth.uid()
    )
  );

create policy "Buyers can create order items for own orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.buyer_id = auth.uid()
    )
  );

create policy "Admins can manage order items"
  on public.order_items for all
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

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

create policy "Product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Sellers can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

create policy "Sellers can update own product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and owner = auth.uid())
  with check (bucket_id = 'product-images' and owner = auth.uid());

create policy "Sellers can delete own product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and owner = auth.uid());

alter publication supabase_realtime add table public.orders;
