const { db, saveDatabase } = require('../config/db');

class Role {
  static async find() {
    return (db.roles || []).map((r) => {
      const rolePerms = (db.role_permissions || []).filter((rp) => (rp.role_id === r.id || rp.roleId === r.id));
      const permIds = rolePerms.map((rp) => rp.permission_id || rp.permissionId);
      const permissions = (db.permissions || []).filter((p) => permIds.includes(p.id));
      const userCount = (db.user_roles || []).filter((ur) => (ur.role_id === r.id || ur.roleId === r.id)).length;
      return {
        ...r,
        permissions,
        userCount,
      };
    });
  }

  static async findById(id) {
    if (!id) return null;
    const role = (db.roles || []).find((r) => r.id === id || r.role_name === id || (r.name && r.name.toLowerCase() === id.toLowerCase()));
    if (!role) return null;
    const rolePerms = (db.role_permissions || []).filter((rp) => (rp.role_id === role.id || rp.roleId === role.id));
    const permIds = rolePerms.map((rp) => rp.permission_id || rp.permissionId);
    const permissions = (db.permissions || []).filter((p) => permIds.includes(p.id));
    return { ...role, permissions };
  }

  static async findByName(name) {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    return (db.roles || []).find(
      (r) =>
        (r.name && r.name.toLowerCase() === clean) ||
        (r.role_name && r.role_name.toLowerCase() === clean) ||
        r.id === name
    ) || null;
  }

  static async getUserRoles(userId) {
    if (!userId) return [];
    const mappings = (db.user_roles || []).filter((ur) => (ur.userId === userId || ur.user_id === userId));
    return mappings
      .map((ur) => (db.roles || []).find((r) => r.id === (ur.roleId || ur.role_id)))
      .filter(Boolean);
  }

  static async create({ role_name, display_name, description }) {
    const id = `role_${role_name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const newRole = {
      id,
      role_name: role_name.toUpperCase(),
      name: role_name.toLowerCase(),
      display_name: display_name || role_name,
      description: description || '',
      is_system: false,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    if (!db.roles) db.roles = [];
    db.roles.push(newRole);
    if (typeof saveDatabase === 'function') saveDatabase();
    return newRole;
  }

  static async updatePermissions(roleId, permissionIds = []) {
    db.role_permissions = (db.role_permissions || []).filter((rp) => (rp.role_id !== roleId && rp.roleId !== roleId));
    permissionIds.forEach((pid) => {
      db.role_permissions.push({
        id: `rp_${roleId}_${pid}`,
        role_id: roleId,
        roleId: roleId,
        permission_id: pid,
        permissionId: pid,
      });
    });
    if (typeof saveDatabase === 'function') saveDatabase();
    return this.findById(roleId);
  }

  static async assignRoleToUser(userId, roleIdentifier) {
    const role = (await Role.findById(roleIdentifier)) || (await Role.findByName(roleIdentifier));
    if (!role) throw new Error(`Role "${roleIdentifier}" not found.`);

    // Remove existing mappings
    db.user_roles = (db.user_roles || []).filter((ur) => (ur.user_id !== userId && ur.userId !== userId));

    const newMap = {
      id: `ur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId,
      userId: userId,
      role_id: role.id,
      roleId: role.id,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.user_roles.push(newMap);

    // Sync legacy role field on User
    const user = (db.users || []).find((u) => String(u.id) === String(userId));
    if (user) {
      user.role = role.role_name && role.role_name.includes('ADMIN') ? 'admin' : (role.name || role.role_name.toLowerCase());
    }

    if (typeof saveDatabase === 'function') saveDatabase();
    return newMap;
  }

  static async setUserPrimaryRole(userId, roleIdentifier) {
    return this.assignRoleToUser(userId, roleIdentifier);
  }

  static async getUserPermissions(userId) {
    const userRoles = await Role.getUserRoles(userId);
    const roleIds = userRoles.map((r) => r.id);

    const relevantRolePerms = (db.role_permissions || []).filter((rp) =>
      roleIds.includes(rp.roleId || rp.role_id)
    );
    const permIds = [...new Set(relevantRolePerms.map((rp) => rp.permissionId || rp.permission_id))];

    return (db.permissions || [])
      .filter((p) => permIds.includes(p.id))
      .map((p) => p.permission_name || p.name);
  }
}

module.exports = Role;