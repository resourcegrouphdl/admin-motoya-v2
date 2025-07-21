// ====================================================================
// CLASE BASE ABSTRACTA (declaración de interfaz)
// ====================================================================

import { PermissionType, UserStatus, UserType } from "./enums";
import { IUserMetadata, IUserProfile } from "./interface-base";
import { IUserActions, IUserPermissions, IUserValidation } from "./interfaces-permisos-acciones";

export abstract class BaseUser implements IUserPermissions, IUserActions, IUserValidation {
  // Propiedades protegidas que implementaremos en el siguiente paso
  protected _metadata!: IUserMetadata;
  protected _profile!: IUserProfile;
  protected _type!: UserType;
  protected _status!: UserStatus;
  protected _permissions!: Set<PermissionType>;

  // Métodos abstractos que implementarán las clases hijas
  abstract canCreateUser(): boolean;
  abstract canManageCredits(): boolean;
  abstract canViewReports(): boolean;
  abstract canManageInventory(): boolean;
  abstract canApproveAmount(amount: number): boolean;
  abstract getSpecificActions(): string[];
  abstract getMaxApprovalAmount(): number;
  abstract getDefaultPermissions(): PermissionType[];

  // Métodos de la interfaz IUserPermissions
  abstract hasPermission(permission: PermissionType): boolean;
  abstract getPermissions(): PermissionType[];
  abstract addPermission(permission: PermissionType): void;
  abstract removePermission(permission: PermissionType): void;
  abstract setPermissions(permissions: PermissionType[]): void;

  // Métodos de la interfaz IUserValidation
  abstract isValid(): boolean;
  abstract getValidationErrors(): string[];
  abstract validateProfile(): boolean;
  abstract validatePermissions(): boolean;

  // Métodos comunes
  abstract toJSON(): any;
  abstract fromJSON(data: any): void;
}
