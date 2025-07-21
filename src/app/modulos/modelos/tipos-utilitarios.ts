// ====================================================================
// TIPOS UTILITARIOS
// ====================================================================

import { PermissionType, UserType } from "./enums";
import { IPaginationOptions, IUserCreationData, IUserListFilter } from "./interfaces-para-servicios";

export type UserTypePermissions = {
  [K in UserType]: PermissionType[];
};

export type PermissionMatrix = {
  [K in UserType]: {
    [P in PermissionType]?: boolean;
  };
};

export type UserFormData = Omit<IUserCreationData, 'password'> & {
  confirmPassword?: string;
};

export type UserSearchCriteria = {
  query: string;
  filters: IUserListFilter;
  pagination: IPaginationOptions;
};