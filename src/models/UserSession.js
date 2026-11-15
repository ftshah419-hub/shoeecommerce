const { db } = require('../config/db');

class UserSession {
  /**
   * Create a new session entry
   */
  static async createSession({ userId, sessionToken, ipAddress, userAgent, rememberMe = false, expiresInMs }) {
    const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

    const session = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
      sessionToken,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      rememberMe: Boolean(rememberMe),
      isActive: true,
      expiresAt,
      revokedAt: null,
      createdAt: new Date().toISOString(),
    };

    db.user_sessions.push(session);
    return session;
  }

  /**
   * Find an active session by token
   */
  static async findActiveByToken(token) {
    if (!token) return null;
    const now = new Date();
    const session = db.user_sessions.find(
      (s) => s.sessionToken === token && s.isActive && new Date(s.expiresAt) > now
    );
    return session || null;
  }

  /**
   * Revoke a single session by token (e.g. on logout)
   */
  static async revokeSession(token) {
    if (!token) return false;
    const session = db.user_sessions.find((s) => s.sessionToken === token);
    if (!session) return false;

    session.isActive = false;
    session.revokedAt = new Date().toISOString();
    return true;
  }

  /**
   * Revoke all active sessions for a user (e.g. on password reset or account security)
   */
  static async revokeAllUserSessions(userId) {
    if (!userId) return 0;
    let count = 0;
    const now = new Date().toISOString();
    db.user_sessions.forEach((s) => {
      if (s.userId === userId && s.isActive) {
        s.isActive = false;
        s.revokedAt = now;
        count++;
      }
    });
    return count;
  }

  /**
   * Get active sessions for a user
   */
  static async findActiveByUserId(userId) {
    const now = new Date();
    return db.user_sessions.filter(
      (s) => s.userId === userId && s.isActive && new Date(s.expiresAt) > now
    );
  }

  /**
   * Purge expired sessions
   */
  static async cleanupExpired() {
    const now = new Date();
    db.user_sessions = db.user_sessions.filter((s) => s.isActive && new Date(s.expiresAt) > now);
  }
}

module.exports = UserSession;
