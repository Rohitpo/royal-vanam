/* eslint-disable @typescript-eslint/no-require-imports -- Node's built-in test runner executes this file as CommonJS. */
const test = require('node:test');
const assert = require('node:assert/strict');

function calculateCartTotals(items, coupon = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const gst = subtotal * 0.05;
  const shipping = subtotal > 1500 ? 0 : 120;
  const discount = coupon > 0 ? subtotal * (coupon / 100) : 0;
  const total = subtotal + gst + shipping - discount;
  return { subtotal, gst, shipping, discount, total };
}

function isProductAvailable(product, requestedQty) {
  return product.available && product.stock >= requestedQty;
}

function registerRetailCustomer({ name, email, mobile }) {
  if (!name || !email || !mobile) {
    throw new Error('Missing registration fields');
  }

  return {
    type: 'retail_customer',
    name,
    email,
    mobile,
    status: 'active'
  };
}

function assignSupplierToOrder(order, supplier) {
  return {
    orderId: order.id,
    supplierId: supplier.id,
    status: 'assigned',
    recommended: true,
  };
}

test('retail customer registration creates a valid account', () => {
  const customer = registerRetailCustomer({
    name: 'Aditi Sharma',
    email: 'aditi@example.com',
    mobile: '9876543210',
  });

  assert.equal(customer.type, 'retail_customer');
  assert.equal(customer.status, 'active');
});

test('cart totals include GST and shipping logic', () => {
  const totals = calculateCartTotals([
    { price: 580, qty: 1 },
    { price: 335, qty: 2 },
  ]);

  assert.equal(totals.subtotal, 1250);
  assert.equal(totals.gst, 62.5);
  assert.equal(totals.shipping, 120);
  assert.ok(totals.total > 1250);
});

test('out-of-stock products are rejected before checkout', () => {
  const product = { available: true, stock: 4 };
  assert.equal(isProductAvailable(product, 5), false);
});

test('supplier assignment is recommended when supplier is active', () => {
  const order = { id: 'RV-1023' };
  const supplier = { id: 'SP-001', active: true };

  const assignment = assignSupplierToOrder(order, supplier);
  assert.equal(assignment.status, 'assigned');
  assert.equal(assignment.recommended, true);
});
