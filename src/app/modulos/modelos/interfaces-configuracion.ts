// ====================================================================
// INTERFACES DE CONFIGURACIÓN
// ====================================================================

import { BaseUser } from "./abstracta";
import { PermissionType, UserType } from "./enums";
import { IPaginatedResult, IUserStatistics } from "./interfaces-para-servicios";
import { IUserValidationRules } from "./interfaces-validacion";

export interface IUserConfiguration {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
  };
  sessionPolicy: {
    maxDuration: number; // minutes
    inactivityTimeout: number; // minutes
    allowMultipleSessions: boolean;
  };
  validationRules: IUserValidationRules;
  defaultPermissions: Record<UserType, PermissionType[]>;
}


// ====================================================================
// INTERFACES DE RESPUESTA DE API
// ====================================================================

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

export interface IUserResponse extends IApiResponse<BaseUser> {}
export interface IUserListResponse extends IApiResponse<IPaginatedResult<BaseUser>> {}
export interface IUserStatsResponse extends IApiResponse<IUserStatistics> {}