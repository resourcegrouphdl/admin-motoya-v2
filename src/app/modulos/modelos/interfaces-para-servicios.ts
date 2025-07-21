// ====================================================================
// INTERFACES PARA SERVICIOS
// ====================================================================

import { BaseUser } from "./abstracta";
import { PermissionType, UserStatus, UserType } from "./enums";
import { IUserProfile } from "./interface-base";
import { IAccountantInfo, IFinancialInfo, IStoreAssignment, IStoreInfo, IVendorInfo } from "./interfaces-especificas-por-tipo-de-usuario";

export interface IAuthState {
  user: BaseUser | null;
  firebaseUser: any | null; // Firebase User type
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: PermissionType[];
}

export interface IUserCreationData {
  type: UserType;
  profile: IUserProfile;
  password: string;
  additionalData?: {
    storeInfo?: IStoreInfo;
    vendorInfo?: IVendorInfo;
    accountantInfo?: IAccountantInfo;
    financialInfo?: IFinancialInfo;
    storeAssignments?: IStoreAssignment[];
  };
}

export interface IUserUpdateData {
  profile?: Partial<IUserProfile>;
  status?: UserStatus;
  permissions?: PermissionType[];
  additionalData?: any;
}

export interface IUserListFilter {
  type?: UserType;
  status?: UserStatus;
  search?: string;
  storeId?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasPermission?: PermissionType;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResult<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IUserStatistics {
  totalUsers: number;
  activeUsers: number;
  usersByType: Record<UserType, number>;
  usersByStatus: Record<UserStatus, number>;
  newUsersThisMonth: number;
  lastLoginStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}
