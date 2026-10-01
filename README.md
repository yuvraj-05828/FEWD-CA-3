# COOK — Recipe Management API

A full-stack recipe management application built with Node.js, Express, MongoDB, JWT authentication, and a responsive vanilla JavaScript frontend.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [API Endpoints](#api-endpoints)
- [Authentication & Security](#authentication--security)
- [Database Schema & Indexes](#database-schema--indexes)
- [Server-Side Validation](#server-side-validation)
- [Centralized Error Handling](#centralized-error-handling)
- [Local Setup & Installation](#local-setup--installation)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [API Request & Response Examples](#api-request--response-examples)
- [Automated Testing & Performance Benchmarks](#automated-testing--performance-benchmarks)
- [Deployment Guide (Render)](#deployment-guide-render)
- [Live Demo & Repository](#live-demo--repository)

---

## Overview

**COOK** started as a static frontend interface and has been engineered into a production-ready, backend-focused full-stack web application. The platform allows food enthusiasts and chefs to discover gourmet dishes, register accounts, authenticate securely via JWT, and manage recipes with full CRUD (Create, Read, Update, Delete) capabilities.

The Express backend serves both the REST API endpoints and the connected frontend assets, providing a seamless unified architecture suitable for deployment on cloud services like Render.

---

## Features

- **JWT Authentication**: Stateless authentication with JSON Web Tokens, `Bearer` authorization headers, and token expiration.
- **Password Security**: Passwords hashed with `bcryptjs` using a salt work factor of 10. Passwords are excluded from database queries and serialization by default.
- **Creator-Based Authorization**: Protected operations verify ownership — only the recipe author or an administrator can modify or delete a recipe.
- **Recipe CRUD Engine**: Complete RESTful interface to create, read, update, and delete gourmet recipes.
- **Real-Time Search & Filtering**: Multi-field search over recipe titles, categories, and ingredients, combined with category filters.
- **Server-Side Validation**: Request payload and parameter validation powered by `express-validator` with structured error feedback.
- **Centralized Error Handling**: Standardized JSON responses for all error types (malformed JSON, invalid MongoDB ObjectIds, duplicates, 404s, and unexpected server errors).
- **Security Middlewares**: HTTP header protection with `helmet`, configurable `cors`, and IP-based `express-rate-limit` against brute-force attacks.
- **Connected Vanilla JS Frontend**: Dynamic UI updates with `fetch()` calls, modal dialogues for authentication and recipe management, and persistent session state in `localStorage`.
- **Zero-Dependency Automated Testing**: Self-contained test suite with in-memory MongoDB (`mongodb-memory-server`) and `supertest`, validating all endpoints and measuring real response latency.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Runtime** | Node.js (v24 LTS), Express 4.x |
| **Database** | MongoDB with Mongoose 8.x ODM |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Validation** | `express-validator` |
| **Security** | `helmet`, `cors`, `express-rate-limit`, `dotenv` |
| **Frontend** | HTML5, CSS3 (Cyberpunk-gourmet dark aesthetic), Vanilla JavaScript (ES6+ `fetch`) |
| **Testing & Benchmark** | `supertest`, `mongodb-memory-server` |
| **Deployment Target** | Render (Web Service), MongoDB Atlas |

---

## System Architecture

```
+-------------------------------------------------------------------------+
|                              CLIENT BROWSER                              |
|   index.html | styles.css | app.js (localStorage JWT + fetch REST API)  |
+------------------------------------+------------------------------------+
                                     |  HTTP / REST (JSON)
                                     v
+-------------------------------------------------------------------------+
|                           EXPRESS BACKEND                               |
|                                                                         |
|  [Security Middlewares: Helmet, CORS, Rate Limit, Express JSON Parser]   |
|                                    |                                    |
|             +----------------------+----------------------+             |
|             |                                             |             |
|             v                                             v             |
|     /api/auth Routes                              /api/recipes Routes   |
|   (authValidator -> protect)                 (recipeValidator -> protect|
|             |                                   -> authorizeOwner)      |
|             v                                             v             |
|       authController                               recipeController     |
|             |                                             |             |
|             +----------------------+----------------------+             |
|                                    |                                    |
|                                    v                                    |
|                          Mongoose ODM Layer                             |
|                         [User.js | Recipe.js]                           |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                           MONGODB DATABASE                              |
|                    (Indexed Collections: users, recipes)                |
+-------------------------------------------------------------------------+
```

---

## API Endpoints

All API endpoints are prefixed with `/api`.

| Method | Endpoint | Auth Required | Description | Status Codes |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/health` | No | Service health check and status | `200` |
| `POST` | `/api/auth/register` | No | Register a new user account | `201`, `400`, `409` |
| `POST` | `/api/auth/login` | No | Authenticate user and receive JWT | `200`, `400`, `401` |
| `GET` | `/api/auth/me` | **Yes** | Get current authenticated user profile | `200`, `401` |
| `GET` | `/api/recipes` | No | Retrieve all recipes (supports `?search=` and `?category=`) | `200` |
| `GET` | `/api/recipes/:id` | No | Retrieve single recipe by MongoDB ObjectId | `200`, `400`, `404` |
| `POST` | `/api/recipes` | **Yes** | Create a new recipe (author set from JWT) | `201`, `400`, `401` |
| `PUT` | `/api/recipes/:id` | **Yes** | Update recipe (Creator or Admin only) | `200`, `400`, `401`, `403`, `404` |
| `DELETE` | `/api/recipes/:id` | **Yes** | Delete recipe (Creator or Admin only) | `200`, `400`, `401`, `403`, `404` |

---

## Authentication & Security

1. **Password Hashing**: User passwords are automatically hashed with `bcryptjs` using a cost factor of 10 prior to persistence via a Mongoose pre-save hook.
2. **Stateless JWTs**: On successful registration or login, the server issues a signed JWT containing `{ id: user._id, role: user.role }`.
3. **Protected Route Verification**: The `protect` middleware inspects the `Authorization: Bearer <token>` header, verifies the signature using `JWT_SECRET`, loads the user record excluding the password, and attaches it to `req.user`.
4. **Ownership Authorization**: The `authorizeRecipeOwnerOrAdmin` middleware checks whether `req.user._id` matches `recipe.createdBy`. If the user is neither the creator nor an administrator, a `403 Forbidden` response is returned.
5. **Brute-Force Rate Limiting**: The `/api` router is throttled to 150 requests per 15 minutes per IP.
6. **HTTP Security Headers**: `helmet` enforces Content Security Policy (CSP), prevents clickjacking, and restricts cross-origin resource leaks.

---

## Database Schema & Indexes

### User Schema (`models/User.js`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Required, Trim, minlength: 2, maxlength: 50 | Display name |
| `email` | String | Required, Unique, Lowercase, Trim, Indexed | User login email |
| `password` | String | Required, minlength: 6, `select: false` | Hashed password |
| `role` | String | Enum: `['user', 'admin']`, Default: `'user'` | Access control role |
| `createdAt`| Date | Default: `Date.now` | Account creation timestamp |

### Recipe Schema (`models/Recipe.js`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | Required, Trim, maxlength: 120, Indexed | Dish name |
| `ingredients` | [String] | Required, Array of non-empty strings | Ingredient list |
| `instructions`| String | Required, Trim | Step-by-step instructions |
| `image` | String | Trim, Default placeholder URL | Image link |
| `category` | String | Required, Trim, Lowercase, Indexed | Category (`pasta`, `curry`, etc.) |
| `createdBy` | ObjectId | Ref: `'User'`, Required, Indexed | Creator user ID |
| `createdAt` | Date | Managed by timestamps (`timestamps: true`) | Creation date |
| `updatedAt` | Date | Managed by timestamps (`timestamps: true`) | Last update date |

### Database Indexes

- `users.email`: Unique single-field index for fast lookups and duplicate prevention.
- `recipes.title`: Index for title sorting and equality searches.
- `recipes.category`: Index for category filtering.
- `recipes.createdBy`: Index for filtering recipes by user.
- Compound Text Index on `{ title: 'text', category: 'text', instructions: 'text' }` for keyword searches.

---

## Server-Side Validation

Implemented using `express-validator`. Invalid requests are rejected with status `400 Bad Request` before reaching controllers.

### Standardized Error Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Name is required",
    "Please provide a valid email address",
    "Password must be at least 6 characters long"
  ]
}
```

### Validated Rules

- **Registration**:
  - `name`: Non-empty string, length 2–50 chars.
  - `email`: Normalized email format.
  - `password`: Minimum 6 characters.
- **Login**:
  - `email`: Normalized email format.
  - `password`: Non-empty.
- **Recipe Creation & Update**:
  - `title`: Non-empty string, length 2–120 chars.
  - `ingredients`: Non-empty array or parseable string containing at least one non-empty ingredient.
  - `instructions`: Non-empty string.
  - `category`: Non-empty category string.
  - `:id` Parameter: Valid 24-character hexadecimal MongoDB ObjectId.

---

## Centralized Error Handling

All unhandled exceptions and pipeline errors pass through `middleware/errorMiddleware.js`.

### Handled Error Scenarios

| Scenario | HTTP Status | Returned Response |
| :--- | :---: | :--- |
| Malformed JSON body | `400` | `{ "success": false, "message": "Malformed JSON in request body" }` |
| Invalid MongoDB ObjectId | `400` | `{ "success": false, "message": "Resource not found with invalid ID: ..." }` |
| Validation failure | `400` | `{ "success": false, "message": "Validation failed", "errors": [...] }` |
| Missing or invalid JWT | `401` | `{ "success": false, "message": "Not authorized, token missing / invalid" }` |
| Unauthorized modification | `403` | `{ "success": false, "message": "Forbidden: You are not authorized..." }` |
| Resource not found | `404` | `{ "success": false, "message": "Recipe not found" }` |
| Duplicate email registered | `409` | `{ "success": false, "message": "A user with this email already exists" }` |
| Unknown route | `404` | `{ "success": false, "message": "Endpoint GET /foo not found" }` |
| Unhandled server exception | `500` | `{ "success": false, "message": "Internal Server Error" }` |

---

## Local Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended; v24 LTS verified)
- [npm](https://www.npmjs.com/) (v9 or higher; v11 verified)
- [MongoDB](https://www.mongodb.com/) (Local Community Server or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 1. Clone the Repository

```bash
git clone https://github.com/yuvraj-05828/FEWD-CA-3.git
cd FEWD-CA-3
```

### 2. Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables

Create `.env` inside the `backend/` directory from `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/cook_recipe_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5000
```

> **For MongoDB Atlas**: Replace `MONGODB_URI` with your connection string:  
> `mongodb+srv://<username>:<password>@cluster0.mongodb.net/cook_recipe_db?retryWrites=true&w=majority`

### 4. (Optional) Seed the Database

Populate sample users and gourmet dishes:

```bash
npm --prefix backend run seed
```

This creates:
- **Chef Gordon** (`chef@cook.com` / `Password123!`) — Admin
- **Jane Foodie** (`jane@cook.com` / `Password123!`) — Standard User
- 5 gourmet recipes (Authentic Italian Carbonara, Butter Chicken, Margherita Pizza, Acai Bowl, Miso Salmon)

### 5. Start the Application

```bash
# Start backend and serve frontend from root:
npm start

# Or directly from backend folder:
cd backend
npm start
```

Open your browser at **`http://localhost:5000`**.

---

## Environment Variables

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port for the Express HTTP server |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) |
| `MONGODB_URI` | **Yes** | `mongodb://127.0.0.1:27017/cook_recipe_db` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | **Yes** | - | Secret string used to sign and verify JWTs |
| `JWT_EXPIRE` | No | `7d` | Token expiration timeframe (e.g. `7d`, `24h`) |
| `CLIENT_URL` | No | `*` | Comma-separated list of allowed origins for CORS |

---

## API Request & Response Examples

### 1. User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chef Mario",
    "email": "mario@cook.com",
    "password": "Password123!"
  }'
```

**Response (`201 Created`):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "6724b107e3a479b18f3a0981",
      "name": "Chef Mario",
      "email": "mario@cook.com",
      "role": "user",
      "createdAt": "2026-10-01T06:10:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario@cook.com",
    "password": "Password123!"
  }'
```

**Response (`200 OK`):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "6724b107e3a479b18f3a0981",
      "name": "Chef Mario",
      "email": "mario@cook.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Authenticated User Profile

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 4. Create a Recipe (Protected)

```bash
curl -X POST http://localhost:5000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "title": "Creamy Tuscan Garlic Chicken",
    "category": "curry",
    "ingredients": [
      "2 Chicken Breasts",
      "1 cup Heavy Cream",
      "1 cup Baby Spinach",
      "1/2 cup Sun-dried Tomatoes",
      "3 cloves Garlic (minced)"
    ],
    "instructions": "1. Pan-sear chicken breasts.\n2. Sauté garlic, tomatoes, and spinach.\n3. Stir in heavy cream and simmer until thickened.",
    "image": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d"
  }'
```

**Response (`201 Created`):**

```json
{
  "success": true,
  "message": "Recipe created successfully",
  "data": {
    "_id": "6724b12fe3a479b18f3a0995",
    "title": "Creamy Tuscan Garlic Chicken",
    "category": "curry",
    "ingredients": [
      "2 Chicken Breasts",
      "1 cup Heavy Cream",
      "1 cup Baby Spinach",
      "1/2 cup Sun-dried Tomatoes",
      "3 cloves Garlic (minced)"
    ],
    "instructions": "1. Pan-sear chicken breasts.\n2. Sauté garlic, tomatoes, and spinach.\n3. Stir in heavy cream and simmer until thickened.",
    "image": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d",
    "createdBy": {
      "_id": "6724b107e3a479b18f3a0981",
      "name": "Chef Mario",
      "email": "mario@cook.com",
      "role": "user"
    },
    "createdAt": "2026-10-01T06:12:00.000Z",
    "updatedAt": "2026-10-01T06:12:00.000Z"
  }
}
```

### 5. Get Recipes with Search & Filter

```bash
# Retrieve all recipes in category 'pasta' matching keyword 'Garlic'
curl -X GET "http://localhost:5000/api/recipes?category=pasta&search=Garlic"
```

### 6. Update Recipe (Protected & Creator Authorized)

```bash
curl -X PUT http://localhost:5000/api/recipes/6724b12fe3a479b18f3a0995 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "title": "Creamy Tuscan Garlic Chicken (Chef Special)"
  }'
```

### 7. Delete Recipe (Protected & Creator Authorized)

```bash
curl -X DELETE http://localhost:5000/api/recipes/6724b12fe3a479b18f3a0995 \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## Automated Testing & Performance Benchmarks

The project includes an automated test runner (`backend/tests/api.test.js`) executed with `mongodb-memory-server` and `supertest`.

### Run Test Suite

```bash
npm --prefix backend test
```

### Measured Test Results

```
========================================
  COOK Recipe API - Automated Test Suite
========================================

  ✔ PASS: POST /api/auth/register - Successful registration returns 201 & JWT token without password
  ✔ PASS: POST /api/auth/register - Duplicate email registration returns 409 Conflict
  ✔ PASS: POST /api/auth/register - Invalid input triggers 400 with detailed validation errors
  ✔ PASS: POST /api/auth/login - Successful login returns 200 & new JWT token
  ✔ PASS: POST /api/auth/login - Invalid password credentials return 401 Unauthorized
  ✔ PASS: GET /api/auth/me - Access profile with valid JWT returns 200 & user data
  ✔ PASS: GET /api/auth/me - Missing JWT token returns 401 Unauthorized
  ✔ PASS: GET /api/auth/me - Malformed JWT token returns 401 Unauthorized
  ✔ PASS: POST /api/recipes - Authenticated user creates recipe successfully (201 Created)
  ✔ PASS: POST /api/recipes - Unauthenticated recipe creation blocked with 401 Unauthorized
  ✔ PASS: POST /api/recipes - Missing required fields triggers 400 Validation Error
  ✔ PASS: GET /api/recipes - Public endpoint retrieves list of recipes (200 OK)
  ✔ PASS: GET /api/recipes?category=pasta - Successfully filters recipes by category
  ✔ PASS: GET /api/recipes?search=Mushroom - Successfully searches recipes by keyword
  ✔ PASS: GET /api/recipes/:id - Retrieves single recipe with populated creator (200 OK)
  ✔ PASS: GET /api/recipes/:id - Malformed MongoDB ObjectId returns 400 Validation Error
  ✔ PASS: GET /api/recipes/:id - Non-existent recipe ID returns 404 Not Found
  ✔ PASS: PUT /api/recipes/:id - Recipe creator successfully updates recipe (200 OK)
  ✔ PASS: PUT /api/recipes/:id - Non-owner user blocked with 403 Forbidden
  ✔ PASS: DELETE /api/recipes/:id - Non-owner user deletion blocked with 403 Forbidden
  ✔ PASS: DELETE /api/recipes/:id - Recipe creator deletes recipe (200 OK)
  ✔ PASS: GET /api/recipes/:id - Confirms deleted recipe returns 404 Not Found
  ✔ PASS: GET /api/unknown-endpoint - Centralized 404 handler returns standardized JSON
  ✔ PASS: GET / - Serves connected frontend index.html with 200 OK

========================================
  Summary: 24/24 tests passed (0 failed)
========================================
```

### Measured Performance Benchmark

Measured under 50 consecutive HTTP requests to `GET /api/recipes` with indexed database lookups:

- **Total Requests Evaluated**: 50
- **Average Latency**: **3.52 ms**
- **p95 Latency**: **4.98 ms**
- **Minimum Latency**: **2.57 ms**
- **Maximum Latency**: **6.21 ms**

*(All metrics reflect real, unmanipulated measurements generated by `backend/tests/api.test.js`).*

---

## Deployment Guide (Render)

This application is architected for zero-configuration, single-service deployment on [Render](https://render.com/).

### Step 1: Provision MongoDB Atlas Cluster
1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free **M0 Sandbox** cluster.
3. Under **Database Access**, create a database user and record the username and password.
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** -> **Drivers** -> copy your connection URI string.

### Step 2: Deploy Web Service on Render
1. Push your repository to GitHub: `https://github.com/yuvraj-05828/FEWD-CA-3`.
2. Log into [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3. Select your repository `FEWD-CA-3`.
4. Fill in the deployment settings:
   - **Name**: `cook-recipe-api`
   - **Region**: Closest to you (e.g., Singapore, Frankfurt, Ohio)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank to build from root)*
   - **Runtime**: `Node`
   - **Build Command**: `npm --prefix backend install`
   - **Start Command**: `node backend/server.js`
   - **Plan**: `Free`

### Step 3: Add Environment Variables in Render
In the **Environment Variables** tab on Render, add:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` *(or leave default, Render sets this automatically)* |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/cook_recipe_db?retryWrites=true&w=majority` |
| `JWT_SECRET` | *(generate a strong 32+ character random string)* |
| `JWT_EXPIRE` | `7d` |
| `CLIENT_URL` | `*` *(or your Render service domain URL)* |

Click **Create Web Service**. Render will install dependencies, connect to MongoDB Atlas, and deploy the application.

---

## Live Demo & Repository

- **GitHub Repository**: [https://github.com/yuvraj-05828/FEWD-CA-3](https://github.com/yuvraj-05828/FEWD-CA-3)
- **Live Deployment URL**: [https://fewd-ca-3.onrender.com/](https://fewd-ca-3.onrender.com/)

---

## License

This project is licensed under the ISC License.