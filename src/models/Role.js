const { db, saveDatabase } = require('../config/db');

class Role {
  static async find() {
    return (db.roles || []).map((r) => {
      const rolePerms = (db.role_permissions || []).filter((rp) => rp.role_id === r.id);
      const permIds = rolePerms.map((rp) => rp.permission_id);
      const permissions = (db.permissions || []).filter((p) => permIds.includes(p.id));
      const userCount = (db.user_roles || []).filter((ur) => ur.role_id === r.id).length;
      return {
        ...r,
        permissions,
        userCount,
      };
    });
  }

  static async findById(id) {
    const role = (db.roles || []).find((r) => r.id === id || r.role_name === id);
    if (!role) return null;
    const rolePerms = (db.role_permissions || []).filter((rp) => rp.role_id === role.id);
    const permIds = rolePerms.map((rp) => rp.permission_id);
    const permissions = (db.permissions || []).filter((p) => permIds.includes(p.id));
    return { ...role, permissions };
  }

  static async create({ role_name, display_name, description }) {
    const id = `role_${role_name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const newRole = {
      id,
      role_name: role_name.toUpperCase(),
      display_name: display_name || role_name,
      description: description || '',
      is_system: false,
      created_at: new Date().toISOString(),
    };
    db.roles.push(newRole);
    saveDatabase();
    return newRole;
  }

  static async updatePermissions(roleId, permissionIds = []) {
    // Remove existing
    db.role_permissions = (db.role_permissions || []).filter((rp) => rp.role_id !== roleId);
    // Add new
    permissionIds.forEach((pid) => {
      db.role_permissions.push({ role_id: roleId, permission_id: pid });
    });
    saveDatabase();
    return this.findById(roleId);
  }

  static async assignRoleToUser(userId, roleId) {
    db.user_roles = (db.user_roles || []).filter((ur) => ur.user_id !== userId);
    db.user_roles.push({ user_id: userId, role_id: roleId });

    // Also update role field on user for backwards compat
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      const role = db.roles.find((r) => r.id === roleId);
      user.role = role && role.role_name.includes('ADMIN') ? 'admin' : (role ? role.role_name.toLowerCase() : 'user');
    }
    saveDatabase();
    return true;
  }
}

module.exports = Role;
