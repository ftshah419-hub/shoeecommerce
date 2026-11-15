const { db } = require('../config/db');

class User {
  static normalize(user) {
    if (!user) return null;
    return {
      id: user.id,
      full_name: user.full_name || user.name || 'Neleeri Member',
      name: user.full_name || user.name || 'Neleeri Member',
      email: user.email,
      password_hash: user.password_hash || user.password || '',
      phone: user.phone || '+91 98200 12345',
      profile_image:
        user.profile_image ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      account_status: user.account_status || 'ACTIVE',
      email_verified: user.email_verified !== undefined ? user.email_verified : true,
      phone_verified: user.phone_verified !== undefined ? user.phone_verified : true,
      role: user.role || 'user',
      created_at: user.created_at || user.createdAt || new Date().toISOString(),
      createdAt: user.created_at || user.createdAt || new Date().toISOString(),
      updated_at: user.updated_at || user.updatedAt || new Date().toISOString(),
      deleted_at: user.deleted_at || null,
    };
  }

  static async find() {
    return (db.users || []).map((u) => {
      const normalized = this.normalize(u);
      const { password_hash, password, ...rest } = normalized;
      return rest;
    });
  }

  static async findById(id) {
    const user = (db.users || []).find((u) => String(u.id) === String(id));
    return user ? this.normalize(user) : null;
  }

  static async findByEmail(email) {
    if (!email) return null;
    const user = (db.users || []).find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
    return user ? this.normalize(user) : null;
  }

  static async create(userData) {
    const id = userData.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const full_name = userData.full_name || userData.name || 'Neleeri Member';
    const newUser = {
      id,
      full_name,
      name: full_name,
      email: userData.email,
      password: userData.password || userData.password_hash,
      password_hash: userData.password_hash || userData.password,
      phone: userData.phone || '',
      profile_image:
        userData.profile_image ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      account_status: userData.account_status || 'ACTIVE',
      email_verified: userData.email_verified !== undefined ? userData.email_verified : false,
      phone_verified: userData.phone_verified !== undefined ? userData.phone_verified : false,
      role: userData.role || 'user',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    if (!db.users) db.users = [];
    db.users.push(newUser);
    return this.normalize(newUser);
  }

  static async update(id, updateData) {
    if (!db.users) return null;
    const index = db.users.findIndex((u) => String(u.id) === String(id));
    if (index === -1) return null;

    const existing = db.users[index];
    const full_name = updateData.full_name || updateData.name || existing.full_name || existing.name;

    db.users[index] = {
      ...existing,
      ...updateData,
      full_name,
      name: full_name,
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.normalize(db.users[index]);
  }

  static async delete(id) {
    if (!db.users) return false;
    const index = db.users.findIndex((u) => String(u.id) === String(id));
    if (index === -1) return false;
    db.users.splice(index, 1);
    return true;
  }
}

module.exports = User;
