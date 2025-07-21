// ====================================================================
// CONSTANTES Y CONFIGURACIONES DEFAULT
// ====================================================================

import { PermissionType, UserType } from "./enums";
import { UserTypePermissions } from "./tipos-utilitarios";

export const DEFAULT_PERMISSIONS: UserTypePermissions = {
  [UserType.ADMIN]: [
    PermissionType.CREATE,
    PermissionType.READ,
    PermissionType.UPDATE,
    PermissionType.DELETE,
    PermissionType.APPROVE,
    PermissionType.REJECT,
    PermissionType.MANAGE_USERS,
    PermissionType.MANAGE_CREDITS,
    PermissionType.MANAGE_STORES,
    PermissionType.MANAGE_INVENTORY,
    PermissionType.VIEW_REPORTS,
    PermissionType.VIEW_FINANCIAL_REPORTS,
    PermissionType.EXPORT_DATA,
    PermissionType.FINANCIAL_OPERATIONS,
    PermissionType.APPROVE_HIGH_AMOUNT,
    PermissionType.SYSTEM_CONFIG,
    PermissionType.BACKUP_RESTORE
  ],
  [UserType.STORE]: [
    PermissionType.READ,
    PermissionType.UPDATE,
    PermissionType.MANAGE_INVENTORY,
    PermissionType.VIEW_REPORTS
  ],
  [UserType.VENDOR]: [
    PermissionType.READ,
    PermissionType.CREATE,
    PermissionType.UPDATE
  ],
  [UserType.ACCOUNTANT]: [
    PermissionType.READ,
    PermissionType.UPDATE,
    PermissionType.VIEW_REPORTS,
    PermissionType.VIEW_FINANCIAL_REPORTS,
    PermissionType.EXPORT_DATA
  ],
  [UserType.FINANCIAL]: [
    PermissionType.READ,
    PermissionType.UPDATE,
    PermissionType.APPROVE,
    PermissionType.REJECT,
    PermissionType.MANAGE_CREDITS,
    PermissionType.VIEW_REPORTS,
    PermissionType.VIEW_FINANCIAL_REPORTS,
    PermissionType.EXPORT_DATA,
    PermissionType.FINANCIAL_OPERATIONS
  ]
};

export const APPROVAL_LIMITS: Record<UserType, number> = {
  [UserType.ADMIN]: 1000000, // Sin límite prácticamente
  [UserType.STORE]: 0, // No puede aprobar
  [UserType.VENDOR]: 0, // No puede aprobar
  [UserType.ACCOUNTANT]: 50000,
  [UserType.FINANCIAL]: 200000
};

export const MAX_STORES_PER_VENDOR = 5;
export const MAX_LOGIN_ATTEMPTS = 5;
export const SESSION_TIMEOUT_MINUTES = 480; // 8 horas
