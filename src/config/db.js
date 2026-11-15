const bcrypt = require('bcryptjs');
const ROLES = require('../constants/roles');
const config = require('../config/config');

// In-Memory Data Store representing all relational tables from ER Diagram
// Source of truth matching PostgreSQL / MySQL / MongoDB architecture
const db = {
  // Authentication & User Management Tables
  users: [],
  user_sessions: [],
  login_logs: [],
  social_accounts: [],
  email_verifications: [],
  otp_verifications: [],
  password_resets: [],

  // RBAC Role & Permission Tables
  roles: [],
  user_roles: [],
  permissions: [],
  role_permissions: [],

  // Administration Tables
  admin_activity_logs: [],

  // E-Commerce Domain Tables
  products: [],
  orders: [],
  carts: {},
};

// Seed initial database records
const seedDatabase = async () => {
  const adminHashedPassword = await bcrypt.hash(config.adminSeed.password, 10);
  const userHashedPassword = await bcrypt.hash('UserSecure123!', 10);

  // 1. Seed Roles
  db.roles = [
    {
      id: 'role_admin',
      name: ROLES.ADMIN,
      description: 'Store Administrator with full operational management privileges',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'role_customer',
      name: ROLES.USER,
      description: 'Standard retail customer with ordering, profile, and bag access',
      createdAt: new Date().toISOString(),
    },
  ];

  // 2. Seed Granular Permissions
  db.permissions = [
    { id: 'perm_manage_products', name: 'manage_products', description: 'Create, edit, and delete sneakers' },
    { id: 'perm_manage_orders', name: 'manage_orders', description: 'View, process, and update customer order status' },
    { id: 'perm_manage_users', name: 'manage_users', description: 'View customer accounts and promote roles' },
    { id: 'perm_view_analytics', name: 'view_analytics', description: 'Access financial KPI metrics and dashboard' },
    { id: 'perm_customer_checkout', name: 'customer_checkout', description: 'Place sneaker orders and checkout cart' },
    { id: 'perm_manage_profile', name: 'manage_profile', description: 'Update customer personal profile and addresses' },
  ];

  // 3. Seed Role-Permissions Mapping
  db.role_permissions = [
    // Admin gets all permissions
    { id: 'rp_01', roleId: 'role_admin', permissionId: 'perm_manage_products' },
    { id: 'rp_02', roleId: 'role_admin', permissionId: 'perm_manage_orders' },
    { id: 'rp_03', roleId: 'role_admin', permissionId: 'perm_manage_users' },
    { id: 'rp_04', roleId: 'role_admin', permissionId: 'perm_view_analytics' },
    { id: 'rp_05', roleId: 'role_admin', permissionId: 'perm_customer_checkout' },
    { id: 'rp_06', roleId: 'role_admin', permissionId: 'perm_manage_profile' },
    // Customer permissions
    { id: 'rp_07', roleId: 'role_customer', permissionId: 'perm_customer_checkout' },
    { id: 'rp_08', roleId: 'role_customer', permissionId: 'perm_manage_profile' },
  ];

  // 4. Seed Admin and Demo Customer Accounts
  db.users = [
    {
      id: 'usr_admin_001',
      firstName: 'Sneakers',
      lastName: 'SuperAdmin',
      name: config.adminSeed.name,
      email: config.adminSeed.email.toLowerCase(),
      phone: '+15550000001',
      password: adminHashedPassword,
      role: ROLES.ADMIN,
      shoeSize: 10.5,
      marketingOptIn: true,
      termsAgreed: true,
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_customer_001',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+15550000002',
      password: userHashedPassword,
      role: ROLES.USER,
      shoeSize: 10,
      marketingOptIn: false,
      termsAgreed: true,
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 5. Seed User-Roles Mapping
  db.user_roles = [
    { id: 'ur_001', userId: 'usr_admin_001', roleId: 'role_admin', createdAt: new Date().toISOString() },
    { id: 'ur_002', userId: 'usr_customer_001', roleId: 'role_customer', createdAt: new Date().toISOString() },
  ];

  // 6. Seed Initial Sneaker Catalog for Neleeri Sneakers
  db.products = [
    {
      id: 'snk_001',
      name: 'Neleeri Air Velocity 90',
      brand: 'Neleeri Lab',
      category: 'Running',
      price: 159.99,
      sizes: [7, 8, 9, 10, 11, 12],
      stock: 35,
      description: 'Engineered with responsive dual-density foam and breathable mesh upper for supreme comfort on any track.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      featured: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'snk_002',
      name: 'Neleeri Stealth Shadow Pro',
      brand: 'Neleeri Black',
      category: 'Streetwear',
      price: 189.99,
      sizes: [8, 9, 10, 11],
      stock: 20,
      description: 'Triple-black monochromatic silhouette featuring water-resistant ballistic textile and carbon-fiber shank.',
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      featured: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'snk_003',
      name: 'Neleeri Retro Court High',
      brand: 'Neleeri Heritage',
      category: 'Basketball',
      price: 139.99,
      sizes: [7.5, 8.5, 9.5, 10.5, 11.5],
      stock: 14,
      description: 'Vintage premium leather basketball high-top with padded collars and durable rubber cupsole.',
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
      featured: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'snk_004',
      name: 'Neleeri CloudSprint Elite',
      brand: 'Neleeri Lab',
      category: 'Running',
      price: 174.50,
      sizes: [8, 9, 10, 11, 12],
      stock: 28,
      description: 'Ultralight running shoe tuned for marathons and fast paced daily road training.',
      image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
      featured: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'snk_005',
      name: 'Neleeri Canvas Urban Glide',
      brand: 'Neleeri Casual',
      category: 'Casual',
      price: 89.99,
      sizes: [7, 8, 9, 10, 11],
      stock: 45,
      description: 'Everyday slip-on crafted with organic heavy cotton canvas and recycled rubber outsoles.',
      image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
      featured: false,
      createdAt: new Date().toISOString(),
    },
  ];

  // 7. Seed sample initial order
  db.orders = [
    {
      id: 'ord_1001',
      userId: 'usr_customer_001',
      userEmail: 'john@example.com',
      userName: 'John Doe',
      items: [
        {
          productId: 'snk_001',
          name: 'Neleeri Air Velocity 90',
          price: 159.99,
          size: 10,
          quantity: 1,
        },
      ],
      totalAmount: 159.99,
      shippingAddress: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
      },
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
    },
  ];

  // 8. Seed Admin Activity Log
  db.admin_activity_logs = [
    {
      id: 'log_adm_init',
      adminId: 'usr_admin_001',
      action: 'SYSTEM_BOOTSTRAP',
      targetType: 'SYSTEM',
      targetId: 'SYS_INIT',
      details: 'Neleeri Sneakers Authentication Subsystem initialized with seeded RBAC',
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    },
  ];

  console.log('✅ Neleeri Sneakers Database Initialized with Full Authentication Schema & Seed Data.');
};

module.exports = {
  db,
  seedDatabase,
};
