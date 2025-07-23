import { inject, Injectable } from '@angular/core';
import { UserService } from './user.service';
import { Firestore } from '@angular/fire/firestore';
import { AccountantUser, BaseUser, FinancialUser, StoreUser, VendorUser } from '../modelos/clases-herencia';
import { UserType } from '../modelos/enums';
import { AccountantStatistics, FinancialStatistics, StatisticsFilters, StoreStatistics, SystemStatistics, UserStatistics, VendorStatistics } from '../modelos/interfaces-estadisticas';

@Injectable({
  providedIn: 'root'
})
export class StatisticService {

  private firestore = inject(Firestore);
  private userService = inject(UserService);

  // Colecciones de referencia
  private readonly USERS_COLLECTION = 'users';
  private readonly SALES_COLLECTION = 'sales';
  private readonly TRANSACTIONS_COLLECTION = 'transactions';
  private readonly APPLICATIONS_COLLECTION = 'credit_applications';

  constructor() { }

  async getUserStatistics(filters?: StatisticsFilters): Promise<UserStatistics> {
    try {
      const allUsers = await this.getAllUsers(filters);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Filtrar usuarios por fechas
      const newUsersThisMonth = allUsers.filter(user => {
        const userDate = user.createdAt;
        return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
      }).length;

      const newUsersLastMonth = allUsers.filter(user => {
        const userDate = user.createdAt;
        return userDate.getMonth() === lastMonth && userDate.getFullYear() === lastMonthYear;
      }).length;

      // Calcular tasa de crecimiento
      const growthRate = newUsersLastMonth > 0 
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
        : 0;

      // Agrupar por tipo
      const usersByType = this.groupUsersByType(allUsers);

      // Agrupar por tienda
      const usersByStore = this.groupUsersByStore(allUsers);

      return {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.isActive).length,
        inactiveUsers: allUsers.filter(u => !u.isActive).length,
        newUsersThisMonth,
        newUsersLastMonth,
        growthRate,
        usersByType,
        usersByStore,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  // ====================================================================
  // ESTADÍSTICAS POR TIENDA
  // ====================================================================

  async getStoreStatistics(storeId: string): Promise<StoreStatistics> {
    try {
      // Obtener información de la tienda
      const storeUser = await this.userService.getUserByUid(storeId) as StoreUser;
      if (!storeUser || storeUser.userType !== UserType.STORE) {
        throw new Error('Tienda no encontrada');
      }

      // Obtener todos los usuarios de la tienda
      const storeUsers = await this.userService.getUsersByStore(storeId);
      
      // Obtener vendedores específicos
      const vendors = storeUsers.filter(u => u.userType === UserType.VENDOR) as VendorUser[];
      
      // Calcular estadísticas de vendedores
      const vendorStats = await Promise.all(
        vendors.map(vendor => this.getVendorStatistics(vendor.uid))
      );

      // Calcular comisión promedio
      const averageCommission = vendors.length > 0
        ? vendors.reduce((sum, vendor) => sum + vendor.vendorInfo.commissionRate, 0) / vendors.length
        : 0;

      // Top performers (top 3 vendedores por ventas)
      const topPerformers = vendorStats
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 3);

      // Obtener métricas de ventas
      const salesMetrics = await this.getStoreSalesMetrics(storeId);

      return {
        storeId: storeUser.storeInfo.storeId,
        storeName: storeUser.storeInfo.storeName,
        storeCode: storeUser.storeInfo.storeCode,
        address: `${storeUser.storeInfo.address.street}, ${storeUser.storeInfo.address.city}`,
        manager: storeUser.getFullName(),
        
        totalUsers: storeUsers.length,
        activeUsers: storeUsers.filter(u => u.isActive).length,
        usersByType: this.groupUsersByType(storeUsers),
        
        vendors: vendorStats,
        totalVendors: vendors.length,
        averageCommission,
        topPerformers,
        
        totalSales: salesMetrics.totalSales,
        monthlyTarget: salesMetrics.monthlyTarget,
        achievementPercentage: salesMetrics.achievementPercentage,
        monthlyGrowth: salesMetrics.monthlyGrowth,
        
        createdAt: storeUser.createdAt,
        lastActivity: await this.getStoreLastActivity(storeId),
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error getting store statistics:', error);
      throw error;
    }
  }

  async getAllStoresStatistics(): Promise<StoreStatistics[]> {
    try {
      const storeUsers = await this.userService.getUsersByType(UserType.STORE);
      const storeStats = await Promise.all(
        storeUsers.map(store => this.getStoreStatistics(store.uid))
      );

      return storeStats.sort((a, b) => b.totalSales! - a.totalSales!);
    } catch (error) {
      console.error('Error getting all stores statistics:', error);
      throw error;
    }
  }

  // ====================================================================
  // ESTADÍSTICAS DE VENDEDORES
  // ====================================================================

  async getVendorStatistics(vendorId: string): Promise<VendorStatistics> {
    try {
      const vendorUser = await this.userService.getUserByUid(vendorId) as VendorUser;
      if (!vendorUser || vendorUser.userType !== UserType.VENDOR) {
        throw new Error('Vendedor no encontrado');
      }

      // Obtener métricas de ventas del vendedor
      const salesMetrics = await this.getVendorSalesMetrics(vendorId);
      
      // Obtener información de la tienda asignada
      const storeAssignment = vendorUser.storeAssignments[0];
      const storeName = storeAssignment?.storeName || 'Sin asignar';

      return {
        vendorId: vendorUser.uid,
        vendorName: vendorUser.getFullName(),
        employeeId: vendorUser.vendorInfo.employeeId,
        email: vendorUser.email,
        phone: vendorUser.phone,
        
        storeId: storeAssignment?.storeId || '',
        storeName,
        territory: vendorUser.vendorInfo.territory,
        commissionRate: vendorUser.vendorInfo.commissionRate,
        
        totalSales: salesMetrics.totalSales,
        monthlyTarget: salesMetrics.monthlyTarget,
        achievementPercentage: salesMetrics.achievementPercentage,
        salesThisMonth: salesMetrics.salesThisMonth,
        salesLastMonth: salesMetrics.salesLastMonth,
        growthRate: salesMetrics.growthRate,
        
        customersManaged: salesMetrics.customersManaged,
        activeDeals: salesMetrics.activeDeals,
        completedDeals: salesMetrics.completedDeals,
        conversionRate: salesMetrics.conversionRate,
        
        hireDate: vendorUser.vendorInfo.hireDate,
        lastActivity: await this.getVendorLastActivity(vendorId),
        lastSale: salesMetrics.lastSale
      };

    } catch (error) {
      console.error('Error getting vendor statistics:', error);
      throw error;
    }
  }

  async getAllVendorsStatistics(storeId?: string): Promise<VendorStatistics[]> {
    try {
      let vendors: VendorUser[];
      
      if (storeId) {
        const storeUsers = await this.userService.getUsersByStore(storeId);
        vendors = storeUsers.filter(u => u.userType === UserType.VENDOR) as VendorUser[];
      } else {
        vendors = await this.userService.getUsersByType(UserType.VENDOR) as VendorUser[];
      }

      const vendorStats = await Promise.all(
        vendors.map(vendor => this.getVendorStatistics(vendor.uid))
      );

      return vendorStats.sort((a, b) => b.totalSales - a.totalSales);
    } catch (error) {
      console.error('Error getting all vendors statistics:', error);
      throw error;
    }
  }

  // ====================================================================
  // ESTADÍSTICAS FINANCIERAS
  // ====================================================================

  async getFinancialStatistics(analystId: string): Promise<FinancialStatistics> {
    try {
      const analystUser = await this.userService.getUserByUid(analystId) as FinancialUser;
      if (!analystUser || analystUser.userType !== UserType.FINANCIAL) {
        throw new Error('Analista financiero no encontrado');
      }

      // Obtener métricas de aplicaciones procesadas
      const applicationMetrics = await this.getFinancialApplicationMetrics(analystId);

      return {
        analystId: analystUser.uid,
        analystName: analystUser.getFullName(),
        department: analystUser.financialInfo.department,
        
        approvalLimit: analystUser.financialInfo.approvalLimit,
        riskLevel: analystUser.financialInfo.riskLevel,
        specializations: analystUser.financialInfo.specializations,
        
        applicationsProcessed: applicationMetrics.applicationsProcessed,
        applicationsThisMonth: applicationMetrics.applicationsThisMonth,
        applicationsLastMonth: applicationMetrics.applicationsLastMonth,
        approvalRate: applicationMetrics.approvalRate,
        rejectionRate: applicationMetrics.rejectionRate,
        averageProcessingTime: applicationMetrics.averageProcessingTime,
        
        riskAssessments: applicationMetrics.riskAssessments,
        highRiskApprovals: applicationMetrics.highRiskApprovals,
        lowRiskApprovals: applicationMetrics.lowRiskApprovals,
        totalAmountApproved: applicationMetrics.totalAmountApproved,
        averageApprovalAmount: applicationMetrics.averageApprovalAmount,
        
        joinDate: analystUser.createdAt,
        lastActivity: await this.getFinancialLastActivity(analystId),
        lastApproval: applicationMetrics.lastApproval
      };

    } catch (error) {
      console.error('Error getting financial statistics:', error);
      throw error;
    }
  }

  // ====================================================================
  // ESTADÍSTICAS CONTABLES
  // ====================================================================

  async getAccountantStatistics(accountantId: string): Promise<AccountantStatistics> {
    try {
      const accountantUser = await this.userService.getUserByUid(accountantId) as AccountantUser;
      if (!accountantUser || accountantUser.userType !== UserType.ACCOUNTANT) {
        throw new Error('Contable no encontrado');
      }

      // Obtener métricas de transacciones procesadas
      const transactionMetrics = await this.getAccountantTransactionMetrics(accountantId);

      return {
        accountantId: accountantUser.uid,
        accountantName: accountantUser.getFullName(),
        department: accountantUser.accountantInfo.department,
        accessLevel: accountantUser.accountantInfo.accessLevel,
        
        transactionsProcessed: transactionMetrics.transactionsProcessed,
        reportsGenerated: transactionMetrics.reportsGenerated,
        reconciliationsCompleted: transactionMetrics.reconciliationsCompleted,
        auditTasksCompleted: transactionMetrics.auditTasksCompleted,
        
        thisMonthTransactions: transactionMetrics.thisMonthTransactions,
        lastMonthTransactions: transactionMetrics.lastMonthTransactions,
        averageProcessingTime: transactionMetrics.averageProcessingTime,
        errorRate: transactionMetrics.errorRate,
        
        specializations: accountantUser.accountantInfo.specializations,
        certifications: accountantUser.accountantInfo.certifications,
        canApproveTransactions: accountantUser.accountantInfo.canApproveTransactions,
        
        joinDate: accountantUser.createdAt,
        lastActivity: await this.getAccountantLastActivity(accountantId),
        lastTransaction: transactionMetrics.lastTransaction
      };

    } catch (error) {
      console.error('Error getting accountant statistics:', error);
      throw error;
    }
  }

  // ====================================================================
  // ESTADÍSTICAS DEL SISTEMA
  // ====================================================================

  async getSystemStatistics(): Promise<SystemStatistics> {
    try {
      const [
        userStats,
        storeStats,
        vendorStats,
        salesOverview,
        riskMetrics,
        trendData
      ] = await Promise.all([
        this.getUserStatistics(),
        this.getAllStoresStatistics(),
        this.getAllVendorsStatistics(),
        this.getSalesOverview(),
        this.getRiskMetrics(),
        this.getTrendData()
      ]);

      // Encontrar top performers
      const topStore = storeStats.reduce((prev, current) => 
        prev.totalSales! > current.totalSales! ? prev : current
      );

      const topVendor = vendorStats.reduce((prev, current) => 
        prev.totalSales > current.totalSales ? prev : current
      );

      return {
        overview: {
          totalUsers: userStats.totalUsers,
          totalStores: storeStats.length,
          totalVendors: vendorStats.length,
          totalSales: salesOverview.totalSales,
          totalRevenue: salesOverview.totalRevenue
        },
        
        performance: {
          averageUserGrowth: userStats.growthRate,
          averageSalesGrowth: salesOverview.growthRate,
          topPerformingStore: topStore,
          topPerformingVendor: topVendor
        },
        
        risks: {
          inactiveUsers: userStats.inactiveUsers,
          underperformingStores: riskMetrics.underperformingStores,
          pendingApprovals: riskMetrics.pendingApprovals,
          highRiskTransactions: riskMetrics.highRiskTransactions
        },
        
        trends: {
          userGrowthTrend: trendData.userGrowthTrend,
          salesTrend: trendData.salesTrend,
          monthlyLabels: trendData.monthlyLabels
        },
        
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error getting system statistics:', error);
      throw error;
    }
  }

  // ====================================================================
  // MÉTODOS AUXILIARES
  // ====================================================================

  private async getAllUsers(filters?: StatisticsFilters): Promise<BaseUser[]> {
    // Si hay filtros específicos, aplicarlos
    if (filters?.userTypes && filters.userTypes.length > 0) {
      const usersByType = await Promise.all(
        filters.userTypes.map(type => this.userService.getUsersByType(type))
      );
      return usersByType.flat();
    }

    // Obtener todos los tipos de usuarios
    const [admins, stores, vendors, accountants, financial] = await Promise.all([
      this.userService.getUsersByType(UserType.ADMIN),
      this.userService.getUsersByType(UserType.STORE),
      this.userService.getUsersByType(UserType.VENDOR),
      this.userService.getUsersByType(UserType.ACCOUNTANT),
      this.userService.getUsersByType(UserType.FINANCIAL)
    ]);

    let allUsers = [...admins, ...stores, ...vendors, ...accountants, ...financial];

    // Aplicar filtro de fecha si existe
    if (filters?.dateRange) {
      allUsers = allUsers.filter(user => 
        user.createdAt >= filters.dateRange!.startDate && 
        user.createdAt <= filters.dateRange!.endDate
      );
    }

    // Aplicar filtro de activos/inactivos
    if (filters?.includeInactive === false) {
      allUsers = allUsers.filter(user => user.isActive);
    }

    return allUsers;
  }

  private groupUsersByType(users: BaseUser[]): Record<UserType, number> {
    const grouped: Record<UserType, number> = {
      [UserType.ADMIN]: 0,
      [UserType.STORE]: 0,
      [UserType.VENDOR]: 0,
      [UserType.ACCOUNTANT]: 0,
      [UserType.FINANCIAL]: 0
    };

    users.forEach(user => {
      grouped[user.userType]++;
    });

    return grouped;
  }

  private groupUsersByStore(users: BaseUser[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    users.forEach(user => {
      if (user.storeIds && user.storeIds.length > 0) {
        user.storeIds.forEach(storeId => {
          grouped[storeId] = (grouped[storeId] || 0) + 1;
        });
      }
    });

    return grouped;
  }

  private async getStoreSalesMetrics(storeId: string): Promise<any> {
    // TODO: Implementar con datos reales de ventas
    return {
      totalSales: Math.floor(Math.random() * 1000000) + 500000,
      monthlyTarget: 800000,
      achievementPercentage: Math.floor(Math.random() * 50) + 75,
      monthlyGrowth: Math.floor(Math.random() * 20) - 10
    };
  }

  private async getVendorSalesMetrics(vendorId: string): Promise<any> {
    // TODO: Implementar con datos reales de ventas
    const totalSales = Math.floor(Math.random() * 100000) + 50000;
    const monthlyTarget = 80000;
    
    return {
      totalSales,
      monthlyTarget,
      achievementPercentage: (totalSales / monthlyTarget) * 100,
      salesThisMonth: Math.floor(Math.random() * 30000) + 20000,
      salesLastMonth: Math.floor(Math.random() * 25000) + 15000,
      growthRate: Math.floor(Math.random() * 30) - 15,
      customersManaged: Math.floor(Math.random() * 50) + 25,
      activeDeals: Math.floor(Math.random() * 10) + 5,
      completedDeals: Math.floor(Math.random() * 100) + 50,
      conversionRate: Math.floor(Math.random() * 30) + 60,
      lastSale: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
  }

  private async getFinancialApplicationMetrics(analystId: string): Promise<any> {
    // TODO: Implementar con datos reales de aplicaciones
    const applicationsProcessed = Math.floor(Math.random() * 500) + 200;
    const approved = Math.floor(applicationsProcessed * 0.7);
    
    return {
      applicationsProcessed,
      applicationsThisMonth: Math.floor(Math.random() * 50) + 25,
      applicationsLastMonth: Math.floor(Math.random() * 45) + 20,
      approvalRate: (approved / applicationsProcessed) * 100,
      rejectionRate: ((applicationsProcessed - approved) / applicationsProcessed) * 100,
      averageProcessingTime: Math.floor(Math.random() * 48) + 12,
      riskAssessments: Math.floor(Math.random() * 200) + 100,
      highRiskApprovals: Math.floor(approved * 0.2),
      lowRiskApprovals: Math.floor(approved * 0.5),
      totalAmountApproved: Math.floor(Math.random() * 5000000) + 2000000,
      averageApprovalAmount: Math.floor(Math.random() * 50000) + 20000,
      lastApproval: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    };
  }

  private async getAccountantTransactionMetrics(accountantId: string): Promise<any> {
    // TODO: Implementar con datos reales de transacciones
    return {
      transactionsProcessed: Math.floor(Math.random() * 1000) + 500,
      reportsGenerated: Math.floor(Math.random() * 50) + 25,
      reconciliationsCompleted: Math.floor(Math.random() * 30) + 15,
      auditTasksCompleted: Math.floor(Math.random() * 20) + 10,
      thisMonthTransactions: Math.floor(Math.random() * 100) + 50,
      lastMonthTransactions: Math.floor(Math.random() * 90) + 45,
      averageProcessingTime: Math.floor(Math.random() * 4) + 1,
      errorRate: Math.random() * 5 + 1,
      lastTransaction: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000)
    };
  }

  private async getSalesOverview(): Promise<any> {
    // TODO: Implementar con datos reales
    return {
      totalSales: Math.floor(Math.random() * 10000000) + 5000000,
      totalRevenue: Math.floor(Math.random() * 8000000) + 4000000,
      growthRate: Math.floor(Math.random() * 20) + 5
    };
  }

  private async getRiskMetrics(): Promise<any> {
    // TODO: Implementar con datos reales
    return {
      underperformingStores: Math.floor(Math.random() * 5) + 1,
      pendingApprovals: Math.floor(Math.random() * 20) + 10,
      highRiskTransactions: Math.floor(Math.random() * 15) + 5
    };
  }

  private async getTrendData(): Promise<any> {
    // TODO: Implementar con datos reales
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return {
      userGrowthTrend: Array.from({length: 6}, () => Math.floor(Math.random() * 50) + 10),
      salesTrend: Array.from({length: 6}, () => Math.floor(Math.random() * 1000000) + 500000),
      monthlyLabels: months
    };
  }

  // Métodos para obtener última actividad (simulados)
  private async getStoreLastActivity(storeId: string): Promise<Date> {
    return new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
  }

  private async getVendorLastActivity(vendorId: string): Promise<Date> {
    return new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000);
  }

  private async getFinancialLastActivity(analystId: string): Promise<Date> {
    return new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000);
  }

  private async getAccountantLastActivity(accountantId: string): Promise<Date> {
    return new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000);
  }

  // ====================================================================
  // MÉTODOS OBSERVABLES PARA TIEMPO REAL
  // ====================================================================

}
