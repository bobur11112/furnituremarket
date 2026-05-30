# Möbel Furniture Marketplace

Full-stack luxury furniture marketplace built with Vite 5, React 18, strict TypeScript, Tailwind CSS, shadcn-style Radix UI primitives, TanStack Query, React Hook Form, Zod, Supabase, Vitest, and Playwright.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local`:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Without Supabase credentials, the app runs against a local demo catalog and demo auth flow. Use `seller@mobel.test` with password `password` to enter the seller dashboard.

## Supabase

Apply the migration in `supabase/migrations/20260530170000_create_mobel_marketplace.sql`. It creates marketplace tables, seeded categories, row level security policies, a public `product-images` storage bucket, and realtime support for order status updates.

## Scripts

```bash
npm run dev
npm run build
npm test
npm run test:e2e
```
# furnituremarket
