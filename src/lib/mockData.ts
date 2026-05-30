import type { Category, Product } from "@/types/product";
import type { Order } from "@/types/order";
import type { Profile } from "@/types/user";

export const demoSeller: Profile = {
  id: "11111111-1111-4111-8111-111111111111",
  full_name: "Maison Arca Studio",
  avatar_url: null,
  role: "seller",
  created_at: "2026-02-02T10:00:00.000Z",
};

export const categories: Category[] = [
  {
    id: "22222222-2222-4222-8222-222222222201",
    name: "Seating",
    slug: "seating",
    image_url:
      "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    name: "Tables",
    slug: "tables",
    image_url:
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "22222222-2222-4222-8222-222222222203",
    name: "Storage",
    slug: "storage",
    image_url:
      "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "22222222-2222-4222-8222-222222222204",
    name: "Lighting",
    slug: "lighting",
    image_url:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
  },
];

const sellerSummary = {
  id: demoSeller.id,
  full_name: demoSeller.full_name,
  avatar_url: demoSeller.avatar_url,
  role: demoSeller.role,
};

export const products: Product[] = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    seller_id: demoSeller.id,
    category_id: categories[0].id,
    title: "Aster Boucle Lounge Chair",
    description:
      "A sculptural lounge chair wrapped in soft ivory boucle with a walnut plinth, proportioned for reading corners and hotel-suite calm.",
    price: 1480,
    stock_count: 8,
    images: [
      "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
    ],
    dimensions: { width: 84, height: 76, depth: 91, unit: "cm" },
    material: "Boucle",
    color: "Ivory",
    style: "modern",
    is_published: true,
    created_at: "2026-05-12T08:00:00.000Z",
    category: categories[0],
    seller: sellerSummary,
    badge: "New",
    popularity: 96,
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    seller_id: demoSeller.id,
    category_id: categories[1].id,
    title: "Marceau Travertine Dining Table",
    description:
      "A generous dining table with honed travertine top and brushed brass feet, designed for tactile dinners and gallery-like rooms.",
    price: 3890,
    stock_count: 4,
    images: [
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85",
    ],
    dimensions: { width: 220, height: 75, depth: 96, unit: "cm" },
    material: "Travertine",
    color: "Sand",
    style: "classic",
    is_published: true,
    created_at: "2026-04-29T08:00:00.000Z",
    category: categories[1],
    seller: sellerSummary,
    badge: "Sale",
    popularity: 88,
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    seller_id: demoSeller.id,
    category_id: categories[2].id,
    title: "Norr Oak Sideboard",
    description:
      "Low-profile sideboard in smoked oak with reeded doors, soft-close storage, and a quiet Scandinavian silhouette.",
    price: 2250,
    stock_count: 5,
    images: [
      "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1595514535215-95d8e7a850bb?auto=format&fit=crop&w=1200&q=85",
    ],
    dimensions: { width: 180, height: 72, depth: 45, unit: "cm" },
    material: "Oak",
    color: "Smoked oak",
    style: "scandinavian",
    is_published: true,
    created_at: "2026-05-01T08:00:00.000Z",
    category: categories[2],
    seller: sellerSummary,
    popularity: 80,
  },
  {
    id: "33333333-3333-4333-8333-333333333304",
    seller_id: demoSeller.id,
    category_id: categories[3].id,
    title: "Vesper Alabaster Floor Lamp",
    description:
      "A warm alabaster column lamp with dimmable brass detailing that throws a soft ambient wash across stone, wood, and velvet.",
    price: 1190,
    stock_count: 11,
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=85",
    ],
    dimensions: { width: 34, height: 152, depth: 34, unit: "cm" },
    material: "Alabaster",
    color: "Warm white",
    style: "minimalist",
    is_published: true,
    created_at: "2026-05-18T08:00:00.000Z",
    category: categories[3],
    seller: sellerSummary,
    badge: "New",
    popularity: 74,
  },
  {
    id: "33333333-3333-4333-8333-333333333305",
    seller_id: demoSeller.id,
    category_id: categories[0].id,
    title: "Rive Leather Modular Sofa",
    description:
      "Italian aniline leather sofa modules with deep seats, feather blend cushions, and a low architectural profile.",
    price: 6420,
    stock_count: 2,
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85",
    ],
    dimensions: { width: 310, height: 70, depth: 105, unit: "cm" },
    material: "Leather",
    color: "Cognac",
    style: "industrial",
    is_published: true,
    created_at: "2026-03-22T08:00:00.000Z",
    category: categories[0],
    seller: sellerSummary,
    popularity: 93,
  },
  {
    id: "33333333-3333-4333-8333-333333333306",
    seller_id: demoSeller.id,
    category_id: categories[1].id,
    title: "Linea Nero Coffee Table",
    description:
      "A black marble coffee table with softened radius corners, discreet steel base, and just enough sheen for evening rooms.",
    price: 1640,
    stock_count: 0,
    images: [
      "https://images.unsplash.com/photo-1532372320572-cda25653a694?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1200&q=85",
    ],
    dimensions: { width: 120, height: 34, depth: 72, unit: "cm" },
    material: "Marble",
    color: "Black",
    style: "modern",
    is_published: true,
    created_at: "2026-02-14T08:00:00.000Z",
    category: categories[1],
    seller: sellerSummary,
    badge: "Sold Out",
    popularity: 65,
  },
];

export const demoOrders: Order[] = [
  {
    id: "44444444-4444-4444-8444-444444444401",
    buyer_id: "demo-buyer",
    status: "confirmed",
    total_price: 2670,
    shipping_address: {
      fullName: "Demo Buyer",
      email: "buyer@mobel.test",
      phone: "+998901112233",
      address: "21 Gallery Avenue",
      city: "Tashkent",
    },
    created_at: "2026-05-19T09:30:00.000Z",
    order_items: [
      {
        id: "55555555-5555-4555-8555-555555555501",
        order_id: "44444444-4444-4444-8444-444444444401",
        product_id: products[0].id,
        quantity: 1,
        price_at_purchase: products[0].price,
        product: products[0],
      },
      {
        id: "55555555-5555-4555-8555-555555555502",
        order_id: "44444444-4444-4444-8444-444444444401",
        product_id: products[3].id,
        quantity: 1,
        price_at_purchase: products[3].price,
        product: products[3],
      },
    ],
  },
];
