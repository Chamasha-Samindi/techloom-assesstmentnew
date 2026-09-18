# StockGuard POS

## Overview
StockGuard POS is a Concurrency-Safe Point-of-Sale Order & Inventory System. It uses atomic MongoDB operations and multi-document transactions to guarantee that simultaneous checkouts can never oversell inventory.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Axios, React Router |
| Backend | Node.js, Express 5, Mongoose 8 |
| Database | MongoDB (Atlas M0 free tier or any Replica Set) |
| Validation | express-validator |
| Background Jobs | node-cron |
| Testing | Jest, Supertest |

## Architecture
```
client/           React frontend (Vite)
server/
  src/
    controllers/  HTTP request/response handling only
    services/     All business logic (checkout, payment, cancellation)
    models/       Mongoose schemas with indexes
    routes/       Express routers
    jobs/         Background cron job (expiry)
  tests/          Jest test suite
  server.js       Entry point
```

## Features
- Product inventory management (full CRUD)
- Cart management with price snapshots at add-time
- **Concurrency-safe checkout** — atomic stock reservation using MongoDB transactions
- **5-minute reservation timer** with automatic expiry and stock release
- Idempotent mock payment simulation (success / failed / timeout)
- Order lifecycle: PENDING → RESERVED → PAID / FAILED / EXPIRED / CANCELLED / REFUNDED
- Duplicate order and duplicate payment protection via idempotency keys
- Order cancellation with automatic refund simulation for paid orders
- React frontend with live 5-minute countdown, payment buttons, and order management

## Database Design

### Models

| Model | Key Fields |
|---|---|
| Product | `name`, `price`, `availableStock` |
| Cart | `items[]` (productId, quantity, **priceSnapshot**), `status` |
| Reservation | `orderId`, `cartId`, `items[]`, `status`, **`expiresAt`** (indexed), `releasedAt` |
| Order | `orderNumber` (unique), `cartId`, `items[]` (price snapshot), `status`, `reservationId`, `paymentId` (unique sparse), `idempotencyKey` (unique sparse) |
| Refund | `refundId`, `paymentId`, `orderId`, `amount`, `status` |

### Key Indexes
- `Order.orderNumber` — unique
- `Order.paymentId` — unique, sparse (prevents duplicate payments at DB level)
- `Order.idempotencyKey` — unique, sparse (prevents duplicate orders at DB level)
- `Reservation.expiresAt` — for efficient expiry queries

## Concurrency Strategy

### The Problem
A naive implementation reads `availableStock`, checks if it's sufficient, then writes the decremented value. Between the read and write, another request can read the same value and both can decrement — causing overselling.

### The Solution: Atomic Conditional Update + Transaction

**For each product in the cart:**
```javascript
const product = await Product.findOneAndUpdate(
  { _id: productId, availableStock: { $gte: requestedQty } },  // condition
  { $inc: { availableStock: -requestedQty } },                  // atomic write
  { new: true, session }
);
if (!product) throw new Error('Insufficient stock');
```

This is a **single atomic operation at the MongoDB server**. The condition and the update are evaluated atomically — no other operation can modify `availableStock` between the check and the decrement.

**For multi-product checkouts**, the entire loop is wrapped in a **MongoDB Transaction** with `snapshot` read concern and `majority` write concern:
- If any product has insufficient stock → the transaction aborts → **all** stock decrements are rolled back
- Only if every product has sufficient stock → the transaction commits → Order + Reservation are created atomically

This guarantees:
1. Stock can never go negative
2. A reservation is always created together with its order (or not at all)
3. No partial reservations — it's all-or-nothing

## Reservation Strategy

```
Checkout succeeds
    ↓
Reservation created with expiresAt = now + 5 minutes
    ↓
Background job (cron, every 1 minute) scans:
    Reservation.find({ status: 'ACTIVE', expiresAt: { $lt: now } })
    ↓ (for each expired reservation, inside a transaction)
    Reservation.status → EXPIRED
    Product.availableStock += quantity  (for each item)
    Order.status → EXPIRED
```

**Idempotency of the expiry job**: The job re-fetches the reservation _inside_ the transaction with `status: 'ACTIVE'`. If a payment or cancellation has already handled it, the inner query returns null and the transaction aborts — the job can never release the same stock twice.

## Payment State Machine

```
RESERVED ──[success]──→ PAID
         ──[failed]───→ FAILED     (stock restored)
         ──[timeout]──→ EXPIRED    (stock restored)
         ──[expiry]───→ EXPIRED    (stock restored by cron job)
         ──[cancel]───→ CANCELLED  (stock restored)

PAID ──[cancel]──→ REFUNDED  (stock restored + Refund record created)
```

## Duplicate Protection

| Operation | Mechanism |
|---|---|
| Checkout | `idempotencyKey` unique sparse index in `Order`. Second request with same key returns the original order. |
| Payment | `paymentId` unique sparse index in `Order`. Same `paymentId` returns the original payment result. Backend also rejects payment on non-`RESERVED` orders. |

## Order Lifecycle

```
POST /api/orders (checkout)
         ↓
    PENDING → RESERVED
         ↓
    [payment]
    ├── success  → PAID → [cancel] → REFUNDED
    ├── failed   → FAILED
    └── timeout  → EXPIRED
         ↓
    [cancel from RESERVED] → CANCELLED
```

## API Endpoints

| Method | URL | Description |
|---|---|---|
| POST | `/api/products` | Create product |
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/carts` | Create cart |
| GET | `/api/carts/:id` | Get cart (refreshes prices) |
| POST | `/api/carts/:id/items` | Add item (merges duplicates) |
| PATCH | `/api/carts/:id/items/:productId` | Update item quantity |
| DELETE | `/api/carts/:id/items/:productId` | Remove item |
| POST | `/api/orders` | **Checkout** (atomic reservation) |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/:id` | Get order + reservation details |
| POST | `/api/orders/:id/payment` | Mock payment (success/failed/timeout) |
| POST | `/api/orders/:id/cancel` | Cancel order |

## Local Setup

### 1. MongoDB

> **MongoDB Atlas M0 (free tier) fully supports transactions.** Atlas clusters are always replica sets, which is the only MongoDB requirement for transactions.
>
> You can also use a local MongoDB with a replica set:
> ```bash
> # Option A: Docker (easiest)
> docker run -d -p 27017:27017 --name mongo-rs mongo:7 mongod --replSet rs0
> docker exec -it mongo-rs mongosh --eval "rs.initiate()"
> # URI: mongodb://localhost:27017/stockguard?replicaSet=rs0
>
> # Option B: Atlas free tier
> # Create a free cluster at https://cloud.mongodb.com
> # URI: mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/stockguard
> ```

### 2. Backend

```bash
cd task-01/server
npm install
cp .env.example .env
# Edit .env and set MONGODB_URI
npm run dev         # hot-reload with nodemon
# or
npm start           # production
```

### 3. Frontend

```bash
cd task-01/client
npm install
npm run dev         # opens http://localhost:5173
```

## Testing

```bash
cd task-01/server
# Make sure .env has a valid MONGODB_URI (a replica set connection)
npm test
```

Tests use a dedicated `stockguard_test` database that is automatically dropped after every run — your production data is never touched.

### Test Coverage

| # | Test | File |
|---|---|---|
| 1–7 | Product CRUD + validation | `concurrency.test.js` |
| 8–12 | Cart operations | `concurrency.test.js` |
| 13–16 | Checkout (success, insufficient stock, idempotency) | `concurrency.test.js` |
| 17–22 | Payment (success, failed, timeout, duplicate, idempotent) | `concurrency.test.js` |
| 23–26 | Cancellation & Refund | `concurrency.test.js` |
| 27 | **Concurrency: 10 requests vs 5 stock** | `concurrency.test.js` |
| 28 | **Concurrency: 20 requests vs 3 stock** | `concurrency.test.js` |

## Concurrency Test

The key test (`Concurrency — Oversell Prevention`):

```
Product: availableStock = 5
10 simultaneous checkout requests, each for quantity 1

Expected outcome:
  ✅ successCount    = 5  (exactly 5 requests succeed)
  ✅ failCount       = 5  (exactly 5 get INSUFFICIENT_STOCK 409)
  ✅ availableStock  = 0  (never negative)
  ✅ totalReserved   = 5  (matches original stock)
```

## Deployment (Vercel)

This project has been fully configured for Vercel deployment:
- **Serverless Backend:** `server.js` now explicitly exports the Express app, and `vercel.json` routes all API traffic correctly.
- **Client Routing:** The React app includes a `vercel.json` to handle client-side routing fallback (SPA redirects).

### How to Deploy
1. Create a new Vercel project for the **Frontend**. Set the Root Directory to `task-01/client`. Add the `VITE_API_URL` environment variable pointing to your deployed backend URL.
2. Create a new Vercel project for the **Backend**. Set the Root Directory to `task-01/server`. Add your `MONGODB_URI` environment variable.

| | URL |
|---|---|
| Frontend URL | [Placeholder] |
| Backend URL | [Placeholder] |
| GitHub URL | [Placeholder] |
