// ====================================================================
// INTERFACES ESPECÍFICAS POR TIPO DE USUARIO
// ====================================================================

import { PermissionType } from "./enums";
import { IAddress } from "./interface-base";

export interface IStoreInfo {
  storeId: string;
  storeName: string;
  storeCode: string;
  address: IAddress;
  phone: string;
  email: string;
  managedBy?: string;
  isActive: boolean;
  openingHours?: IOpeningHours;
  maxInventory?: number;
}

export interface IOpeningHours {
  monday: ITimeRange;
  tuesday: ITimeRange;
  wednesday: ITimeRange;
  thursday: ITimeRange;
  friday: ITimeRange;
  saturday: ITimeRange;
  sunday: ITimeRange;
}

export interface ITimeRange {
  open: string; // HH:mm format
  close: string; // HH:mm format
  isClosed: boolean;
}

export interface IStoreAssignment {
  storeId: string;
  storeName: string;
  assignedAt: Date;
  assignedBy: string;
  isActive: boolean;
  permissions: PermissionType[];
  territory?: string;
  commissionRate?: number;
  endDate?: Date;
}

export interface IVendorInfo {
  employeeId?: string;
  commissionRate: number;
  territory?: string;
  hireDate: Date;
  supervisor?: string;
  salesTarget?: number;
  performance?: IPerformanceMetrics;
}

export interface IPerformanceMetrics {
  totalSales: number;
  totalCredits: number;
  averageTicket: number;
  conversionRate: number;
  customerSatisfaction: number;
  period: string; // 'monthly', 'quarterly', 'yearly'
  lastUpdated: Date;
}

export interface IAccountantInfo {
  accessLevel: 'junior' | 'senior' | 'supervisor';
  specializations: string[];
  certifications: ICertification[];
  department?: string;
  supervisor?: string;
}

export interface ICertification {
  name: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  certificateNumber: string;
}

export interface IFinancialInfo {
  specializations: string[];
  approvalLimit: number;
  riskLevel: 'low' | 'medium' | 'high';
  certifications: ICertification[];
  department?: string;
  supervisor?: string;
  analysisTools?: string[];
}
