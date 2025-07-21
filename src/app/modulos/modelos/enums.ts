export enum UserType {
  ADMIN = 'admin',
  STORE = 'store',
  VENDOR = 'vendor',
  ACCOUNTANT = 'accountant',
  FINANCIAL = 'financial'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  BLOCKED = 'blocked',
  SUSPENDED = 'suspended'
}

export enum PermissionType {
  // Permisos básicos CRUD
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  
  // Permisos de aprobación
  APPROVE = 'approve',
  REJECT = 'reject',
  
  // Permisos de gestión
  MANAGE_USERS = 'manage_users',
  MANAGE_CREDITS = 'manage_credits',
  MANAGE_STORES = 'manage_stores',
  MANAGE_INVENTORY = 'manage_inventory',
  
  // Permisos de reportes y análisis
  VIEW_REPORTS = 'view_reports',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
  EXPORT_DATA = 'export_data',
  
  // Permisos financieros
  FINANCIAL_OPERATIONS = 'financial_operations',
  APPROVE_HIGH_AMOUNT = 'approve_high_amount',
  
  // Permisos de configuración
  SYSTEM_CONFIG = 'system_config',
  BACKUP_RESTORE = 'backup_restore'
}

export enum ActionType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  APPROVE_CREDIT = 'approve_credit',
  REJECT_CREDIT = 'reject_credit',
  ASSIGN_STORE = 'assign_store',
  REMOVE_STORE = 'remove_store'
}