// ====================================================================
// INTERFACES DE EVENTOS
// ====================================================================

import { PermissionType } from "./enums";
import { IStoreAssignment } from "./interfaces-especificas-por-tipo-de-usuario";

export interface IUserEvent {
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'user_login' | 'user_logout';
  userId: string;
  performedBy: string;
  timestamp: Date;
  data: any;
}

export interface IPermissionEvent {
  type: 'permission_granted' | 'permission_revoked';
  userId: string;
  permission: PermissionType;
  performedBy: string;
  timestamp: Date;
}

export interface IStoreAssignmentEvent {
  type: 'store_assigned' | 'store_removed';
  userId: string;
  storeId: string;
  performedBy: string;
  timestamp: Date;
  details: IStoreAssignment;
}