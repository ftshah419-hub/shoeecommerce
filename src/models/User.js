const { db } = require('../config/db');

class User {
  static async find() {
    return db.users.map(({ password, ...userWithoutPass }) => userWithoutPass);
  }

  static async findById(id) {
    return db.users.find((u) => u.id === id) || null;
  }

  static async findByEmail(email) {
    if (!email) return null;
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async create(userData) {
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      ...userData,
    };
    db.users.push(newUser);
    return newUser;
  }

  static async update(id, updateData) {
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    db.users[index] = { ...db.users[index], ...updateData, updatedAt: new Date().toISOString() };
    return db.users[index];
  }

  static async delete(id) {
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    db.users.splice(index, 1);
    return true;
  }
}

module.exports = User;
