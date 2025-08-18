import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatCardActions, MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { Proposal } from '../../models/proposal.model';


interface DashboardMetrics {
  realTimeStats: {
    pendingCount: number;
    todayApproved: number;
    todayRejected: number;
    avgResponseTime: number;
    totalAmount: number;
  };
  alerts: Alert[];
  recentActivity: Activity[];
  topStores: StoreMetric[];
  chartData: ChartData;
}

interface Alert {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  count?: number;
}

interface Activity {
  id: string;
  type: 'approval' | 'rejection' | 'new_proposal' | 'store_created';
  title: string;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
  proposalId?: string;
  amount?: number;
}

interface StoreMetric {
  storeId: string;
  storeName: string;
  totalProposals: number;
  approvedProposals: number;
  approvalRate: number;
  totalAmount: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface ChartData {
  dailyApprovals: { date: string; approved: number; rejected: number }[];
  monthlyAmounts: { month: string; amount: number }[];
  storeDistribution: { store: string; percentage: number }[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  count?: number;
}

@Component({
  selector: 'app-proposal-dashboar',
  standalone: true,
  imports: [
    NgIf,NgFor,
  ],
  templateUrl: './proposal-dashboar.component.html',
  styleUrl: './proposal-dashboar.component.css',
})
export class ProposalDashboarComponent {
   dashboardData: DashboardMetrics | null = null;
  currentUser = {
    name: 'Carlos Mendoza',
    role: 'Administrador Financiero',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    lastLogin: new Date()
  };
  
  // Filtros y configuración
  dateRangeForm!: FormGroup;
  selectedTimeRange = '7d';
  refreshInterval = 30; // segundos
  isLoading = false;
  isRefreshing = false;
  
  // Subscripciones
  private subscriptions: Subscription[] = [];
  
  // Configuración de acciones rápidas
  quickActions: QuickAction[] = [
    {
      id: 'pending',
      title: 'Propuestas Pendientes',
      description: 'Revisar propuestas en espera',
      icon: 'clock',
      route: '/dashboard/tiendas/evaluar-propuesta',
      color: 'bg-yellow-500',
      count: 0
    },
    {
      id: 'high-value',
      title: 'Altos Montos',
      description: 'Propuestas > S/ 15,000',
      icon: 'trending-up',
      route: '/proposals?amount=high',
      color: 'bg-red-500',
      count: 0
    },
    {
      id: 'urgent',
      title: 'Urgentes',
      description: 'Más de 24 horas',
      icon: 'alert-triangle',
      route: '/proposals?priority=urgent',
      color: 'bg-orange-500',
      count: 0
    },
    {
      id: 'stores',
      title: 'Gestionar Tiendas',
      description: 'Administrar tiendas asociadas',
      icon: 'store',
      route: '/stores',
      color: 'bg-blue-500'
    },
    {
      id: 'reports',
      title: 'Reportes',
      description: 'Análisis y estadísticas',
      icon: 'bar-chart-3',
      route: '/reports',
      color: 'bg-green-500'
    },
    {
      id: 'settings',
      title: 'Configuración',
      description: 'Ajustes del sistema',
      icon: 'settings',
      route: '/settings',
      color: 'bg-gray-500'
    }
  ];
  
  // Configuración de tiempo real
  lastUpdated = new Date();

  router = inject(Router)
  constructor(
    private fb: FormBuilder,
    
    // Aquí inyectarías los servicios:
    // private dashboardService: DashboardService,
    // private notificationService: NotificationService,
    // private electronService: ElectronService
  ) {
    this.initializeForms();
  }
  
  ngOnInit(): void {
    this.loadDashboardData();
    this.setupRealTimeUpdates();
    this.setupKeyboardShortcuts();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  private initializeForms(): void {
    this.dateRangeForm = this.fb.group({
      startDate: [this.getDateDaysAgo(7)],
      endDate: [new Date()]
    });
  }
  
  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Simulación de datos - reemplazar con servicio real
    setTimeout(() => {
      this.dashboardData = {
        realTimeStats: {
          pendingCount: 47,
          todayApproved: 23,
          todayRejected: 5,
          avgResponseTime: 45, // minutos
          totalAmount: 485750
        },
        alerts: [
          {
            id: 'alert-1',
            type: 'urgent',
            title: 'Propuestas Urgentes',
            message: '8 propuestas llevan más de 24 horas sin respuesta',
            timestamp: new Date(),
            actionUrl: '/proposals?priority=urgent',
            count: 8
          },
          {
            id: 'alert-2',
            type: 'warning',
            title: 'Tienda con Alto Volumen',
            message: 'Moto Center Lima tiene 12 propuestas pendientes',
            timestamp: new Date(),
            actionUrl: '/stores/moto-center-lima'
          },
          {
            id: 'alert-3',
            type: 'info',
            title: 'Nuevo Límite de Crédito',
            message: '5 tiendas superaron su límite mensual',
            timestamp: new Date(),
            count: 5
          }
        ],
        recentActivity: [
          {
            id: 'act-1',
            type: 'approval',
            title: 'Propuesta Aprobada',
            description: 'Honda CB190R - Moto Center',
            timestamp: new Date(Date.now() - 300000),
            userId: 'user-1',
            userName: 'Ana García',
            proposalId: 'PROP-001',
            amount: 8950
          },
          {
            id: 'act-2',
            type: 'new_proposal',
            title: 'Nueva Propuesta',
            description: 'Yamaha FZ150 - Speed Bikes',
            timestamp: new Date(Date.now() - 600000),
            userId: 'system',
            userName: 'Sistema',
            proposalId: 'PROP-002',
            amount: 7200
          }
        ],
        topStores: [
          {
            storeId: 'store-1',
            storeName: 'Moto Center Lima',
            totalProposals: 45,
            approvedProposals: 42,
            approvalRate: 93.3,
            totalAmount: 156780,
            status: 'excellent'
          },
          {
            storeId: 'store-2',
            storeName: 'Speed Bikes SAC',
            totalProposals: 32,
            approvedProposals: 28,
            approvalRate: 87.5,
            totalAmount: 98450,
            status: 'good'
          }
        ],
        chartData: {
          dailyApprovals: [
            { date: '2025-07-21', approved: 15, rejected: 2 },
            { date: '2025-07-22', approved: 18, rejected: 3 },
            { date: '2025-07-23', approved: 22, rejected: 1 },
            { date: '2025-07-24', approved: 19, rejected: 4 },
            { date: '2025-07-25', approved: 25, rejected: 2 },
            { date: '2025-07-26', approved: 21, rejected: 3 },
            { date: '2025-07-27', approved: 23, rejected: 5 }
          ],
          monthlyAmounts: [],
          storeDistribution: []
        }
      };
      
      // Actualizar contadores en acciones rápidas
      this.updateQuickActionsCount();
      this.isLoading = false;
      this.lastUpdated = new Date();
    }, 1000);
  }
  
  private updateQuickActionsCount(): void {
    if (this.dashboardData) {
      this.quickActions.find(a => a.id === 'pending')!.count = this.dashboardData.realTimeStats.pendingCount;
      this.quickActions.find(a => a.id === 'urgent')!.count = this.dashboardData.alerts.filter(a => a.type === 'urgent').length;
      this.quickActions.find(a => a.id === 'high-value')!.count = 5; // Simulado
    }
  }
  
  private setupRealTimeUpdates(): void {
    // Actualización automática cada 30 segundos
    const updateSubscription = interval(this.refreshInterval * 1000).subscribe(() => {
      this.refreshData();
    });
    
    this.subscriptions.push(updateSubscription);
    
    // Aquí configurarías WebSocket o Firebase real-time
    // const realtimeSubscription = this.dashboardService.getRealTimeUpdates()
    //   .subscribe(data => {
    //     this.dashboardData = data;
    //     this.updateQuickActionsCount();
    //     this.lastUpdated = new Date();
    //   });
  }
  
  private setupKeyboardShortcuts(): void {
    // Configurar atajos de teclado específicos de Electron
    // this.electronService.registerShortcuts({
    //   'Ctrl+R': () => this.refreshData(),
    //   'Ctrl+1': () => this.navigateToProposals('pending'),
    //   'Ctrl+2': () => this.navigateToProposals('urgent'),
    //   'F5': () => this.refreshData()
    // });
  }
  
  refreshData(): void {
    this.isRefreshing = true;
    
    setTimeout(() => {
      this.loadDashboardData();
      this.isRefreshing = false;
    }, 500);
  }
  
  onTimeRangeChange(range: string): void {
    this.selectedTimeRange = range;
    this.loadDashboardData();
  }
  
  onQuickActionClick(action: QuickAction): void {
    this.router.navigate([action.route]);
  }
  
  onAlertClick(alert: Alert): void {
    if (alert.actionUrl) {
      this.router.navigate([alert.actionUrl]);
    }
  }
  
  navigateToProposals(filter?: string): void {
    const route = filter ? `/proposals?status=${filter}` : '/proposals';
    this.router.navigate([route]);
  }
  
  getAlertIcon(type: string): string {
    switch (type) {
      case 'urgent': return 'alert-triangle';
      case 'warning': return 'alert-circle';
      case 'info': return 'info';
      case 'success': return 'check-circle';
      default: return 'bell';
    }
  }
  
  getAlertColor(type: string): string {
    switch (type) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'success': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
  
  getActivityIcon(type: string): string {
    switch (type) {
      case 'approval': return 'check-circle';
      case 'rejection': return 'x-circle';
      case 'new_proposal': return 'file-plus';
      case 'store_created': return 'store';
      default: return 'activity';
    }
  }
  
  getStoreStatusColor(status: string): string {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }
  
  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }
  
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  }
  
  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  // TrackBy functions para optimizar rendimiento
  trackByAlertId(index: number, alert: Alert): string {
    return alert.id;
  }

  trackByActivityId(index: number, activity: Activity): string {
    return activity.id;
  }

  trackByActionId(index: number, action: QuickAction): string {
    return action.id;
  }

  trackByStoreId(index: number, store: StoreMetric): string {
    return store.storeId;
  }
}
