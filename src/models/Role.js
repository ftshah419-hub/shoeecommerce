const { db } = require('../config/db');

class Role {
  static async findByName(name) {
    if (!name) return null;
    return db.roles.find((r) => r.name.toLowerCase() === name.toLowerCase()) || null;
  }

  static async getUserRoles(userId) {
    if (!userId) return [];
    const mappings = db.user_roles.filter((ur) => ur.userId === userId);
    return mappings
      .map((ur) => db.roles.find((r) => r.id === ur.roleId))
      .filter(Boolean);
  }

  static async assignRoleToUser(userId, roleName) {
    const role = await Role.findByName(roleName);
    if (!role) throw new Error(`Role "${roleName}" not found.`);

    // Check if mapping already exists
    const existing = db.user_roles.find((ur) => ur.userId === userId && ur.roleId === role.id);
    if (existing) return existing;

    const newMap = {
      id: `ur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      roleId: role.id,
      createdAt: new Date().toISOString(),
    };
    db.user_roles.push(newMap);
    return newMap;
  }

  static async setUserPrimaryRole(userId, roleName) {
    const role = await Role.findByName(roleName);
    if (!role) throw new Error(`Role "${roleName}" not found.`);

    // Remove existing role mappings for user
    db.user_roles = db.user_roles.filter((ur) => ur.userId !== userId);

    const newMap = {
      id: `ur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      roleId: role.id,
      createdAt: new Date().toISOString(),
    };
    db.user_roles.push(newMap);
    return newMap;
  }

  static async getUserPermissions(userId) {
    const userRoles = await Role.getUserRoles(userId);
    const roleIds = userRoles.map((r) => r.id);

    const relevantRolePerms = db.role_permissions.filter((rp) => roleIds.includes(rp.roleId));
    const permIds = [...new Set(relevantRolePerms.map((rp) => rp.permissionId))];

    return db.permissions
      .filter((p) => permIds.includes(p.id))
      .map((p) => p.name);
  }
}

module.exports = Role;
