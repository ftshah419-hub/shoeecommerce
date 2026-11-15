const { db } = require('../config/db');

class User {
  /**
   * Normalize phone number to standard format
   */
  static normalizePhone(phone) {
    if (!phone) return null;
    return String(phone).replace(/[\s\-\(\)]/g, '').trim();
  }

  /**
   * Normalize user data for consistent frontend and backend usage
   */
  static normalize(user) {
    if (!user) return null;
    const firstName = user.firstName || (user.name ? user.name.split(' ')[0] : 'Neleeri');
    const lastName = user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : 'Member');
    const fullName = user.full_name || user.name || `${firstName} ${lastName}`.trim();

    return {
      id: user.id,
      firstName,
      lastName,
      full_name: fullName,
      name: fullName,
      email: user.email ? user.email.trim().toLowerCase() : '',
      phone: user.phone ? User.normalizePhone(user.phone) : '+91 98200 12345',
      password: user.password || user.password_hash || '',
      password_hash: user.password_hash || user.password || '',
      profile_image:
        user.profile_image ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      shoeSize: user.shoeSize ? Number(user.shoeSize) : null,
      marketingOptIn: Boolean(user.marketingOptIn),
      termsAgreed: user.termsAgreed !== undefined ? Boolean(user.termsAgreed) : true,
      status: user.status || user.account_status || 'active',
      account_status: user.account_status || user.status || 'ACTIVE',
      email_verified: user.email_verified !== undefined ? user.email_verified : (user.emailVerified !== undefined ? user.emailVerified : true),
      emailVerified: user.emailVerified !== undefined ? user.emailVerified : (user.email_verified !== undefined ? user.email_verified : true),
      phone_verified: user.phone_verified !== undefined ? user.phone_verified : (user.phoneVerified !== undefined ? user.phoneVerified : true),
      phoneVerified: user.phoneVerified !== undefined ? user.phoneVerified : (user.phone_verified !== undefined ? user.phone_verified : true),
      role: user.role || 'user',
      created_at: user.created_at || user.createdAt || new Date().toISOString(),
      createdAt: user.created_at || user.createdAt || new Date().toISOString(),
      updated_at: user.updated_at || user.updatedAt || new Date().toISOString(),
      updatedAt: user.updated_at || user.updatedAt || new Date().toISOString(),
      deleted_at: user.deleted_at || null,
    };
  }

  /**
   * Return all users without sensitive passwords
   */
  static async find() {
    return (db.users || []).map((u) => {
      const normalized = this.normalize(u);
      const { password_hash, password, ...rest } = normalized;
      return rest;
    });
  }

  /**
   * Find a user by primary key ID
   */
  static async findById(id) {
    if (!id) return null;
    const user = (db.users || []).find((u) => String(u.id) === String(id));
    return user ? this.normalize(user) : null;
  }

  /**
   * Find a user by email address (case-insensitive)
   */
  static async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const user = (db.users || []).find((u) => u.email && u.email.toLowerCase() === cleanEmail);
    return user ? this.normalize(user) : null;
  }

  /**
   * Find a user by mobile phone number
   */
  static async findByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = User.normalizePhone(phone);
    const user = (db.users || []).find((u) => u.phone && User.normalizePhone(u.phone) === cleanPhone);
    return user ? this.normalize(user) : null;
  }

  /**
   * Find a user by either email OR mobile phone number
   */
  static async findByIdentifier(identifier) {
    if (!identifier) return null;
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return User.findByEmail(trimmed);
    }
    const byPhone = await User.findByPhone(trimmed);
    if (byPhone) return byPhone;
    return User.findByEmail(trimmed);
  }

  /**
   * Create a new user record with standard defaults
   */
  static async create(userData) {
    const firstName = userData.firstName || (userData.name || userData.full_name ? (userData.name || userData.full_name).split(' ')[0] : 'Neleeri');
    const lastName = userData.lastName || (userData.name || userData.full_name ? (userData.name || userData.full_name).split(' ').slice(1).join(' ') : 'Member');
    const fullName = userData.full_name || userData.name || `${firstName} ${lastName}`.trim();
    const password = userData.password || userData.password_hash || '';

    const newUser = {
      id: userData.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      firstName,
      lastName,
      full_name: fullName,
      name: fullName,
      email: userData.email ? userData.email.trim().toLowerCase() : '',
      phone: userData.phone ? User.normalizePhone(userData.phone) : null,
      password,
      password_hash: password,
      role: userData.role || 'user',
      profile_image:
        userData.profile_image ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      shoeSize: userData.shoeSize ? Number(userData.shoeSize) : null,
      marketingOptIn: Boolean(userData.marketingOptIn),
      termsAgreed: userData.termsAgreed !== undefined ? Boolean(userData.termsAgreed) : true,
      status: userData.status || userData.account_status || 'active',
      account_status: userData.account_status || userData.status || 'ACTIVE',
      emailVerified: userData.emailVerified !== undefined ? Boolean(userData.emailVerified) : (userData.email_verified !== undefined ? Boolean(userData.email_verified) : false),
      email_verified: userData.email_verified !== undefined ? Boolean(userData.email_verified) : (userData.emailVerified !== undefined ? Boolean(userData.emailVerified) : false),
      phoneVerified: userData.phoneVerified !== undefined ? Boolean(userData.phoneVerified) : (userData.phone_verified !== undefined ? Boolean(userData.phone_verified) : false),
      phone_verified: userData.phone_verified !== undefined ? Boolean(userData.phone_verified) : (userData.phoneVerified !== undefined ? Boolean(userData.phoneVerified) : false),
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    if (!db.users) db.users = [];
    db.users.push(newUser);
    return this.normalize(newUser);
  }

  /**
   * Update an existing user by ID
   */
  static async update(id, updateData) {
    if (!db.users) return null;
    const index = db.users.findIndex((u) => String(u.id) === String(id));
    if (index === -1) return null;

    const current = db.users[index];
    const firstName = updateData.firstName !== undefined ? updateData.firstName : current.firstName;
    const lastName = updateData.lastName !== undefined ? updateData.lastName : current.lastName;
    const fullName = updateData.full_name || updateData.name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : (current.full_name || current.name));

    db.users[index] = {
      ...current,
      ...updateData,
      firstName: firstName || current.firstName,
      lastName: lastName || current.lastName,
      full_name: fullName,
      name: fullName,
      phone: updateData.phone ? User.normalizePhone(updateData.phone) : current.phone,
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.normalize(db.users[index]);
  }

  /**
   * Delete a user by ID
   */
  static async delete(id) {
    if (!db.users) return false;
    const index = db.users.findIndex((u) => String(u.id) === String(id));
    if (index === -1) return false;
    db.users.splice(index, 1);
    return true;
  }
}

module.exports = User;