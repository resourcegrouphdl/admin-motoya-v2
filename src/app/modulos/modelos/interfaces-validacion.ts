// ====================================================================
// INTERFACES DE VALIDACIÓN
// ====================================================================

import { PermissionType, UserType } from "./enums";

export interface IValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface IUserValidationRules {
  profile: {
    firstName: { required: boolean; minLength: number; maxLength: number };
    lastName: { required: boolean; minLength: number; maxLength: number };
    email: { required: boolean; pattern: RegExp };
    phone: { required: boolean; pattern: RegExp };
    documentNumber: { required: boolean; pattern?: RegExp };
  };
  permissions: {
    minimumRequired: PermissionType[];
    conflicting: PermissionType[][];
  };
  businessRules: {
    maxStoresPerVendor: number;
    maxApprovalAmount: Record<UserType, number>;
  };
}