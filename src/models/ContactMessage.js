const { db, saveDatabase } = require('../config/db');

class ContactMessage {
  static async find(filter = {}) {
    let results = [...(db.contact_messages || [])];
    if (filter.status) {
      results = results.filter((m) => m.status === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.subject && m.subject.toLowerCase().includes(q)) ||
          (m.message && m.message.toLowerCase().includes(q))
      );
    }
    return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async findById(id) {
    return db.contact_messages.find((m) => m.id === id) || null;
  }

  static async updateStatus(id, status) {
    const msg = db.contact_messages.find((m) => m.id === id);
    if (!msg) return null;
    msg.status = status;
    if (status === 'RESOLVED') {
      msg.resolved_at = new Date().toISOString();
    }
    saveDatabase();
    return msg;
  }

  static async delete(id) {
    const index = db.contact_messages.findIndex((m) => m.id === id);
    if (index === -1) return false;
    db.contact_messages.splice(index, 1);
    saveDatabase();
    return true;
  }
}

module.exports = ContactMessage;
