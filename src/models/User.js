const { db } = require('../config/db');

class User {
  /**
   * Normalize phone number to standard format
   */
  static normalizePhone(phone) {
    if (!phone) return null;
    return phone.replace(/[\s\-\(\)]/g, '').trim();
  }

  /**
   * Return all users without their sensitive passwords
   */
  static async find() {
    return db.users.map(({ password, ...userWithoutPass }) => userWithoutPass);
  }

  /**
   * Find a user by primary key ID
   */
  static async findById(id) {
    if (!id) return null;
    return db.users.find((u) => u.id === id) || null;
  }

  /**
   * Find a user by email address (case-insensitive)
   */
  static async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return db.users.find((u) => u.email && u.email.toLowerCase() === cleanEmail) || null;
  }

  /**
   * Find a user by mobile phone number
   */
  static async findByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = User.normalizePhone(phone);
    return db.users.find((u) => u.phone && User.normalizePhone(u.phone) === cleanPhone) || null;
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
    // Check by phone first, fallback to email in case of unconventional format
    const byPhone = await User.findByPhone(trimmed);
    if (byPhone) return byPhone;
    return User.findByEmail(trimmed);
  }

  /**
   * Create a new user record with standard defaults
   */
  static async create(userData) {
    const firstName = userData.firstName || (userData.name ? userData.name.split(' ')[0] : 'Sneaker');
    const lastName = userData.lastName || (userData.name ? userData.name.split(' ').slice(1).join(' ') : 'Collector');
    const fullName = userData.name || `${firstName} ${lastName}`.trim();

    const newUser = {
      id: userData.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      firstName,
      lastName,
      name: fullName,
      email: userData.email ? userData.email.trim().toLowerCase() : '',
      phone: userData.phone ? User.normalizePhone(userData.phone) : null,
      password: userData.password,
      role: userData.role || 'user',
      shoeSize: userData.shoeSize ? Number(userData.shoeSize) : null,
      marketingOptIn: Boolean(userData.marketingOptIn),
      termsAgreed: userData.termsAgreed !== undefined ? Boolean(userData.termsAgreed) : true,
      status: userData.status || 'active', // 'active', 'inactive', 'suspended'
      emailVerified: Boolean(userData.emailVerified),
      phoneVerified: Boolean(userData.phoneVerified),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    return newUser;
  }

  /**
   * Update an existing user by ID
   */
  static async update(id, updateData) {
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const current = db.users[index];
    const firstName = updateData.firstName !== undefined ? updateData.firstName : current.firstName;
    const lastName = updateData.lastName !== undefined ? updateData.lastName : current.lastName;
    const name = updateData.name !== undefined ? updateData.name : (firstName && lastName ? `${firstName} ${lastName}` : current.name);

    db.users[index] = {
      ...current,
      ...updateData,
      firstName,
      lastName,
      name,
      phone: updateData.phone ? User.normalizePhone(updateData.phone) : current.phone,
      updatedAt: new Date().toISOString(),
    };

    return db.users[index];
  }

  /**
   * Delete a user by ID
   */
  static async delete(id) {
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    db.users.splice(index, 1);
    return true;
  }
}

module.exports = User;
