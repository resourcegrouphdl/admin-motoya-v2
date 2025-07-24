import { BaseUser, VendorUser } from "./clases-herencia";
import { UserType } from "./enums";

export interface BaseProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  userType: UserType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  storeIds?: string[]; // Para agrupar por tiendas

  isFirstLogin?: boolean;
  lastPasswordChange?: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// ===== INTERFACES DE CONFIGURACIÓN =====

export interface CreateUserDialogData {
  userTypes: UserTypeConfig[];
}

export interface UserTypeConfig {
  value: UserType;
  label: string;
  icon: string;
  class: string;
  description: string;
}

export interface UserCreationResult {
  userType: UserType;
  profile: any;
  additionalData: any;
}

// ===== INTERFACES DE COMPONENTES =====

export interface UserTableData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  isActive: boolean;
  lastLogin: Date | null;
  avatar: string;
  createdAt: Date;
  storeIds?: string[];
  specificData?: any;
  originalUser: BaseUser;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  pendingUsers: number;
  usersByType: Record<UserType, number>;
}

export interface FilterOptions {
  search: string;
  status: string;
  userType: UserType | '';
  storeId: string;
  dateFrom: Date | null;
  dateTo: Date | null;
}

// ===== INTERFACES DE ESTADÍSTICAS =====

export interface StoreStatistics {
  storeId: string;
  storeName: string;
  totalUsers: number;
  usersByType: Record<UserType, number>;
  activeUsers: number;
  vendors: VendorUser[];
  averageCommission: number;
  totalSales?: number;
  monthlyGrowth?: number;
}

export interface VendorStatistics {
  vendorId: string;
  vendorName: string;
  storeId: string;
  commissionRate: number;
  totalSales: number;
  monthlyTarget: number;
  achievementPercentage: number;
  customersManaged: number;
  lastActivity: Date;
}

export interface FinancialStatistics {
  analystId: string;
  analystName: string;
  approvalLimit: number;
  applicationsProcessed: number;
  approvalRate: number;
  averageProcessingTime: number; // en horas
  riskAssessments: number;
}

// ===== INTERFACES DE SISTEMA =====

export interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  actionRequired?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  changes?: any;
}

export interface Permission {
  resource: string;
  actions: string[]; // ['read', 'create', 'update', 'delete']
  conditions?: any;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userType: UserType;
  isSystem: boolean;
}

// ===== INTERFACES DE VALIDACIÓN =====

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface FormValidationConfig {
  userType: UserType;
  profileRules: ValidationRule[];
  specificRules: ValidationRule[];
}

// ===== CONFIGURACIONES DEL SISTEMA =====

export const USER_TYPE_CONFIGS: Record<UserType, UserTypeConfig> = {
  [UserType.ADMIN]: {
    value: UserType.ADMIN,
    label: 'Administrador',
    icon: 'admin_panel_settings',
    class: 'admin-type',
    description: 'Control total del sistema'
  },
  [UserType.STORE]: {
    value: UserType.STORE,
    label: 'Tienda',
    icon: 'store',
    class: 'store-type',
    description: 'Gestión de inventario y ventas'
  },
  [UserType.VENDOR]: {
    value: UserType.VENDOR,
    label: 'Vendedor',
    icon: 'person',
    class: 'vendor-type',
    description: 'Ventas y gestión de clientes'
  },
  [UserType.ACCOUNTANT]: {
    value: UserType.ACCOUNTANT,
    label: 'Contable',
    icon: 'calculate',
    class: 'accountant-type',
    description: 'Gestión contable y financiera'
  },
  [UserType.FINANCIAL]: {
    value: UserType.FINANCIAL,
    label: 'Financiero',
    icon: 'trending_up',
    class: 'financial-type',
    description: 'Evaluación y aprobación de créditos'
  }
};

export const DEFAULT_PERMISSIONS: Record<UserType, Permission[]> = {
  [UserType.ADMIN]: [
    { resource: '*', actions: ['*'] }
  ],
  [UserType.STORE]: [
    { resource: 'inventory', actions: ['read', 'create', 'update'] },
    { resource: 'sales', actions: ['read', 'create', 'update'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'users', actions: ['read'], conditions: { storeId: 'self' } }
  ],
  [UserType.VENDOR]: [
    { resource: 'customers', actions: ['read', 'create', 'update'] },
    { resource: 'sales', actions: ['read', 'create'] },
    { resource: 'products', actions: ['read'] },
    { resource: 'reports', actions: ['read'], conditions: { vendorId: 'self' } }
  ],
  [UserType.ACCOUNTANT]: [
    { resource: 'accounting', actions: ['read', 'create', 'update'] },
    { resource: 'financial-reports', actions: ['read', 'create'] },
    { resource: 'transactions', actions: ['read', 'update'] },
    { resource: 'tax-documents', actions: ['read', 'create', 'update'] }
  ],
  [UserType.FINANCIAL]: [
    { resource: 'credit-applications', actions: ['read', 'update'] },
    { resource: 'risk-assessments', actions: ['read', 'create', 'update'] },
    { resource: 'financial-analysis', actions: ['read', 'create'] },
    { resource: 'approval-workflows', actions: ['read', 'update'] }
  ]
};