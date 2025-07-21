// ====================================================================
// INTERFACES DE PERMISOS Y ACCIONES
// ====================================================================

import { PermissionType } from "./enums";

export interface IUserPermissions {
  hasPermission(permission: PermissionType): boolean;
  getPermissions(): PermissionType[];
  addPermission(permission: PermissionType): void;
  removePermission(permission: PermissionType): void;
  setPermissions(permissions: PermissionType[]): void;
}

export interface IUserActions {
  canCreateUser(): boolean;
  canManageCredits(): boolean;
  canViewReports(): boolean;
  canManageInventory(): boolean;
  canApproveAmount(amount: number): boolean;
  getSpecificActions(): string[];
  getMaxApprovalAmount(): number;
}

export interface IUserValidation {
  isValid(): boolean;
  getValidationErrors(): string[];
  validateProfile(): boolean;
  validatePermissions(): boolean;
}