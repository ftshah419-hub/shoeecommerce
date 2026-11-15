const { db, saveDatabase } = require('../config/db');

class User {
  static async find(filter = {}) {
    let users = [...db.users];

    if (filter.role) {
      users = users.filter((u) => u.role === filter.role);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      users = users.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.full_name && u.full_name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.toLowerCase().includes(q)) ||
          (u.squad_uid && u.squad_uid.toLowerCase().includes(q))
      );
    }

    if (filter.account_status) {
      users = users.filter((u) => u.account_status === filter.account_status);
    }

    return users.map(({ password, ...userWithoutPass }) => userWithoutPass);
  }

  static async findById(id, includePassword = false) {
    const user = db.users.find((u) => u.id === id);
    if (!user) return null;
    if (includePassword) return user;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  static async findByEmail(email, includePassword = true) {
    if (!email) return null;
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (includePassword) return user;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  static async create(userData) {
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      full_name: userData.name || userData.full_name || 'Sneaker Squad Member',
      name: userData.name || userData.full_name || 'Sneaker Squad Member',
      account_status: userData.account_status || 'ACTIVE',
      squad_tier: userData.squad_tier || 'Lvl 1 Initiate',
      squad_uid: `SQ-NL-${Math.floor(1000 + Math.random() * 9000)}`,
      email_verified: Boolean(userData.email_verified),
      phone_verified: Boolean(userData.phone_verified),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...userData,
    };
    db.users.push(newUser);
    saveDatabase();
    return newUser;
  }

  static async update(id, updateData) {
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    db.users[index] = {
      ...db.users[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    saveDatabase();
    return db.users[index];
  }

  static async delete(id) {
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    db.users.splice(index, 1);
    saveDatabase();
    return true;
  }

  static async count(filter = {}) {
    const results = await this.find(filter);
    return results.length;
  }
}

module.exports = User;
