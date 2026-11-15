const bcrypt = require('bcryptjs');
const ROLES = require('../constants/roles');
const config = require('../config/config');

// In-Memory Data Store with Persistent-Ready Structure
// Easily swappable with MongoDB / Mongoose or PostgreSQL / Sequelize
const db = {
  users: [],
  products: [],
  orders: [],
  carts: {},
};

// Seed initial database records
const seedDatabase = async () => {
  const adminHashedPassword = await bcrypt.hash(config.adminSeed.password, 10);
  const userHashedPassword = await bcrypt.hash('UserSecure123!', 10);

  // Seed Admin and Demo User
  db.users = [
    {
      id: 'usr_admin_001',
      name: config.adminSeed.name,
      email: config.adminSeed.email,
      password: adminHashedPassword,
      role: ROLES.ADMIN,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_customer_001',
      name: 'John Doe',
      email: 'john@example.com',
      password: userHashedPassword,
      role: ROLES.USER,
      createdAt: new Date().toISOString(),
    },
  ];

  // Seed Initial Sneaker Catalog for Neleeri Sneakers
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

  // Seed sample initial order
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

  console.log('✅ Neleeri Sneakers Database Initialized with Seed Data.');
};

module.exports = {
  db,
  seedDatabase,
};
