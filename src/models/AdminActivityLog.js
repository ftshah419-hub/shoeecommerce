const { db, saveDatabase } = require('../config/db');

class AdminActivityLog {
  /**
   * Filter and query activity logs
   */
  static async find(filter = {}) {
    let results = [...(db.admin_activity_logs || [])];
    if (filter.module) {
      results = results.filter((l) => l.module === filter.module);
    }
    if (filter.admin_id || filter.adminId) {
      const targetAdmin = filter.admin_id || filter.adminId;
      results = results.filter((l) => l.admin_id === targetAdmin || l.adminId === targetAdmin);
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
    return results.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
  }

  /**
   * Record a new log entry (Admin branch convention)
   */
  static async log({ admin_id, adminId, admin_name, action, module, details, ip_address, ipAddress }) {
    const aid = admin_id || adminId || 'ADMIN_SYSTEM';
    const ip = ip_address || ipAddress || '127.0.0.1';
    const now = new Date().toISOString();

    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      admin_id: aid,
      adminId: aid,
      admin_name: admin_name || 'System Operator',
      action: action || 'ADMIN_ACTION',
      module: module || 'SYSTEM',
      targetType: 'SYSTEM',
      targetId: null,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
      ip_address: ip,
      ipAddress: ip,
      created_at: now,
      createdAt: now,
    };

    if (!db.admin_activity_logs) db.admin_activity_logs = [];
    db.admin_activity_logs.push(newLog);
    if (typeof saveDatabase === 'function') saveDatabase();
    return newLog;
  }

  /**
   * Record a new log entry (Main branch convention)
   */
  static async record({ adminId, admin_id, action, targetType = 'USER', targetId = null, details = '', ipAddress = '127.0.0.1', ip_address }) {
    const aid = adminId || admin_id || 'ADMIN_SYSTEM';
    const ip = ipAddress || ip_address || '127.0.0.1';
    const now = new Date().toISOString();

    const entry = {
      id: `log_adm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      admin_id: aid,
      adminId: aid,
      admin_name: 'Administrator',
      action: action || 'ADMIN_ACTION',
      module: 'ADMINISTRATION',
      targetType,
      targetId,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
      ip_address: ip,
      ipAddress: ip,
      created_at: now,
      createdAt: now,
    };

    if (!db.admin_activity_logs) db.admin_activity_logs = [];
    db.admin_activity_logs.push(entry);
    if (typeof saveDatabase === 'function') saveDatabase();
    return entry;
  }

  /**
   * Fetch recent activity logs
   */
  static async getRecent(limit = 50) {
    return [...(db.admin_activity_logs || [])]
      .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
      .slice(0, limit);
  }
}

module.exports = AdminActivityLog;