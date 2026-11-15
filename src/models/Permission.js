const { db } = require('../config/db');

class Permission {
  static async find() {
    return db.permissions || [];
  }

  static async findById(id) {
    return (db.permissions || []).find((p) => p.id === id || p.permission_name === id) || null;
  }
}

module.exports = Permission;
