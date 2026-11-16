# Deployment guide

## Recommended stack

- Frontend and hosting: Vercel
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Storage: Supabase Storage
- Email: Resend
- Payments: Razorpay

## Steps

1. Create a Supabase project, enable email/password authentication, and enable email confirmations under Authentication > Providers > Email. Configure the confirmation email template and SMTP provider in Supabase for reliable delivery.
2. In the Supabase SQL Editor, run `001_initial_schema.sql` first.
3. Then run `002_auth_customer_profile.sql`, `003_atomic_checkout.sql`, `004_rls_access_controls.sql`, `005_razorpay_confirmation.sql`, and `006_supplier_workflow.sql`.
4. Run `supabase/seed.sql` to insert or update the starter categories and products. This seed is safe to rerun.
5. Run `007_product_variants_seed.sql` after the seed so product weight variants are created, then run `008_invoice_delivery.sql` and `009_backfill_auth_profiles.sql`. Migration 009 backfills profiles and customer records for users who signed up before the auth trigger was installed. The checkout RPC in migration 003 stores every submitted delivery field in `addresses` and links that row from the order's shipping and billing address IDs.
5. If existing Auth users were created before migration 002 was installed, run `009_backfill_auth_profiles.sql` to create their missing profiles and customer records. New signups are handled by the Auth trigger.
6. Configure exactly one Supabase project in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` from the same project. The app also accepts legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Never expose a server key or add a `NEXT_PUBLIC_` prefix to it. Restart the dev server after changing env values.
7. In Authentication > URL Configuration, add the local app origin (for example `http://localhost:3000/account`) and your production account URL to the allowed redirect URLs. Registration sends Supabase's built-in signup confirmation email; users can request another link from the registration or login screen.
8. Configure Razorpay test credentials and add `/api/payments/webhook` as a webhook URL with `payment.captured` enabled.
9. Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and an SMS-enabled E.164 `TWILIO_FROM_NUMBER` to send invoice PDF links to checkout phone numbers. Without Twilio, customers can still download the generated PDF from the order confirmation page.
10. Configure Resend domain and sender identities for transactional email when enabled.
11. Deploy the repository to Vercel and add the same environment variables in project settings.
12. Configure custom domain and DNS records.

## DNS recommendation

- apex record: A/ALIAS to Vercel
- www: CNAME to Vercel
- MX records for email delivery
- TXT records for domain verification

## Production checklist

- Verify RLS policies
- Confirm webhook signing
- Validate admin, supplier and customer roles
- Run the test suite
- Back up the database nightly
- Create the first admin user and set its `profiles.role` to `admin` using a trusted database session.
- Create supplier auth users, supplier records, and supplier product assignments before testing supplier workflows.
- Verify COD and Razorpay test orders in the database before enabling live credentials.
