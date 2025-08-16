import { Timestamp } from "@angular/fire/firestore";

export enum UserType {
  COMERCIAL = 'comercial',
  LOGISTICA = 'logistica', 
  FINANZAS = 'finanzas',
  GERENCIA = 'gerencia',
  CONTABILIDAD = 'contabilidad',
  ADMINISTRACION = 'administracion',
  RECURSOS_HUMANOS = 'recursos_humanos'
}

export enum DocumentType {
  DNI = 'dni',
  RUC = 'ruc',
  CARNET_EXTRANJERIA = 'carnet_extranjeria',
  PASAPORTE = 'pasaporte'
}

// Interface base para el perfil de usuario
export interface BaseProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  userType: UserType;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy?: string;
  storeIds?: string[];
  isFirstLogin?: boolean;
  lastPasswordChange?: Date | Timestamp;
}

// Interface para Firestore (con Timestamps)
export interface BaseProfileFirestore {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  userType: UserType;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  storeIds?: string[];
  isFirstLogin?: boolean;
  lastPasswordChange?: Timestamp;
}

// Interfaces específicas para cada tipo de usuario
export interface ComercialProfile extends BaseProfile {
  salesTeam?: string;
  marketingCampaigns?: string[];
  salesTarget?: number;
}

export interface LogisticaProfile extends BaseProfile {
  warehouseAccess?: string[];
  inventoryLevel?: 'basic' | 'advanced' | 'full';
}

export interface FinanzasProfile extends BaseProfile {
  accountingAccess?: boolean;
  treasuryAccess?: boolean;
  bankAccess?: boolean;
  creditAccess?: boolean;
}

export interface GerenciaProfile extends BaseProfile {
  auditAccess?: boolean;
  costsAccess?: boolean;
  financialStatementsAccess?: boolean;
  systemAccessLevel?: 'full' | 'restricted';
}

export interface ContabilidadProfile extends BaseProfile {
  billingAccess?: boolean;
  purchaseBooksAccess?: boolean;
  salesBooksAccess?: boolean;
  kardexAccess?: boolean;
  electronicBooksAccess?: boolean;
}

export interface AdministracionProfile extends BaseProfile {
  companyManagement?: boolean;
  supplierManagement?: boolean;
  productManagement?: boolean;
  categoryManagement?: boolean;
  priceManagement?: boolean;
}

export interface RecursosHumanosProfile extends BaseProfile {
  contractsAccess?: boolean;
  personnelControlAccess?: boolean;
  trainingAccess?: boolean;
  performanceEvaluationAccess?: boolean;
}

export type UserProfile = ComercialProfile | LogisticaProfile | FinanzasProfile | 
                         GerenciaProfile | ContabilidadProfile | AdministracionProfile | 
                         RecursosHumanosProfile;

// Utility types para conversión
export type UserProfileFirestore = Omit<UserProfile, 'createdAt' | 'updatedAt' | 'lastPasswordChange'> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastPasswordChange?: Timestamp;
};