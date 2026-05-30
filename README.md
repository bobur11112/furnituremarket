# Möbel Furniture Marketplace

Full-stack luxury furniture marketplace built with Vite 5, React 18, strict TypeScript, Tailwind CSS, shadcn-style Radix UI primitives, TanStack Query, React Hook Form, Zod, Supabase, Vitest, and Playwright.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Create `.env.local` and set these values from your active Supabase project:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabase is required. The application does not use a local catalog, local orders, or frontend admin passwords.

## Supabase

1. Apply `supabase/migrations/20260530170000_create_mobel_marketplace.sql` in the Supabase SQL editor.
2. Create the administrator in Supabase Authentication with email and password.
3. Sign in to the application with that email and password. No extra role query is required.

The migration creates marketplace tables, seeded categories, Row Level Security policies, the public `product-images` Storage bucket, image limits, guest checkout RPC, and realtime support for order status updates.

Customers do not need an account. Checkout creates a guest order through `place_public_order`. Every user that you manually add in Supabase Authentication can manage products, images, and orders after signing in.

## Scripts

```bash
npm run dev
npm run build
npm test
npm run test:e2e
```
# furnituremarket
