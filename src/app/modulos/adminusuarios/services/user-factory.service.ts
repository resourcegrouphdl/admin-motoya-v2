import { Injectable } from '@angular/core';
import { AdministracionProfile, BaseProfile, ComercialProfile, ContabilidadProfile, FinanzasProfile, GerenciaProfile, LogisticaProfile, RecursosHumanosProfile, UserProfile, UserType } from '../enums/user-type.types';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  userType: UserType;
  password: string;
  storeIds?: string[];
  specificData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserFactoryService {
createUserProfile(uid: string, userData: CreateUserRequest, createdBy: string): UserProfile {
    const baseProfile: BaseProfile = {
      uid,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      documentType: userData.documentType as any,
      documentNumber: userData.documentNumber,
      userType: userData.userType,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      storeIds: userData.storeIds && userData.storeIds.length > 0 ? userData.storeIds : [],
      isFirstLogin: true,
      lastPasswordChange: new Date()
    };

    switch (userData.userType) {
      case UserType.COMERCIAL:
        return this.createComercialProfile(baseProfile, userData.specificData);
      
      case UserType.LOGISTICA:
        return this.createLogisticaProfile(baseProfile, userData.specificData);
      
      case UserType.FINANZAS:
        return this.createFinanzasProfile(baseProfile, userData.specificData);
      
      case UserType.GERENCIA:
        return this.createGerenciaProfile(baseProfile, userData.specificData);
      
      case UserType.CONTABILIDAD:
        return this.createContabilidadProfile(baseProfile, userData.specificData);
      
      case UserType.ADMINISTRACION:
        return this.createAdministracionProfile(baseProfile, userData.specificData);
      
      case UserType.RECURSOS_HUMANOS:
        return this.createRecursosHumanosProfile(baseProfile, userData.specificData);
      
      default:
        throw new Error(`Tipo de usuario no válido: ${userData.userType}`);
    }
  }

  private createComercialProfile(base: BaseProfile, specificData?: any): ComercialProfile {
    return {
      ...base,
      salesTeam: specificData?.salesTeam,
      marketingCampaigns: specificData?.marketingCampaigns || [],
      salesTarget: specificData?.salesTarget
    };
  }

  private createLogisticaProfile(base: BaseProfile, specificData?: any): LogisticaProfile {
    return {
      ...base,
      warehouseAccess: specificData?.warehouseAccess || [],
      inventoryLevel: specificData?.inventoryLevel || 'basic'
    };
  }

  private createFinanzasProfile(base: BaseProfile, specificData?: any): FinanzasProfile {
    return {
      ...base,
      accountingAccess: specificData?.accountingAccess || false,
      treasuryAccess: specificData?.treasuryAccess || false,
      bankAccess: specificData?.bankAccess || false,
      creditAccess: specificData?.creditAccess || false
    };
  }

  private createGerenciaProfile(base: BaseProfile, specificData?: any): GerenciaProfile {
    return {
      ...base,
      auditAccess: specificData?.auditAccess || false,
      costsAccess: specificData?.costsAccess || false,
      financialStatementsAccess: specificData?.financialStatementsAccess || false,
      systemAccessLevel: specificData?.systemAccessLevel || 'restricted'
    };
  }

  private createContabilidadProfile(base: BaseProfile, specificData?: any): ContabilidadProfile {
    return {
      ...base,
      billingAccess: specificData?.billingAccess || false,
      purchaseBooksAccess: specificData?.purchaseBooksAccess || false,
      salesBooksAccess: specificData?.salesBooksAccess || false,
      kardexAccess: specificData?.kardexAccess || false,
      electronicBooksAccess: specificData?.electronicBooksAccess || false
    };
  }

  private createAdministracionProfile(base: BaseProfile, specificData?: any): AdministracionProfile {
    return {
      ...base,
      companyManagement: specificData?.companyManagement || false,
      supplierManagement: specificData?.supplierManagement || false,
      productManagement: specificData?.productManagement || false,
      categoryManagement: specificData?.categoryManagement || false,
      priceManagement: specificData?.priceManagement || false
    };
  }

  private createRecursosHumanosProfile(base: BaseProfile, specificData?: any): RecursosHumanosProfile {
    return {
      ...base,
      contractsAccess: specificData?.contractsAccess || false,
      personnelControlAccess: specificData?.personnelControlAccess || false,
      trainingAccess: specificData?.trainingAccess || false,
      performanceEvaluationAccess: specificData?.performanceEvaluationAccess || false
    };
  }

  getUserTypeDisplayName(userType: UserType): string {
    const names = {
      [UserType.COMERCIAL]: 'Comercial',
      [UserType.LOGISTICA]: 'Logística',
      [UserType.FINANZAS]: 'Finanzas',
      [UserType.GERENCIA]: 'Gerencia',
      [UserType.CONTABILIDAD]: 'Contabilidad',
      [UserType.ADMINISTRACION]: 'Administración',
      [UserType.RECURSOS_HUMANOS]: 'Recursos Humanos'
    };
    return names[userType];
  }

  getUserTypeDescription(userType: UserType): string {
    const descriptions = {
      [UserType.COMERCIAL]: 'Ventas, marketing',
      [UserType.LOGISTICA]: 'Inventarios, almacén',
      [UserType.FINANZAS]: 'Contabilidad, tesorería, bancos, créditos y cobranzas',
      [UserType.GERENCIA]: 'EE.FF., Auditoría, Costos, Accesos',
      [UserType.CONTABILIDAD]: 'Facturación, Libro de compras, Ventas, kardex, libros electrónicos',
      [UserType.ADMINISTRACION]: 'Empresas, proveedores, productos, categorías, precios',
      [UserType.RECURSOS_HUMANOS]: 'Contratos, control de personal, capacitación, evaluación de desempeño'
    };
    return descriptions[userType];
  }
}
