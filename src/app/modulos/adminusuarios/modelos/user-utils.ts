import { BaseUser } from "./clases-herencia";
import { UserType } from "./enums";
import { DEFAULT_PERMISSIONS, Permission, USER_TYPE_CONFIGS, UserTypeConfig } from "./interface-base";

export class UserUtils {
  static getUserTypeConfig(userType: UserType): UserTypeConfig {
    return USER_TYPE_CONFIGS[userType];
  }

  static getUserPermissions(userType: UserType): Permission[] {
    return DEFAULT_PERMISSIONS[userType] || [];
  }

  static canUserPerformAction(user: BaseUser, resource: string, action: string): boolean {
    const permissions = this.getUserPermissions(user.userType);
    
    return permissions.some(permission => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      const actionMatch = permission.actions.includes('*') || permission.actions.includes(action);
      
      // TODO: Implementar validación de condiciones
      const conditionsMatch = !permission.conditions || this.validateConditions(user, permission.conditions);
      
      return resourceMatch && actionMatch && conditionsMatch;
    });
  }

  private static validateConditions(user: BaseUser, conditions: any): boolean {
    // Implementar lógica de validación de condiciones
    // Por ejemplo: conditions.storeId === 'self' significa que solo puede acceder a su propia tienda
    return true;
  }

  static formatUserType(userType: UserType): string {
    return USER_TYPE_CONFIGS[userType]?.label || userType;
  }

  static getUserTypeIcon(userType: UserType): string {
    return USER_TYPE_CONFIGS[userType]?.icon || 'person';
  }

  static getUserTypeClass(userType: UserType): string {
    return USER_TYPE_CONFIGS[userType]?.class || '';
  }

  static generateUserId(): string {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static generateStoreId(): string {
    return 'store_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static generateAvatar(firstName: string, lastName: string): string {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  static formatPhoneNumber(phone: string): string {
    // Formato peruano: +51 999 999 999
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `+51 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateDNI(dni: string): boolean {
    return /^\d{8}$/.test(dni);
  }

  static validateRUC(ruc: string): boolean {
    return /^\d{11}$/.test(ruc);
  }
}