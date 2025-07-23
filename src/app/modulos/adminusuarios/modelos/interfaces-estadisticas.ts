// ===== INTERFACES DE ESTADÍSTICAS =====

import { UserType } from "./enums";

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  growthRate: number;
  usersByType: Record<UserType, number>;
  usersByStore: Record<string, number>;
  lastUpdated: Date;
}

export interface StoreStatistics {
  storeId: string;
  storeName: string;
  storeCode: string;
  address: string;
  manager?: string;
  
  // Usuarios
  totalUsers: number;
  activeUsers: number;
  usersByType: Record<UserType, number>;
  
  // Vendedores específicos
  vendors: VendorStatistics[];
  totalVendors: number;
  averageCommission: number;
  topPerformers: VendorStatistics[];
  
  // Métricas generales
  totalSales?: number;
  monthlyTarget?: number;
  achievementPercentage?: number;
  monthlyGrowth?: number;
  
  // Fechas
  createdAt: Date;
  lastActivity: Date;
  lastUpdated: Date;
}

export interface VendorStatistics {
  vendorId: string;
  vendorName: string;
  employeeId: string;
  email: string;
  phone: string;
  
  // Asignaciones
  storeId: string;
  storeName: string;
  territory: string;
  commissionRate: number;
  
  // Métricas de rendimiento
  totalSales: number;
  monthlyTarget: number;
  achievementPercentage: number;
  salesThisMonth: number;
  salesLastMonth: number;
  growthRate: number;
  
  // Actividad
  customersManaged: number;
  activeDeals: number;
  completedDeals: number;
  conversionRate: number;
  
  // Fechas
  hireDate: Date;
  lastActivity: Date;
  lastSale: Date;
}

export interface FinancialStatistics {
  analystId: string;
  analystName: string;
  department: string;
  
  // Límites y capacidades
  approvalLimit: number;
  riskLevel: string;
  specializations: string[];
  
  // Métricas de productividad
  applicationsProcessed: number;
  applicationsThisMonth: number;
  applicationsLastMonth: number;
  approvalRate: number;
  rejectionRate: number;
  averageProcessingTime: number; // en horas
  
  // Análisis de riesgo
  riskAssessments: number;
  highRiskApprovals: number;
  lowRiskApprovals: number;
  totalAmountApproved: number;
  averageApprovalAmount: number;
  
  // Fechas
  joinDate: Date;
  lastActivity: Date;
  lastApproval: Date;
}

export interface AccountantStatistics {
  accountantId: string;
  accountantName: string;
  department: string;
  accessLevel: string;
  
  // Métricas de trabajo
  transactionsProcessed: number;
  reportsGenerated: number;
  reconciliationsCompleted: number;
  auditTasksCompleted: number;
  
  // Productividad mensual
  thisMonthTransactions: number;
  lastMonthTransactions: number;
  averageProcessingTime: number;
  errorRate: number;
  
  // Especialización
  specializations: string[];
  certifications: string[];
  canApproveTransactions: boolean;
  
  // Fechas
  joinDate: Date;
  lastActivity: Date;
  lastTransaction: Date;
}

export interface SystemStatistics {
  overview: {
    totalUsers: number;
    totalStores: number;
    totalVendors: number;
    totalSales: number;
    totalRevenue: number;
  };
  
  performance: {
    averageUserGrowth: number;
    averageSalesGrowth: number;
    topPerformingStore: StoreStatistics;
    topPerformingVendor: VendorStatistics;
  };
  
  risks: {
    inactiveUsers: number;
    underperformingStores: number;
    pendingApprovals: number;
    highRiskTransactions: number;
  };
  
  trends: {
    userGrowthTrend: number[];
    salesTrend: number[];
    monthlyLabels: string[];
  };
  
  lastUpdated: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface StatisticsFilters {
  dateRange?: DateRange;
  storeIds?: string[];
  userTypes?: UserType[];
  includeInactive?: boolean;
}