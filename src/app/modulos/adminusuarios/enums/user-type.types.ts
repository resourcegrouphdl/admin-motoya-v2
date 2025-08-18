import { Timestamp } from "@angular/fire/firestore";

export enum UserType {
  COMERCIAL = 'comercial',
  LOGISTICA = 'logistica', 
  FINANZAS = 'finanzas',
  GERENCIA = 'gerencia',
  CONTABILIDAD = 'contabilidad',
  ADMINISTRACION = 'administracion',
  RECURSOS_HUMANOS = 'recursos_humanos',
  // Nuevos tipos externos
  TIENDA = 'tienda',
  VENDEDOR = 'vendedor'
}
export enum TiendaStatus {
  ACTIVA = 'activa',
  SUSPENDIDA = 'suspendida',
  PENDIENTE_APROBACION = 'pendiente_aprobacion',
  RECHAZADA = 'rechazada'
}

export enum DocumentType {
  DNI = 'dni',
  RUC = 'ruc',
  CARNET_EXTRANJERIA = 'carnet_extranjeria',
  PASAPORTE = 'pasaporte'
}

export enum UserCategory {
  INTERNO = 'interno',     // Usuarios de la organización
  EXTERNO = 'externo'      // Tiendas y vendedores afiliados
}

export enum VendedorStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  SUSPENDIDO = 'suspendido'
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
  userCategory: UserCategory;
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
  userCategory: UserCategory;
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

export interface TiendaProfile extends BaseProfile {
  businessName: string;           // Nombre comercial
  businessCategory: string;       // Categoría del negocio
  address: string;                // Dirección física
  city: string;                   // Ciudad
  district: string;               // Distrito
  postalCode?: string;            // Código postal
  coordinates?: {                 // Coordenadas GPS
    lat: number;
    lng: number;
  };
  tiendaStatus: TiendaStatus;      // Estado de la tienda
  contractStartDate?: Date | Timestamp;  // Fecha inicio contrato
  contractEndDate?: Date | Timestamp;    // Fecha fin contrato
  
  
  bankAccount?: string;           // Cuenta bancaria
  contactPersonName: string;      // Nombre persona contacto
  contactPersonPhone: string;     // Teléfono persona contacto
  legalRepresentative: string;    // Representante legal
  
  taxId?: string;                 // RUC o ID fiscal
  website?: string;               // Sitio web
  socialMedia?: {                 // Redes sociales
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  
  notes?: string;                 // Notas adicionales
}


export interface VendedorProfile extends BaseProfile {
  tiendaId: string;               // ID de la tienda a la que pertenece
  employeeId?: string;            // ID de empleado en la tienda
  position: string;               // Cargo/posición
  vendedorStatus: VendedorStatus; // Estado del vendedor
  hireDate: Date | Timestamp;     // Fecha de contratación
  commissionRate: number;         // Tasa de comisión
  salesGoal?: number;             // Meta de ventas mensual
  supervisorId?: string;          // ID del supervisor
  emergencyContact: {             // Contacto de emergencia
    name: string;
    phone: string;
    relationship: string;
  };
  address: string;                // Dirección del vendedor
  city: string;                   // Ciudad
  district: string;               // Distrito
  birthDate?: Date | Timestamp;   // Fecha de nacimiento
  gender?: 'masculino' | 'femenino';
  education?: string;             // Nivel educativo
  experience?: number;            // Años de experiencia
  languages?: string[];           // Idiomas que habla
  skills?: string[];              // Habilidades especiales
  certifications?: string[];      // Certificaciones
  
  performanceRating?: number;     // Calificación de desempeño (1-5)
  notes?: string;                 // Notas adicionales
}

export type UserProfile = ComercialProfile | LogisticaProfile | FinanzasProfile | 
                         GerenciaProfile | ContabilidadProfile | AdministracionProfile | 
                         RecursosHumanosProfile | TiendaProfile | VendedorProfile;

// Utility types para conversión
export type UserProfileFirestore = Omit<UserProfile, 'createdAt' | 'updatedAt' | 'lastPasswordChange'> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastPasswordChange?: Timestamp;
};

// Interfaces para DTOs
export interface CreateTiendaRequest {
  // Datos básicos
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  password: string;
  
  // Datos específicos de tienda
  businessName: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
  coordinates?: { lat: number; lng: number };
  bankAccount?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  legalRepresentative: string;
  taxId?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  notes?: string;
}

export interface CreateVendedorRequest {
  // Datos básicos
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  password: string;
  
  // Datos específicos de vendedor
  tiendaId: string;
  employeeId?: string;
  position: string;
  commissionRate: number;
  salesGoal?: number;
  supervisorId?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  address: string;
  city: string;
  district: string;
  birthDate?: Date;
  gender?: 'masculino' | 'femenino';
  education?: string;
  experience?: number;
  languages?: string[];
  skills?: string[];
  certifications?: string[];
  notes?: string;
}