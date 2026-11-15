const ContactMessage = require('../models/ContactMessage');
const AdminActivityLog = require('../models/AdminActivityLog');

class MessageService {
  async getAllMessages(query = {}) {
    return ContactMessage.find(query);
  }

  async updateMessageStatus(id, status, adminUser = null, ip = null) {
    const valid = ['UNREAD', 'READ', 'RESOLVED'];
    if (!valid.includes(status)) {
      throw new Error(`Invalid status "${status}". Allowed: ${valid.join(', ')}`);
    }

    const msg = await ContactMessage.findById(id);
    if (!msg) throw new Error('Message not found.');

    const updated = await ContactMessage.updateStatus(id, status);

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'UPDATE_MESSAGE_STATUS',
        module: 'CUSTOMER_SQUAD',
        details: `Marked inquiry from "${msg.name}" (${msg.email}) as "${status}"`,
        ip_address: ip,
      });
    }

    return updated;
  }

  async deleteMessage(id, adminUser = null, ip = null) {
    const msg = await ContactMessage.findById(id);
    const deleted = await ContactMessage.delete(id);

    if (adminUser && msg) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'DELETE_MESSAGE',
        module: 'CUSTOMER_SQUAD',
        details: `Deleted inquiry from "${msg.name}"`,
        ip_address: ip,
      });
    }

    return deleted;
  }
}

module.exports = new MessageService();
