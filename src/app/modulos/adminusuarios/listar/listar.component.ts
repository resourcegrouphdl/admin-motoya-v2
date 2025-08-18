import { Component, OnInit, inject, ViewChild, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Timestamp } from 'firebase/firestore';
// Angular Material Imports
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CrearComponent } from '../crear/crear.component';
import { MatBadgeModule } from '@angular/material/badge';
import {
  BaseProfile,
  TiendaStatus,
  UserCategory,
  DocumentType,
  UserType,
  VendedorStatus,
} from '../enums/user-type.types';
import { UserListOptions, UserListService } from '../services/user-list.service';
import { UserFactoryService } from '../services/user-factory.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { ExternalUserService } from '../services/external-user.service';

import { MatTabsModule } from '@angular/material/tabs';
import { DateUtils } from '../enums/date-utils';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataSource } from '@angular/cdk/collections';

// Interfaces para el componente
interface DashboardStats {
recentUsers: any;
  totalUsers: number;
  internalUsers: number;
  externalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByType: { [key: string]: number };
  tiendas: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  vendedores: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  recentlyCreated: number;
}

@Component({
  selector: 'app-listar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './listar.component.html',
  styleUrl: './listar.component.css',
})
export class ListarComponent implements OnInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  _userList = inject(UserListService);

  // Signals para estadísticas reactivas
  private users = signal<BaseProfile[]>([]);
  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(u => u.isActive).length);
  inactiveUsers = computed(() => this.users().filter(u => !u.isActive).length);
  firstLoginUsers = computed(() => this.users().filter(u => u.isFirstLogin).length);

  // Propiedades del componente
  dataSource = new MatTableDataSource<BaseProfile>([]);
  displayedColumns: string[] = ['user', 'contact', 'document', 'type', 'status', 'created', 'actions'];
  
  searchTerm = '';
  selectedUserType = '';
  selectedStatus = '';
  snackBar: any;

  

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  
manageUsers() {
throw new Error('Method not implemented.');
}
viewReports() {
throw new Error('Method not implemented.');
}
systemSettings() {
throw new Error('Method not implemented.');
}
  
  private dialog = inject(MatDialog);
  private userListService = inject(UserListService);
  private externalUsersService = inject(ExternalUserService);
  private errorHandler = inject(ErrorHandlerService);
  private userFactory = inject(UserFactoryService);
  private destroy$ = new Subject<void>();

  // State
  isLoading = false;
  stats: DashboardStats = {
    totalUsers: 0,
    internalUsers: 0,
    externalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    usersByType: {},
    tiendas: { total: 0, active: 0, pending: 0, suspended: 0 },
    vendedores: { total: 0, active: 0, inactive: 0, suspended: 0 },
    recentlyCreated: 0,
    recentUsers: undefined
  };

  // Data for quick stats
  allUsers: BaseProfile[] = [];
  selectedTabIndex = 0;

  // Quick actions data
  quickActions = [
    {
      icon: 'person_add',
      title: 'Crear Usuario Interno',
      description: 'Agregar usuario de la organización',
      action: () => this.openCreateUserDialog(),
      color: 'primary'
    },
    {
      icon: 'store_mall_directory',
      title: 'Gestionar Tiendas',
      description: 'Administrar tiendas afiliadas',
      action: () => this.goToExternalUsers(),
      color: 'accent'
    },
    {
      icon: 'people_outline',
      title: 'Ver Todos los Usuarios',
      description: 'Lista completa con filtros',
      action: () => this.goToUserList(),
      color: 'warn'
    },
    {
      icon: 'analytics',
      title: 'Estadísticas Avanzadas',
      description: 'Métricas y reportes detallados',
      action: () => this.showAdvancedStats(),
      color: 'primary'
    }
  ];

  async ngOnInit(): Promise<void> {
    this.loadDashboardData();
    this.setupSubscriptions();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Cargar datos en paralelo
      await Promise.all([
        this.userListService.loadUsers({ pageSize: 100 }),
        this.externalUsersService.loadTiendas(),
        this.loadAllVendedores()
      ]);

    } catch (error) {
      this.errorHandler.handleError(error, 'LoadDashboardData');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAllVendedores(): Promise<void> {
    // Cargar vendedores a través del servicio
    const tiendas = this.externalUsersService.currentTiendas;
    if (tiendas.length > 0) {
      // Cargar vendedores de la primera tienda para activar el servicio
      await this.externalUsersService.getVendedoresByTienda(tiendas[0].uid);
    }
  }

  private setupSubscriptions(): void {
    // Combinar observables para calcular estadísticas
    combineLatest([
      this.userListService.users$,
      this.externalUsersService.tiendas$,
      this.externalUsersService.vendedores$
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([users, tiendas, vendedores]) => {
        this.allUsers = users;
        this.calculateStats(users, tiendas, vendedores);
      });

    // Loading states
    combineLatest([
      this.userListService.loading$,
      this.externalUsersService.loading$
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([userLoading, externalLoading]) => {
        this.isLoading = userLoading || externalLoading;
      });
  }

  private calculateStats(users: BaseProfile[], tiendas: any[], vendedores: any[]): void {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Stats básicas de usuarios
    this.stats.totalUsers = users.length;
    this.stats.internalUsers = users.filter(u => u.userCategory === UserCategory.INTERNO || !u.userCategory).length;
    this.stats.externalUsers = users.filter(u => u.userCategory === UserCategory.EXTERNO).length;
    this.stats.activeUsers = users.filter(u => u.isActive).length;
    this.stats.inactiveUsers = users.filter(u => !u.isActive).length;

    // Stats por tipo de usuario
    this.stats.usersByType = {};
    Object.values(UserType).forEach(type => {
      this.stats.usersByType[type] = users.filter(u => u.userType === type).length;
    });

    // Stats de tiendas
    this.stats.tiendas = {
      total: tiendas.length,
      active: tiendas.filter(t => t.tiendaStatus === TiendaStatus.ACTIVA).length,
      pending: tiendas.filter(t => t.tiendaStatus === TiendaStatus.PENDIENTE_APROBACION).length,
      suspended: tiendas.filter(t => t.tiendaStatus === TiendaStatus.SUSPENDIDA).length
    };

    // Stats de vendedores
    this.stats.vendedores = {
      total: vendedores.length,
      active: vendedores.filter(v => v.vendedorStatus === VendedorStatus.ACTIVO).length,
      inactive: vendedores.filter(v => v.vendedorStatus === VendedorStatus.INACTIVO).length,
      suspended: vendedores.filter(v => v.vendedorStatus === VendedorStatus.SUSPENDIDO).length
    };

    // Usuarios creados recientemente
    this.stats.recentlyCreated = users.filter(u => {
      const createdDate = DateUtils.toDate(u.createdAt);
      return createdDate.getTime() > sevenDaysAgo.getTime();
    }).length;
  }

  // Métodos de navegación
  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(CrearComponent, {
      width: '1000px',
      maxWidth: '98vw',
      maxHeight: '95vh',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.errorHandler.showSuccess('Usuario creado exitosamente');
        this.refreshUsers();
      }
    });
  }

  goToUserList(): void {
    this.selectedTabIndex = 1;
  }

  goToExternalUsers(): void {
    this.selectedTabIndex = 2;
  }

  goToDebug(): void {
    this.selectedTabIndex = 3;
  }

  showAdvancedStats(): void {
    // TODO: Implementar modal de estadísticas avanzadas
    this.errorHandler.showInfo('Próximamente: Estadísticas avanzadas');
  }

  // Métodos de datos


  exportUsers(): void {
    try {
      const csvData = this.generateUsersCSV(this.allUsers);
      this.downloadCSV(csvData, 'usuarios_completo.csv');
      this.errorHandler.showSuccess('Usuarios exportados exitosamente');
    } catch (error) {
      this.errorHandler.handleError(error, 'ExportUsers');
    }
  }

  private generateUsersCSV(users: BaseProfile[]): string {
    const headers = [
      'UID',
      'Nombres',
      'Apellidos', 
      'Email',
      'Teléfono',
      'Tipo Documento',
      'Número Documento',
      'Tipo Usuario',
      'Categoría',
      'Estado',
      'Fecha Creación',
      'Creado Por'
    ];

    const csvData = users.map(user => [
      user.uid,
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.documentType,
      user.documentNumber,
      this.getUserTypeLabel(user.userType),
      user.userCategory || 'interno',
      user.isActive ? 'Activo' : 'Inactivo',
      DateUtils.formatForDisplay(user.createdAt),
      user.createdBy || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  private downloadCSV(csvData: string, filename: string): void {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Métodos de utilidad
  

  getRecentUsersPercentage(): number {
    if (this.stats.totalUsers === 0) return 0;
    return (this.stats.recentlyCreated / this.stats.totalUsers) * 100;
  }



  getTiendasActivePercentage(): number {
    if (this.stats.tiendas.total === 0) return 0;
    return (this.stats.tiendas.active / this.stats.tiendas.total) * 100;
  }

  getVendedoresActivePercentage(): number {
    if (this.stats.vendedores.total === 0) return 0;
    return (this.stats.vendedores.active / this.stats.vendedores.total) * 100;
  }

  getMostPopularUserType(): string {
    let maxCount = 0;
    let popularType = '';
    
    Object.entries(this.stats.usersByType).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        popularType = type;
      }
    });
    
    return popularType ? this.getUserTypeLabel(popularType as UserType) : 'N/A';
  }

  

   userType = UserType;

   private async loadUsers(): Promise<void> {
    try {
      const options: UserListOptions = {
        pageSize: 100,
        orderByField: 'createdAt',
        orderDirection: 'desc'
      };
      
      const result = await this.userListService.loadUsers(options);
      console.log('✅ Usuarios cargados:', result.users.length);
      this.dataSource.data = result.users;

    } catch (error) {
      console.error('❌ Error loading users:', error);
      this.errorHandler.handleError(error, 'LoadUsers');
    }
  }

  async refreshUsers(): Promise<void> {
    try {
      this.userListService.clearUsers();
      await this.loadUsers();
      this.snackBar.open('✅ Usuarios actualizados', 'Cerrar', { duration: 2000 });
    } catch (error) {
      this.snackBar.open('❌ Error al actualizar', 'Cerrar', { duration: 3000 });
    }
  }

  // Datos de ejemplo actualizados
  

  applyFilter() {
    const filterValue = this.searchTerm.toLowerCase();
    
    this.dataSource.filterPredicate = (data: BaseProfile, filter: string) => {
      const searchMatch = data.firstName.toLowerCase().includes(filter) ||
                         data.lastName.toLowerCase().includes(filter) ||
                         data.email.toLowerCase().includes(filter) ||
                         data.documentNumber.includes(filter);
      
      const typeMatch = !this.selectedUserType || data.userType === this.selectedUserType;
      
      const statusMatch = !this.selectedStatus || 
                         (this.selectedStatus === 'active' && data.isActive) ||
                         (this.selectedStatus === 'inactive' && !data.isActive);
      
      return searchMatch && typeMatch && statusMatch;
    };

    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getUserTypeClass(userType: UserType): string {
    const classes = {
      [UserType.GERENCIA]: 'bg-purple-100 text-purple-800',
      [UserType.COMERCIAL]: 'bg-blue-100 text-blue-800',
      [UserType.LOGISTICA]: 'bg-green-100 text-green-800',
      [UserType.FINANZAS]: 'bg-yellow-100 text-yellow-800',
      [UserType.CONTABILIDAD]: 'bg-orange-100 text-orange-800',
      [UserType.ADMINISTRACION]: 'bg-red-100 text-red-800',
      [UserType.RECURSOS_HUMANOS]: 'bg-pink-100 text-pink-800',
      [UserType.TIENDA]: 'bg-indigo-100 text-indigo-800'
      , [UserType.VENDEDOR]: 'Vendedor'
    } as const;
    return classes[userType] || 'bg-gray-100 text-gray-800';
  }

  getUserTypeLabel(userType: UserType): string {
    const labels = {
      [UserType.GERENCIA]: 'Gerencia',
      [UserType.COMERCIAL]: 'Comercial',
      [UserType.LOGISTICA]: 'Logística',
      [UserType.FINANZAS]: 'Finanzas',
      [UserType.CONTABILIDAD]: 'Contabilidad',
      [UserType.ADMINISTRACION]: 'Administración',
      [UserType.RECURSOS_HUMANOS]: 'RR.HH.',
      [UserType.TIENDA]: 'Tienda'
      , [UserType.VENDEDOR]: 'Vendedor'
    } as const; // Add VENDEDOR to the labels object
    return labels[userType] || userType;
  }



  viewUser(user: BaseProfile) {
    console.log('Ver usuario:', user);
    // Implementar navegación o modal para ver detalles
  }

  editUser(user: BaseProfile) {
    console.log('Editar usuario:', user);
    // Implementar navegación o modal para editar
  }

  deleteUser(user: BaseProfile) {
    console.log('Eliminar usuario:', user);
    // Implementar confirmación y eliminación
  }

  resetPassword(user: BaseProfile) {
    console.log('Resetear contraseña:', user);
    // Implementar reset de contraseña
  }

  toggleUserStatus(user: BaseProfile) {
    console.log('Cambiar estado:', user);
    // Implementar cambio de estado activo/inactivo
  }

  sendWelcomeEmail(user: BaseProfile) {
    console.log('Enviar email de bienvenida:', user);
    // Implementar envío de email
  }
}

