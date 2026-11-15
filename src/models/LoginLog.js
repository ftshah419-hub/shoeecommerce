const { db } = require('../config/db');

class LoginLog {
  /**
   * Record a login attempt (successful or failed)
   */
  static async record({ userId = null, identifier, ipAddress, userAgent, status, failureReason = null }) {
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      identifier: identifier ? String(identifier).trim().toLowerCase() : 'unknown',
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      status: status || 'SUCCESS', // 'SUCCESS' or 'FAILED'
      failureReason,
      createdAt: new Date().toISOString(),
    };

    db.login_logs.push(log);
    return log;
  }

  /**
   * Get recent login logs
   */
  static async getRecentLogs(limit = 50) {
    return [...db.login_logs].reverse().slice(0, limit);
  }

  /**
   * Get failed login attempts count within a given time window (for brute-force tracking)
   */
  static async getFailedAttemptsCount({ identifier, ipAddress, windowMinutes = 15 }) {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    const cleanId = identifier ? String(identifier).trim().toLowerCase() : null;

    return db.login_logs.filter((l) => {
      if (l.status !== 'FAILED') return false;
      if (new Date(l.createdAt) < windowStart) return false;
      if (cleanId && l.identifier === cleanId) return true;
      if (ipAddress && l.ipAddress === ipAddress) return true;
      return false;
    }).length;
  }
}

module.exports = LoginLog;
