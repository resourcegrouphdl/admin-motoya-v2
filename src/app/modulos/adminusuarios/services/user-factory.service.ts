import { Injectable } from '@angular/core';
import {
  AdministracionProfile,
  BaseProfile,
  ComercialProfile,
  ContabilidadProfile,
  CreateTiendaRequest,
  CreateVendedorRequest,
  FinanzasProfile,
  GerenciaProfile,
  LogisticaProfile,
  RecursosHumanosProfile,
  TiendaProfile,
  TiendaStatus,
  UserCategory,
  UserProfile,
  UserType,
  VendedorProfile,
  VendedorStatus,
} from '../enums/user-type.types';

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
  providedIn: 'root',
})
export class UserFactoryService {
  createUserProfile(
    uid: string,
    userData: CreateUserRequest,
    createdBy: string
  ): UserProfile {
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
      storeIds:
        userData.storeIds && userData.storeIds.length > 0
          ? userData.storeIds
          : [],
      isFirstLogin: true,
      lastPasswordChange: new Date(),
      userCategory: UserCategory.INTERNO,
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
        return this.createContabilidadProfile(
          baseProfile,
          userData.specificData
        );

      case UserType.ADMINISTRACION:
        return this.createAdministracionProfile(
          baseProfile,
          userData.specificData
        );

      case UserType.RECURSOS_HUMANOS:
        return this.createRecursosHumanosProfile(
          baseProfile,
          userData.specificData
        );

      default:
        throw new Error(`Tipo de usuario no válido: ${userData.userType}`);
    }
  }

  createTiendaProfile(
    uid: string,
    tiendaData: CreateTiendaRequest,
    createdBy: string
  ): TiendaProfile {
    const baseProfile: BaseProfile = {
      uid,
      firstName: tiendaData.firstName,
      lastName: tiendaData.lastName,
      email: tiendaData.email,
      phone: tiendaData.phone,
      documentType: tiendaData.documentType,
      documentNumber: tiendaData.documentNumber,
      userType: UserType.TIENDA,
      userCategory: UserCategory.EXTERNO,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      storeIds: [],
      isFirstLogin: true,
      lastPasswordChange: new Date(),
    };

    return {
      ...baseProfile,
      businessName: tiendaData.businessName,
      address: tiendaData.address,
      city: tiendaData.city,
      district: tiendaData.district,
      postalCode: tiendaData.postalCode,
      coordinates: tiendaData.coordinates,
      tiendaStatus: TiendaStatus.PENDIENTE_APROBACION,
      bankAccount: tiendaData.bankAccount,
      contactPersonName: tiendaData.contactPersonName,
      contactPersonPhone: tiendaData.contactPersonPhone,
      legalRepresentative: tiendaData.legalRepresentative,
      taxId: tiendaData.taxId,
      website: tiendaData.website,
      socialMedia: tiendaData.socialMedia,
      notes: tiendaData.notes,
    } as TiendaProfile;
  }

  createVendedorProfile(
    uid: string,
    vendedorData: CreateVendedorRequest,
    createdBy: string
  ): VendedorProfile {
    const baseProfile: BaseProfile = {
      uid,
      firstName: vendedorData.firstName,
      lastName: vendedorData.lastName,
      email: vendedorData.email,
      phone: vendedorData.phone,
      documentType: vendedorData.documentType,
      documentNumber: vendedorData.documentNumber,
      userType: UserType.VENDEDOR,
      userCategory: UserCategory.EXTERNO,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      storeIds: [vendedorData.tiendaId], // El vendedor pertenece a una tienda
      isFirstLogin: true,
      lastPasswordChange: new Date(),
    };

    return {
      ...baseProfile,
      tiendaId: vendedorData.tiendaId,
      employeeId: vendedorData.employeeId,
      position: vendedorData.position,
      vendedorStatus: VendedorStatus.ACTIVO,
      hireDate: new Date(),
      commissionRate: vendedorData.commissionRate,
      salesGoal: vendedorData.salesGoal,
      supervisorId: vendedorData.supervisorId,
      emergencyContact: vendedorData.emergencyContact,
      address: vendedorData.address,
      city: vendedorData.city,
      district: vendedorData.district,
      birthDate: vendedorData.birthDate,
      gender: vendedorData.gender,
      education: vendedorData.education,
      experience: vendedorData.experience,
      languages: vendedorData.languages || [],
      skills: vendedorData.skills || [],
      certifications: vendedorData.certifications || [],
      performanceRating: 3, // Rating inicial neutral
      notes: vendedorData.notes,
    } as VendedorProfile;
  }

  private createComercialProfile(
    base: BaseProfile,
    specificData?: any
  ): ComercialProfile {
    return {
      ...base,
      salesTeam: specificData?.salesTeam,
      marketingCampaigns: specificData?.marketingCampaigns || [],
      salesTarget: specificData?.salesTarget,
    };
  }

  private createLogisticaProfile(
    base: BaseProfile,
    specificData?: any
  ): LogisticaProfile {
    return {
      ...base,
      warehouseAccess: specificData?.warehouseAccess || [],
      inventoryLevel: specificData?.inventoryLevel || 'basic',
    };
  }

  private createFinanzasProfile(
    base: BaseProfile,
    specificData?: any
  ): FinanzasProfile {
    return {
      ...base,
      accountingAccess: specificData?.accountingAccess || false,
      treasuryAccess: specificData?.treasuryAccess || false,
      bankAccess: specificData?.bankAccess || false,
      creditAccess: specificData?.creditAccess || false,
    };
  }

  private createGerenciaProfile(
    base: BaseProfile,
    specificData?: any
  ): GerenciaProfile {
    return {
      ...base,
      auditAccess: specificData?.auditAccess || false,
      costsAccess: specificData?.costsAccess || false,
      financialStatementsAccess:
        specificData?.financialStatementsAccess || false,
      systemAccessLevel: specificData?.systemAccessLevel || 'restricted',
    };
  }

  private createContabilidadProfile(
    base: BaseProfile,
    specificData?: any
  ): ContabilidadProfile {
    return {
      ...base,
      billingAccess: specificData?.billingAccess || false,
      purchaseBooksAccess: specificData?.purchaseBooksAccess || false,
      salesBooksAccess: specificData?.salesBooksAccess || false,
      kardexAccess: specificData?.kardexAccess || false,
      electronicBooksAccess: specificData?.electronicBooksAccess || false,
    };
  }

  private createAdministracionProfile(
    base: BaseProfile,
    specificData?: any
  ): AdministracionProfile {
    return {
      ...base,
      companyManagement: specificData?.companyManagement || false,
      supplierManagement: specificData?.supplierManagement || false,
      productManagement: specificData?.productManagement || false,
      categoryManagement: specificData?.categoryManagement || false,
      priceManagement: specificData?.priceManagement || false,
    };
  }

  private createRecursosHumanosProfile(
    base: BaseProfile,
    specificData?: any
  ): RecursosHumanosProfile {
    return {
      ...base,
      contractsAccess: specificData?.contractsAccess || false,
      personnelControlAccess: specificData?.personnelControlAccess || false,
      trainingAccess: specificData?.trainingAccess || false,
      performanceEvaluationAccess:
        specificData?.performanceEvaluationAccess || false,
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
      [UserType.RECURSOS_HUMANOS]: 'Recursos Humanos',
      [UserType.TIENDA]: 'Tienda Afiliada',
      [UserType.VENDEDOR]: 'Vendedor',
    };
    return names[userType];
  }

  getUserTypeDescription(userType: UserType): string {
    const descriptions = {
      [UserType.COMERCIAL]: 'Ventas, marketing',
      [UserType.LOGISTICA]: 'Inventarios, almacén',
      [UserType.FINANZAS]:
        'Contabilidad, tesorería, bancos, créditos y cobranzas',
      [UserType.GERENCIA]: 'EE.FF., Auditoría, Costos, Accesos',
      [UserType.CONTABILIDAD]:
        'Facturación, Libro de compras, Ventas, kardex, libros electrónicos',
      [UserType.ADMINISTRACION]:
        'Empresas, proveedores, productos, categorías, precios',
      [UserType.RECURSOS_HUMANOS]:
        'Contratos, control de personal, capacitación, evaluación de desempeño',
      [UserType.TIENDA]: 'Tienda afiliada al negocio',
      [UserType.VENDEDOR]: 'Vendedor de tienda afiliada',
    };
    return descriptions[userType];
  }

  getUserCategoryDisplayName(category: UserCategory): string {
    const names = {
      [UserCategory.INTERNO]: 'Usuario Interno',
      [UserCategory.EXTERNO]: 'Usuario Externo',
    };
    return names[category];
  }

  getUserCategoryDescription(category: UserCategory): string {
    const descriptions = {
      [UserCategory.INTERNO]: 'Usuario Interno',
      [UserCategory.EXTERNO]: 'Usuario Externo',
    };
    return descriptions[category];
  }

  getAllUserTypes(category?: UserCategory): UserType[] {
    const allTypes = Object.values(UserType);
    
    if (!category) {
      return allTypes;
    }

    // Filtrar tipos de usuario según la categoría
    return allTypes.filter(type => {
      if (category === UserCategory.INTERNO) {
        return ![UserType.TIENDA, UserType.VENDEDOR].includes(type);
      } else {
        return [UserType.TIENDA, UserType.VENDEDOR].includes(type);
      }
    });
  }

  getAllUserTypesWithDetails(): Array<{
    type: UserType;
    name: string;
    description: string;
    category: UserCategory;
  }> {
    return Object.values(UserType).map(type => ({
      type,
      name: this.getUserTypeDisplayName(type),
      description: this.getUserTypeDescription(type),
      category: [UserType.TIENDA, UserType.VENDEDOR].includes(type) 
        ? UserCategory.EXTERNO 
        : UserCategory.INTERNO
    }));
  }
}
