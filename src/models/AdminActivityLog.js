const { db, saveDatabase } = require('../config/db');

class AdminActivityLog {
  static async find(filter = {}) {
    let results = [...(db.admin_activity_logs || [])];
    if (filter.module) {
      results = results.filter((l) => l.module === filter.module);
    }
    if (filter.admin_id) {
      results = results.filter((l) => l.admin_id === filter.admin_id);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (l) =>
          (l.admin_name && l.admin_name.toLowerCase().includes(q)) ||
          (l.action && l.action.toLowerCase().includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q)) ||
          (l.module && l.module.toLowerCase().includes(q))
      );
    }
    return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async log({ admin_id, admin_name, action, module, details, ip_address }) {
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      admin_id: admin_id || 'ADMIN_SYSTEM',
      admin_name: admin_name || 'System Operator',
      action: action || 'ADMIN_ACTION',
      module: module || 'SYSTEM',
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      ip_address: ip_address || '127.0.0.1',
      created_at: new Date().toISOString(),
    };
    db.admin_activity_logs.push(newLog);
    saveDatabase();
    return newLog;
  }
}

module.exports = AdminActivityLog;
