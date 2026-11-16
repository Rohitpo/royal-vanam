# Royal Vanam

Royal Vanam is a premium Indian natural products commerce platform for traceable spices, honey and pantry essentials. The project includes a customer storefront, admin dashboard and supplier portal built on Next.js, TypeScript and PostgreSQL-ready Supabase schema.

## Tech stack

- Next.js 16 + TypeScript + Tailwind
- PostgreSQL via Supabase
- Supabase Auth and RLS-ready schema
- Razorpay payment integration
- Resend email delivery
- Vercel deployment ready

## Local setup

1. Install dependencies: `npm install`
2. Copy the environment template: `cp .env.example .env.local`
3. Update values in `.env.local` with your credentials.
4. Start the app: `npm run dev`

## Routes

- Storefront: `/`
- Shop: `/shop`
- Product details: `/products/[slug]`
- Cart: `/cart`
- Checkout: `/checkout`
- Login: `/login`
- Register: `/register`
- Admin: `/admin`
- Supplier: `/supplier`

## Project structure

- `app/` – customer, admin and supplier routes
- `components/` – shared storefront and portal components
- `lib/` – product and business logic
- `supabase/migrations/` – PostgreSQL schema migration files
- `docs/` – architecture, API and deployment guides
- `tests/` – automated workflow validation

## Production notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` or Razorpay secrets in browser code.
- Handle all payment verification and permission checks on the server.
- Use Supabase Row Level Security for supplier isolation and customer data boundaries.
