# Techloom.ai Software Engineer Intern - Practical Assessment

**Repository URL:** [Add your GitHub repo link here]
**Task 1 Deployment Link:** [Add Task 1 Live Link here]
**Task 2 Deployment Link:** [Add Task 2 Live Link here]

This repository contains the completion of the Techloom Software Engineer Intern Practical Assessment, consisting of two main tasks focused on concurrency-safe MERN stack applications.

---

## 📁 Repository Structure
- `/task-01`: POS Order & Inventory System
- `/task-02`: E-Commerce Checkout & Payment System

---

## 🛠️ Tech Stack (Both Tasks)
- **Frontend:** React, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)

---

## 🚀 Task 01: POS Order & Inventory System
A backend and frontend system demonstrating concurrency-safe stock reservation during checkout.

**Key Features:**
- Atomic MongoDB transactions to prevent overselling.
- 5-minute stock reservations using background cron jobs for automatic expiry.
- Mock payment state machine (Success, Failed, Timeout).

**Testing Concurrency:**
The system uses atomic Mongo updates. You can trigger simultaneous checkouts to the same item, and it will strictly reject overselling.

**Setup Instructions:**
1. Navigate to `/task-01/server` and run `npm install`.
2. Configure your MongoDB connection in `/task-01/server/.env` (ensure it is a Replica Set for transactions to work).
3. Start the backend: `npm run dev` (Runs on port `5001`).
4. Navigate to `/task-01/client` and run `npm install`.
5. Start the frontend: `npm run dev`.

---

## 🛒 Task 02: E-Commerce Checkout System
A customer-facing storefront that simulates product discovery, checkout, and mock payment handling with multi-user isolation.

**Key Features:**
- Product search and filtering.
- Concurrency-safe stock reservation upon entering the checkout flow.
- Mock payments (Success, Failed, Timeout).
- **Auto-generated Mock Users:** The frontend automatically generates and stores a unique `mockUserId` in the browser's `localStorage`. This allows you to open the live link on multiple different devices and have them automatically treated as distinct users, without requiring a manual login system!

**Setup Instructions:**
1. Navigate to `/task-02/Backend` and run `npm install`.
2. Ensure your `/task-02/Backend/.env` has `PORT=5002` and a valid `MONGO_URI`. *(Port 5002 is used to avoid conflict with macOS Control Center on port 5000).*
3. Start the backend: `npm run dev` (Runs on port `5002`).
4. Navigate to `/task-02/frontend` and run `npm install`.
5. Start the frontend: `npm run dev`.

---

## 📝 A Note on User Authentication
To focus purely on the concurrency, reservation, and mock-payment logic requested by the assessment, a full User Authentication system (JWT, password hashing) was intentionally omitted. 

Instead, a robust **Mock User Middleware** is used:
- In **Task 2**, the frontend generates a unique random ID and saves it to `localStorage`, sending it as the `x-user-id` header in API requests. This perfectly simulates multiple users independently browsing and testing concurrency without login friction.

---

## ☁️ Deployment Guide (Vercel)

Both Task 01 and Task 02 have been meticulously configured to be deployed on **Vercel**. 

Since this repository contains multiple sub-projects, you will need to create **4 separate Vercel projects** connected to this single GitHub repository.

**Important Vercel Settings:**
For each Vercel project you create, you must click `Edit` on the **Root Directory** setting during the setup and point it to the correct folder:

1. **Task 1 Frontend:** Set Root Directory to `task-01/client`. Add `VITE_API_URL` to your environment variables (pointing to the backend URL).
2. **Task 1 Backend:** Set Root Directory to `task-01/server`. Add `MONGODB_URI` to your environment variables.
3. **Task 2 Frontend:** Set Root Directory to `task-02/frontend`. Add `VITE_API_URL` to your environment variables.
4. **Task 2 Backend:** Set Root Directory to `task-02/Backend`. Add `MONGO_URI` to your environment variables.

All backends have been configured as Serverless Functions (`vercel.json` routing + Express `app` exports) and all frontends have been configured with SPA routing fallbacks!
