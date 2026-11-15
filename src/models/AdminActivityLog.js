const { db } = require('../config/db');

class AdminActivityLog {
  static async record({ adminId, action, targetType = 'USER', targetId = null, details = '', ipAddress = '127.0.0.1' }) {
    const entry = {
      id: `log_adm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      createdAt: new Date().toISOString(),
    };

    db.admin_activity_logs.push(entry);
    return entry;
  }

  static async getRecent(limit = 50) {
    return [...db.admin_activity_logs].reverse().slice(0, limit);
  }
}

module.exports = AdminActivityLog;
