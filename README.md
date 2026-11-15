# 👟 Neleeri Sneakers — Architecture & E-Commerce Platform

A production-ready, modular E-Commerce web application for **Neleeri Sneakers**, built with Node.js, Express, EJS, and the **MVC (Model-View-Controller) + Service Layer Architecture Pattern**.

---

## 🏛️ Architectural Design: MVC + Service Layer

In standard MVC, controllers often become bloated with business logic, database queries, and external API calls. This project solves that by introducing an explicit **Service Layer**:

```
                                  ┌────────────────────────┐
                                  │   Browser / Client     │
                                  └───────────┬────────────┘
                                              │ HTTP Request
                                              ▼
                                  ┌────────────────────────┐
                                  │   Route & Middleware   │ (Auth & Role RBAC)
                                  └───────────┬────────────┘
                                              │ Clean params / body
                                              ▼
                                  ┌────────────────────────┐
                                  │       Controller       │ (Request orchestration)
                                  └───────────┬────────────┘
                                              │ Business invocation
                                              ▼
                                  ┌────────────────────────┐
                                  │     Service Layer      │ (Business logic, pricing, rules)
                                  └───────────┬────────────┘
                                              │ Query / Mutation
                                              ▼
                                  ┌────────────────────────┐
                                  │      Model Layer       │ (User, Product, Order schemas)
                                  └───────────┬────────────┘
                                              │ Data persistence
                                              ▼
                                  ┌────────────────────────┐
                                  │ Database / Data Store  │
                                  └────────────────────────┘
```

### Why this architecture?
1. **Separation of Concerns**: Controllers only handle HTTP (headers, cookies, status codes). Services handle pure business logic and can be reused in REST APIs, CLI jobs, or unit tests.
2. **Role-Based Access Control (RBAC)**: Strict segregation between standard customers (`user`) and store managers (`admin`).
3. **Extensibility**: The database layer is encapsulated behind Model interfaces, making migration to MongoDB (Mongoose), PostgreSQL (Sequelize/Prisma), or MySQL effortless.

---

## 📂 Project Directory Structure

```
Neleeri Sneakers/
├── .env                  # Local environment configuration (ignored by git)
├── .env.example          # Template for required environment variables
├── .gitignore            # Git exclusion rules (node_modules, .env, uploads, logs)
├── package.json          # NPM scripts and project dependencies
├── README.md             # Architecture and developer documentation
└── src/
    ├── app.js            # Express app configuration, middleware mounting
    ├── server.js         # HTTP server entrypoint & DB seed bootstrap
    ├── config/
    │   ├── config.js     # Centralized environment variable loader & defaults
    │   └── db.js         # Database connection & seed data initialization
    ├── constants/
    │   ├── roles.js      # System roles (ADMIN, USER)
    │   └── orderStatus.js# Order lifecycles (PENDING, PROCESSING, SHIPPED, etc.)
    ├── models/
    │   ├── User.js       # User entity operations (CRUD, findByEmail)
    │   ├── Product.js    # Sneaker catalog entity & filtering
    │   └── Order.js      # Orders & inventory state
    ├── services/
    │   ├── authService.js    # Registration, hashing, JWT token issue, login verification
    │   ├── userService.js    # Cart manipulation, customer profile, customer orders
    │   ├── productService.js # Sneaker catalog retrieval, filtering, creation, deletion
    │   ├── orderService.js   # Cart checkout, stock decrement, order generation
    │   └── adminService.js   # Store KPI analytics, role promotion, order processing
    ├── controllers/
    │   ├── authController.js    # Login, register, logout handlers & cookie management
    │   ├── userController.js    # Storefront pages, catalog filtering, cart, profile
    │   └── adminController.js   # Admin dashboard, inventory management, user oversight
    ├── routes/
    │   ├── index.js          # Root router aggregating all sub-routes
    │   ├── authRoutes.js     # /auth/login, /auth/register, /auth/logout
    │   ├── userRoutes.js     # /, /products, /cart, /checkout, /profile
    │   └── adminRoutes.js    # /admin/dashboard, /admin/products, /admin/orders, /admin/users
    ├── middlewares/
    │   ├── authMiddleware.js # Extracts JWT, populates req.user & res.locals.currentUser
    │   ├── roleMiddleware.js # authorizeRoles('admin') route guard
    │   └── errorHandler.js   # 404 handler and global exception boundary
    ├── utils/
    │   ├── jwt.js            # JWT signing and verification
    │   └── password.js       # Bcrypt hash and password comparison helpers
    ├── views/
    │   ├── partials/
    │   │   ├── header.ejs        # Global shared <head>
    │   │   ├── navbar.ejs        # Shared top navigation
    │   │   ├── footer.ejs        # Shared footer
    │   │   ├── user-header.ejs   # User Frontend <head> with user.css
    │   │   ├── user-footer.ejs   # User Frontend footer with user-frontend.js
    │   │   ├── admin-header.ejs  # Admin Frontend <head> with admin.css
    │   │   ├── admin-sidebar.ejs # Admin Frontend reusable navigation card
    │   │   └── admin-footer.ejs  # Admin Frontend footer with admin-frontend.js
    │   ├── auth/
    │   │   ├── login.ejs         # Authentication screen with demo credentials hint
    │   │   └── register.ejs      # New account registration form
    │   ├── user/
    │   │   ├── home.ejs           # Landing page with featured sneakers
    │   │   ├── products.ejs       # Catalog with live search & filters
    │   │   ├── product-detail.ejs # Shoe size selector and add-to-bag
    │   │   ├── cart.ejs           # Shopping bag summary & shipping checkout
    │   │   └── profile.ejs        # Customer profile & previous orders
    │   ├── admin/
    │   │   ├── dashboard.ejs     # Revenue, order counts, product metrics
    │   │   ├── products.ejs      # Add sneaker model, image preview, manage inventory & delete
    │   │   ├── orders.ejs        # Order status transition manager (PROCESSING -> SHIPPED)
    │   │   └── users.ejs         # User accounts and role promotion (User <-> Admin)
    │   └── error.ejs             # Centralized styled error and 404 page
    └── public/
        ├── css/
        │   ├── style.css         # Global core theme variables & reset
        │   ├── user.css          # Dedicated User Frontend styles (Sneaker showcase, pills, cart)
        │   └── admin.css         # Dedicated Admin Frontend styles (Dashboards, KPI metrics, tables)
        ├── js/
        │   ├── main.js           # Shared utilities & alert dismisser
        │   ├── user-frontend.js  # Dedicated User Frontend JS (Size selector, live search, qty adjuster)
        │   └── admin-frontend.js # Dedicated Admin Frontend JS (Live image preview, table search, delete guards)
        └── uploads/
            └── .gitkeep          # Preserves uploads folder in git while ignoring files
```

---

## 🔑 Authentication & Authorization (Admin vs User)

### 1. Token & Session Management
- Passwords are securely hashed using **bcrypt** with 10 salt rounds.
- Sessions are maintained using signed **JWT tokens** stored in HTTP-only cookies (`token`), with automatic fallbacks for `Authorization: Bearer <token>` API consumers.
- `checkCurrentUser` middleware runs on every request:
  - If a valid token is present, it decodes user identity and attaches it to `req.user` and `res.locals.currentUser`.
  - Templates can conditionally render navigation items (e.g. `Admin Dashboard` button only appears for `role === 'admin'`).

### 2. Route Protection
- **`requireAuth`**: Redirects unauthenticated visitors to `/auth/login?redirect=<url>`.
- **`authorizeRoles('admin')`**: Enforces strict role validation. If a regular customer accesses `/admin/*`, they receive an HTTP 403 Forbidden error page.

### 3. Pre-Seeded Accounts

| Role | Email | Password |
|---|---|---|
| 🛡️ **Admin** | `admin@neleerisneakers.com` | `AdminSecurePassword123!` |
| 👤 **User** | `john@example.com` | `UserSecure123!` |

*(You can customize these defaults in `.env`)*

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` (already done by default):
```bash
cp .env.example .env
```

### 3. Run the Development Server
```bash
npm run dev
# or standard start:
npm start
```

Open your browser at: **[http://localhost:3000](http://localhost:3000)**

---

## 🧭 Routes Reference

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | Storefront homepage with featured sneakers |
| `GET` | `/products` | Public | Full catalog with category and search filtering |
| `GET` | `/products/:id` | Public | Sneaker details & size selector |
| `GET` | `/cart` | Public / User | Shopping bag view |
| `POST` | `/cart/add` | Public / User | Add sneaker and size to bag |
| `POST` | `/cart/remove` | Public / User | Remove item from bag |
| `POST` | `/checkout` | User (Auth) | Place order & deduct inventory stock |
| `GET` | `/profile` | User (Auth) | View user details & order history |
| `GET` | `/auth/login` | Guest | Login page |
| `POST` | `/auth/login` | Guest | Process authentication credentials |
| `GET` | `/auth/register` | Guest | Registration page |
| `POST` | `/auth/register` | Guest | Create new user account |
| `GET` | `/auth/logout` | User / Admin | Clear session cookie & redirect |
| `GET` | `/admin/dashboard` | Admin Only | Analytics, store revenue & summary |
| `GET` | `/admin/products` | Admin Only | Inventory management & new sneaker form |
| `POST` | `/admin/products` | Admin Only | Create new sneaker drop |
| `POST` | `/admin/products/:id/delete` | Admin Only | Remove sneaker model |
| `GET` | `/admin/orders` | Admin Only | All store customer orders |
| `POST` | `/admin/orders/:id/status`| Admin Only | Update status (PROCESSING, SHIPPED, etc.) |
| `GET` | `/admin/users` | Admin Only | View users & toggle roles (Admin / User) |

---

## 🔌 Connecting a Real Database (MongoDB or PostgreSQL)

Currently, the models (`src/models/User.js`, `src/models/Product.js`, `src/models/Order.js`) use an asynchronous repository interface backed by seeded data so you can run the project instantly without database prerequisites.

To connect to **MongoDB with Mongoose**:
1. Run `npm install mongoose`
2. In `src/config/db.js`, add `mongoose.connect(process.env.DB_URI)`
3. Replace the static methods in `src/models/*.js` with Mongoose Schemas.
Because your **Controllers** only call **Services**, and your **Services** only call **Models**, your controller and UI code will remain completely untouched!
