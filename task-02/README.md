# Task 02: E-Commerce Checkout & Payment System

## Overview
This task is a customer-facing online store simulation featuring product discovery, cart management, and a concurrency-safe checkout flow with mock payment gateways.

## Features
- **Product Discovery:** Search and filter capabilities for a product listing.
- **Cart Management:** Add items to cart and proceed to checkout.
- **Concurrency-Safe Checkout:** Stock is safely reserved when entering checkout.
- **Mock Payment Gateway:** Simulates success, failure, and timeout scenarios for payments.
- **Order History:** View past orders and their status (Pending, Reserved, Paid, Failed, Expired).
- **Automatic Multi-User Simulation:** 
  - To test concurrency without forcing users to register, the frontend automatically generates a unique `mockUserId` upon first visit. 
  - This ID is saved to the browser's `localStorage` and sent in the `x-user-id` header for all API requests. 
  - **Testing Concurrency:** You can open the site on two different laptops (or a normal window and an incognito window), and they will automatically act as two distinct users!

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB

## Local Setup Instructions

### Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd task-02/Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure you have a `.env` file with the following variables:
   ```env
   PORT=5002
   MONGO_URI="your_mongodb_connection_string"
   ```
   *(Note: The port was changed from 5000 to 5002 to avoid conflicts with MacOS's AirPlay Receiver process).*
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd task-02/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   
The frontend is pre-configured to communicate with the backend on `http://localhost:5002/api`.

## Deployment (Vercel)

This project has been fully configured for Vercel deployment:
- **Serverless Backend:** `server.js` now explicitly exports the Express app, and `vercel.json` routes all API traffic correctly.
- **Client Routing:** The React app includes a `vercel.json` to handle client-side routing fallback (SPA redirects).
- **Dynamic API:** The frontend uses `import.meta.env.VITE_API_URL` to dynamically connect to your deployed backend.

### How to Deploy
1. Create a new Vercel project for the **Frontend**. Set the Root Directory to `task-02/frontend`. Add the `VITE_API_URL` environment variable pointing to your deployed backend URL.
2. Create a new Vercel project for the **Backend**. Set the Root Directory to `task-02/Backend`. Add your `MONGO_URI` environment variables.
