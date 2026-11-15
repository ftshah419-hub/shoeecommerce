const ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  OPERATIONS_MANAGER: 'operations_manager',
  CUSTOMER_SUPPORT: 'customer_support',
  STAFF: 'staff',
  USER: 'user',
};

const ADMIN_ROLES = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.OPERATIONS_MANAGER,
  ROLES.CUSTOMER_SUPPORT,
  ROLES.STAFF,
];

module.exports = {
  ...ROLES,
  ADMIN_ROLES,
  ROLES,
};
