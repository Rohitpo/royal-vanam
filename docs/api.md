# API documentation

## Health

GET /api/health

Returns a simple application health payload.

## Orders

POST /api/orders

Payload:

{
  "customerName": "Aditi Sharma",
  "email": "aditi@example.com",
  "items": [
    { "productId": "p-100", "qty": 2, "weight": "500g" }
  ]
}

Response:

{
  "success": true,
  "orderId": "RV-2146",
  "status": "Pending Payment"
}

## Payments

POST /api/payments

Payload:

{
  "amount": 1312,
  "currency": "INR",
  "orderId": "RV-2146"
}

Returns Razorpay order metadata for frontend checkout.

## Invoices

GET `/api/invoices/{orderNumber}?token={signedToken}` returns a private, time-limited PDF order invoice. Checkout creates a signed download link and sends it by SMS when Twilio is configured; otherwise the link is shown on the confirmation page.

## Planned integrations

- Supabase Auth: login and session management
- Razorpay: order creation, verification, refund processing
- Resend: transactional email delivery
- Shiprocket: optional rate and tracking integration
