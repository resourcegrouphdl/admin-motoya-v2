import { AccessLevel, RiskLevel, UserType } from "./enums";
import { Address, BaseProfile } from "./interface-base";

export abstract class BaseUser implements BaseProfile {
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
  storeIds?: string[];

  isFirstLogin?: boolean;
  lastPasswordChange?: Date;

  constructor(profile: Omit<BaseProfile, 'uid' | 'createdAt' | 'updatedAt' | 'isActive'>) {
    this.uid = '';
    this.firstName = profile.firstName;
    this.lastName = profile.lastName;
    this.email = profile.email;
    this.phone = profile.phone;
    this.documentType = profile.documentType;
    this.documentNumber = profile.documentNumber;
    this.userType = profile.userType;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.createdBy = profile.createdBy;
    this.storeIds = profile.storeIds || [];
    this.isFirstLogin = true
    this.lastPasswordChange = new Date();
  }

  abstract getSpecificData(): any;
  abstract getCollectionName(): string;

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
  toFirestore(): any {
    return {
      uid: this.uid,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      documentType: this.documentType,
      documentNumber: this.documentNumber,
      userType: this.userType,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      storeIds: this.storeIds,
      isFirstLogin: this.isFirstLogin,
      lastPasswordChange: this.lastPasswordChange
    };
  }
}



//// Example of a specific user type extending BaseUser


export class AdminUser extends BaseUser {
  permissions: string[];
  canManageUsers: boolean;
  canViewReports: boolean;

  constructor(profile: Omit<BaseProfile, 'uid' | 'createdAt' | 'updatedAt' | 'isActive'>) {
    super({ ...profile, userType: UserType.ADMIN });
    this.permissions = ['all'];
    this.canManageUsers = true;
    this.canViewReports = true;
  }

  getSpecificData(): any {
    return {
      permissions: this.permissions,
      canManageUsers: this.canManageUsers,
      canViewReports: this.canViewReports
    };
  }

  getCollectionName(): string {
    return 'admin_profiles';
  }
}



// Example of another specific user type extending BaseUser


export class StoreUser extends BaseUser {
  storeInfo: {
    storeId: string;
    storeName: string;
    storeCode: string;
    address: Address;
    maxInventory: number;
    managedBy?: string;
  };

  constructor(
    profile: Omit<BaseProfile, 'uid' | 'createdAt' | 'updatedAt' | 'isActive'>,
    storeInfo: StoreUser['storeInfo']
  ) {
    super({ ...profile, userType: UserType.STORE });
    this.storeInfo = storeInfo;
    this.storeIds = [storeInfo.storeId]; // La tienda pertenece a sí misma
  }

  getSpecificData(): any {
    return {
      storeInfo: this.storeInfo
    };
  }

  getCollectionName(): string {
    return 'store_profiles';
  }
}

export class VendorUser extends BaseUser {
  vendorInfo: {
    employeeId: string;
    commissionRate: number;
    territory: string;
    hireDate: Date;
    managerId?: string;
  };
  storeAssignments: {
    storeId: string;
    storeName: string;
    assignedAt: Date;
    assignedBy: string;
    isActive: boolean;
    permissions: string[];
  }[];

  constructor(
    profile: Omit<BaseProfile, 'uid' | 'createdAt' | 'updatedAt' | 'isActive'>,
    vendorInfo: VendorUser['vendorInfo'],
    storeAssignments: VendorUser['storeAssignments'] = []
  ) {
    super({ ...profile, userType: UserType.VENDOR });
    this.vendorInfo = vendorInfo;
    this.storeAssignments = storeAssignments;
    this.storeIds = storeAssignments.map(assignment => assignment.storeId);
  }

  getSpecificData(): any {
    return {
      vendorInfo: this.vendorInfo,
      storeAssignments: this.storeAssignments
    };
  }

  getCollectionName(): string {
    return 'vendor_profiles';
  }
}


export class AccountantUser extends BaseUser {
  accountantInfo: {
    accessLevel: AccessLevel;
    specializations: string[];
    certifications: string[];
    department: string;
    canApproveTransactions: boolean;
  };

  constructor(
    profile: Omit<BaseProfile, 'uid' | 'createdAt' | 'updatedAt' | 'isActive'>,
    accountantInfo: AccountantUser['accountantInfo']
  ) {
    super({ ...profile, userType: UserType.ACCOUNTANT });
    this.accountantInfo = accountantInfo;
  }

  getSpecificData(): any {
    return {
      accountantInfo: this.accountantInfo
    };
  }

  getCollectionName(): string {
    return 'accountant_profiles';
  }
}


export class FinancialUser extends BaseUser {
  financialInfo: {
    specializations: string[]; // ESTE CAMPO ES PARA ESPECIALIZACIONES FINANCIERAS
    approvalLimit: number; // este campo es para el límite de aprobación
    riskLevel: RiskLevel;   // este campo es para el nivel de riesgo
    certifications: string[]; // este campo es para certificaciones financieras
    department: string;    // este campo es para el departamento financiero
    analysisTools: string[];  // este campo es para herramientas de análisis financiero
  };

  constructor(
    profile: Omit<BaseProfile, 'uid' | 'createdAt' | 'updatedAt' | 'isActive'>,
    financialInfo: FinancialUser['financialInfo']
  ) {
    super({ ...profile, userType: UserType.FINANCIAL });
    this.financialInfo = financialInfo;
  }

  getSpecificData(): any {
    return {
      financialInfo: this.financialInfo
    };
  }

  getCollectionName(): string {
    return 'financial_profiles';
  }
}



