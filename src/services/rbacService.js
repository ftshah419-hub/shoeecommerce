const Role = require('../models/Role');
const Permission = require('../models/Permission');
const AdminActivityLog = require('../models/AdminActivityLog');

class RbacService {
  async getAllRoles() {
    return Role.find();
  }

  async getRoleById(id) {
    return Role.findById(id);
  }

  async getAllPermissions() {
    return Permission.find();
  }

  async createRole(data, adminUser = null, ip = null) {
    if (!data.role_name) throw new Error('Role identifier name is required.');
    const role = await Role.create(data);

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'CREATE_ROLE',
        module: 'ADMINISTRATION',
        details: `Created new admin role "${role.display_name}" (${role.role_name})`,
        ip_address: ip,
      });
    }

    return role;
  }

  async updateRolePermissions(roleId, permissionIds = [], adminUser = null, ip = null) {
    const role = await Role.findById(roleId);
    if (!role) throw new Error('Role not found.');

    const updated = await Role.updatePermissions(roleId, permissionIds);

    if (adminUser) {
      await AdminActivityLog.log({
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        action: 'UPDATE_ROLE_PERMISSIONS',
        module: 'ADMINISTRATION',
        details: `Updated permissions for role "${role.display_name}" (${permissionIds.length} permissions assigned)`,
        ip_address: ip,
      });
    }

    return updated;
  }
}

module.exports = new RbacService();
