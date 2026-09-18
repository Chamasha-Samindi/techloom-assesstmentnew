/**
 * StockGuard POS — Automated Test Suite
 *
 * Requirements:
 *   • Copy server/.env.example → server/.env and fill in MONGODB_URI before running.
 *   • The MONGODB_URI must point to a MongoDB Replica Set (Atlas M0/M10+ or local).
 *   • Run: npm test (from the server/ directory)
 *
 * Tests use a dedicated "stockguard_test" database that is dropped after each
 * test file to keep production data untouched.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const Reservation = require('../src/models/Reservation');

// Derive a test-specific DB URI so we never touch the production database
const TEST_DB_URI = (() => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI must be set in server/.env before running tests');
  // Replace the database name in the URI with "stockguard_test"
  return uri.replace(/\/([^/?]+)(\?|$)/, '/stockguard_test$2');
})();

jest.setTimeout(60000);

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
});

afterAll(async () => {
  // Drop the test database entirely so tests are fully isolated
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  // Clean all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function createProduct(overrides = {}) {
  const product = await Product.create({
    name: 'Test Product',
    price: 50,
    availableStock: 10,
    ...overrides,
  });
  return product;
}

async function createCart(productId, quantity = 1, price = 50) {
  const cart = await Cart.create({
    items: [{ productId, quantity, priceSnapshot: price }],
    status: 'ACTIVE',
  });
  return cart;
}

async function checkout(cartId, idempotencyKey) {
  return request(app)
    .post('/api/orders')
    .send({ cartId: String(cartId), idempotencyKey });
}

// ─────────────────────────────────────────────────────────────────────────────
// Product CRUD
// ─────────────────────────────────────────────────────────────────────────────

describe('Product CRUD', () => {
  it('creates a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Widget', price: 9.99, availableStock: 100 });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Widget');
    expect(res.body.data.availableStock).toBe(100);
  });

  it('rejects a product with negative price', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Bad', price: -1, availableStock: 10 });
    expect(res.status).toBe(400);
  });

  it('rejects a product with missing name', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ price: 10, availableStock: 10 });
    expect(res.status).toBe(400);
  });

  it('lists products', async () => {
    await Product.create([
      { name: 'A', price: 1, availableStock: 5 },
      { name: 'B', price: 2, availableStock: 3 },
    ]);
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('returns 404 for unknown product', async () => {
    const res = await request(app).get(`/api/products/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });

  it('updates a product', async () => {
    const product = await createProduct();
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .send({ name: 'Updated', price: 99, availableStock: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated');
  });

  it('deletes a product', async () => {
    const product = await createProduct();
    const res = await request(app).delete(`/api/products/${product._id}`);
    expect(res.status).toBe(200);
    const gone = await Product.findById(product._id);
    expect(gone).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────────────────────────────────────

describe('Cart', () => {
  it('creates an empty cart', async () => {
    const res = await request(app).post('/api/carts');
    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('adds an item to the cart', async () => {
    const product = await createProduct();
    const cartRes = await request(app).post('/api/carts');
    const cartId = cartRes.body.data._id;
    const res = await request(app)
      .post(`/api/carts/${cartId}/items`)
      .send({ productId: String(product._id), quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].quantity).toBe(2);
    expect(res.body.data.items[0].priceSnapshot).toBe(product.price);
  });

  it('merges duplicate products in cart', async () => {
    const product = await createProduct();
    const cartRes = await request(app).post('/api/carts');
    const cartId = cartRes.body.data._id;
    await request(app)
      .post(`/api/carts/${cartId}/items`)
      .send({ productId: String(product._id), quantity: 1 });
    await request(app)
      .post(`/api/carts/${cartId}/items`)
      .send({ productId: String(product._id), quantity: 2 });
    const res = await request(app).get(`/api/carts/${cartId}`);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(3);
  });

  it('rejects non-positive quantity', async () => {
    const product = await createProduct();
    const cartRes = await request(app).post('/api/carts');
    const cartId = cartRes.body.data._id;
    const res = await request(app)
      .post(`/api/carts/${cartId}/items`)
      .send({ productId: String(product._id), quantity: 0 });
    expect(res.status).toBe(400);
  });

  it('removes an item from the cart', async () => {
    const product = await createProduct();
    const cart = await createCart(product._id, 2);
    const res = await request(app).delete(`/api/carts/${cart._id}/items/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Checkout
// ─────────────────────────────────────────────────────────────────────────────

describe('Checkout', () => {
  it('reserves stock and creates order + reservation', async () => {
    const product = await createProduct({ availableStock: 5 });
    const cart = await createCart(product._id, 2);
    const res = await checkout(cart._id, 'key-1');

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('RESERVED');
    expect(res.body.reservation.status).toBe('ACTIVE');

    const updated = await Product.findById(product._id);
    expect(updated.availableStock).toBe(3); // 5 - 2
  });

  it('returns 409 when stock is insufficient', async () => {
    const product = await createProduct({ availableStock: 1 });
    const cart = await createCart(product._id, 5);
    const res = await checkout(cart._id);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INSUFFICIENT_STOCK');
  });

  it('does not decrement stock on failure', async () => {
    const product = await createProduct({ availableStock: 1 });
    const cart = await createCart(product._id, 5);
    await checkout(cart._id);
    const unchanged = await Product.findById(product._id);
    expect(unchanged.availableStock).toBe(1);
  });

  it('returns existing order for duplicate idempotency key', async () => {
    const product = await createProduct({ availableStock: 5 });
    const cart1 = await createCart(product._id, 1);
    const res1 = await checkout(cart1._id, 'same-key');
    expect(res1.status).toBe(200);

    // Second request with the same key — must return original order
    const cart2 = await createCart(product._id, 1); // separate cart
    const res2 = await checkout(cart2._id, 'same-key');
    expect(res2.status).toBe(200);
    expect(res2.body.order._id).toBe(res1.body.order._id);

    // Stock must only have been decremented once
    const updated = await Product.findById(product._id);
    expect(updated.availableStock).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Payment
// ─────────────────────────────────────────────────────────────────────────────

async function checkoutAndGetOrder(stockQty = 5, requestQty = 1) {
  const product = await createProduct({ availableStock: stockQty });
  const cart = await createCart(product._id, requestQty);
  const res = await checkout(cart._id, `key-${Date.now()}`);
  return { orderId: res.body.order._id, product };
}

describe('Payment', () => {
  it('marks order PAID and reservation CONSUMED on success', async () => {
    const { orderId } = await checkoutAndGetOrder();
    const res = await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .send({ outcome: 'success', paymentId: 'pay-001' });
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('PAID');
    const reservation = await Reservation.findOne({ orderId });
    expect(reservation.status).toBe('CONSUMED');
  });

  it('marks order FAILED and restores stock on payment failure', async () => {
    const { orderId, product } = await checkoutAndGetOrder(5, 2);
    await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .send({ outcome: 'failed', paymentId: 'pay-002' });
    const order = await Order.findById(orderId);
    expect(order.status).toBe('FAILED');
    const p = await Product.findById(product._id);
    expect(p.availableStock).toBe(5); // fully restored
  });

  it('marks order EXPIRED and restores stock on timeout', async () => {
    const { orderId, product } = await checkoutAndGetOrder(5, 3);
    await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .send({ outcome: 'timeout', paymentId: 'pay-003' });
    const order = await Order.findById(orderId);
    expect(order.status).toBe('EXPIRED');
    const p = await Product.findById(product._id);
    expect(p.availableStock).toBe(5); // fully restored
  });

  it('rejects payment on a PAID order (duplicate protection)', async () => {
    const { orderId } = await checkoutAndGetOrder();
    await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .send({ outcome: 'success', paymentId: 'pay-004' });
    const res2 = await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .send({ outcome: 'success', paymentId: 'pay-004b' });
    expect(res2.status).toBe(409);
  });

  it('returns original result for duplicate paymentId (idempotent payment)', async () => {
    const { orderId } = await checkoutAndGetOrder();
    const pay1 = await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .send({ outcome: 'success', paymentId: 'pay-idempotent' });
    // Simulate retry with same paymentId
    const pay2 = await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .send({ outcome: 'success', paymentId: 'pay-idempotent' });
    expect(pay2.status).toBe(200);
    expect(pay2.body.message).toMatch(/already processed/i);
  });

  it('rejects invalid outcome', async () => {
    const { orderId } = await checkoutAndGetOrder();
    const res = await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .send({ outcome: 'hacked' });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cancellation & Refund
// ─────────────────────────────────────────────────────────────────────────────

describe('Cancellation & Refund', () => {
  it('cancels a RESERVED order and restores stock', async () => {
    const { orderId, product } = await checkoutAndGetOrder(5, 2);
    const res = await request(app).post(`/api/orders/${orderId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('CANCELLED');
    const p = await Product.findById(product._id);
    expect(p.availableStock).toBe(5);
  });

  it('cancels a PAID order → REFUNDED and restores stock', async () => {
    const { orderId, product } = await checkoutAndGetOrder(5, 2);
    await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .send({ outcome: 'success', paymentId: 'pay-refund-test' });
    const res = await request(app).post(`/api/orders/${orderId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('REFUNDED');
    const p = await Product.findById(product._id);
    expect(p.availableStock).toBe(5); // stock fully restored
  });

  it('is idempotent for already-cancelled orders', async () => {
    const { orderId } = await checkoutAndGetOrder();
    await request(app).post(`/api/orders/${orderId}/cancel`);
    const res = await request(app).post(`/api/orders/${orderId}/cancel`);
    expect(res.status).toBe(200); // returns 200, not error
  });

  it('rejects invalid state transitions (cannot cancel a FAILED order)', async () => {
    const { orderId } = await checkoutAndGetOrder();
    await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .send({ outcome: 'failed', paymentId: 'pay-x' });
    const res = await request(app).post(`/api/orders/${orderId}/cancel`);
    // Should be idempotent — FAILED is a terminal state
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('FAILED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CONCURRENCY TEST — The Core Assessment Requirement
// ─────────────────────────────────────────────────────────────────────────────

describe('Concurrency — Oversell Prevention', () => {
  it('10 simultaneous requests on 5-unit stock: exactly 5 succeed, stock never goes negative', async () => {
    const INITIAL_STOCK = 5;
    const CONCURRENT_REQUESTS = 10;
    const QTY_EACH = 1;

    // Create a single product with 5 units
    const product = await createProduct({ name: 'Hot Item', availableStock: INITIAL_STOCK });

    // Create 10 separate carts, one per simulated user
    const carts = await Promise.all(
      Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
        Cart.create({
          items: [{ productId: product._id, quantity: QTY_EACH, priceSnapshot: product.price }],
          status: 'ACTIVE',
        })
      )
    );

    // Fire all checkout requests simultaneously
    const responses = await Promise.allSettled(
      carts.map((cart, i) =>
        request(app)
          .post('/api/orders')
          .send({ cartId: String(cart._id), idempotencyKey: `concurrency-test-${i}` })
      )
    );

    let successCount = 0;
    let insufficientStockCount = 0;
    let otherCount = 0;

    responses.forEach((result) => {
      if (result.status !== 'fulfilled') { otherCount++; return; }
      const { status, body } = result.value;
      if (status === 200) {
        successCount++;
      } else if (status === 409 && body.code === 'INSUFFICIENT_STOCK') {
        insufficientStockCount++;
      } else {
        otherCount++;
        console.error('Unexpected response:', status, body);
      }
    });

    // ── Assertions ──────────────────────────────────────────────────────────

    // Exactly 5 requests should have succeeded (one per unit of stock)
    expect(successCount).toBe(INITIAL_STOCK);

    // Exactly 5 requests should have failed with INSUFFICIENT_STOCK
    expect(insufficientStockCount).toBe(CONCURRENT_REQUESTS - INITIAL_STOCK);

    // No unexpected errors
    expect(otherCount).toBe(0);

    // Final stock must be exactly 0 — never negative
    const finalProduct = await Product.findById(product._id);
    expect(finalProduct.availableStock).toBe(0);

    // Total quantity in all RESERVED orders must equal INITIAL_STOCK
    const reservedOrders = await Order.find({ status: 'RESERVED' });
    const totalReserved = reservedOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
      0
    );
    expect(totalReserved).toBe(INITIAL_STOCK);
  });

  it('stock never goes negative even when 20 requests compete for 3 units', async () => {
    const INITIAL_STOCK = 3;
    const CONCURRENT_REQUESTS = 20;
    const QTY_EACH = 1;

    const product = await createProduct({ name: 'Scarce Item', availableStock: INITIAL_STOCK });
    const carts = await Promise.all(
      Array.from({ length: CONCURRENT_REQUESTS }, () =>
        Cart.create({
          items: [{ productId: product._id, quantity: QTY_EACH, priceSnapshot: product.price }],
          status: 'ACTIVE',
        })
      )
    );

    await Promise.allSettled(
      carts.map((cart, i) =>
        request(app)
          .post('/api/orders')
          .send({ cartId: String(cart._id), idempotencyKey: `stress-${i}` })
      )
    );

    const finalProduct = await Product.findById(product._id);
    // The critical invariant: stock must NEVER be negative
    expect(finalProduct.availableStock).toBeGreaterThanOrEqual(0);
    expect(finalProduct.availableStock).toBeLessThanOrEqual(INITIAL_STOCK);
  });
});
