# Royal Vanam Architecture

## High-level architecture

The platform uses a layered architecture with a Next.js frontend, a secure application layer, and a shared PostgreSQL database managed by Supabase.

- Frontend: Next.js app router + React + Tailwind
- Backend: Next.js server routes and middleware
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Storage: Supabase Storage
- Payments: Razorpay
- Email: Resend
- Hosting: Vercel

## Core domain model

The business model revolves around four user roles:

- Admin
- Supplier
- Retail Customer
- Wholesale Customer

All orders are created against a shared product catalog and weight-based product variants. Supplier assignments are stored with history, and each order status transition is logged with actor and timestamp.

## Data design principles

- UUID primary keys for portability and relational integrity
- Status history preserved for every change in an order lifecycle
- Inventory updates captured in immutable transaction logs
- Historical prices retained in order items to prevent drift when catalog prices change
- RLS policies to isolate supplier and customer access

## Workflow summary

1. Customer browses products and adds items to cart.
2. Checkout validates cart and address details.
3. Payment is created and verified server-side.
4. Order is created and admin is notified.
5. Order is assigned to a supplier.
6. Supplier approves or rejects the assignment.
7. Inventory and shipment events update order progression.
8. Order completion triggers email and tracking updates.

## Security model

- Backend validation for all API payloads
- Row Level Security for customers, suppliers and admin roles
- Payment verification via Razorpay signatures and server-side checks
- Request rate limiting and Webhook validation
- Audit logs for administrative actions
