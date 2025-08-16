import { Component, OnInit, inject, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material Imports
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import {MatDividerModule} from '@angular/material/divider';

// Componentes e interfaces
import { CrearComponent } from '../crear/crear.component';

//import { UserService } from '../services/user.service';
//import { StatisticService } from '../services/statistic.service';

import { UserType } from '../enums/user-type.types';

// Interfaces para el componente
export interface UserTableData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  isActive: boolean;
  lastLogin: Date | null;
  avatar: string;
  createdAt: Date;
  storeIds?: string[];
  specificData?: any;
 //
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  pendingUsers: number;
  usersByType: Record<UserType, number>;
}

export interface UserTypeConfig {
  value: UserType;
  label: string;
  icon: string;
  class: string;
  description: string;
}

export interface FilterOptions {
  search: string;
  status: string;
  userType: UserType | '';
  storeId: string;
  dateFrom: Date | null;
  dateTo: Date | null;
}

@Component({
  selector: 'app-listar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './listar.component.html',
  styleUrl: './listar.component.css'
})
export class ListarComponent  {
   private dialog = inject(MatDialog);
  // private fb = inject(FormBuilder);
  // private snackBar = inject(MatSnackBar);
  // private userService = inject(UserService);
  // private statisticsService = inject(StatisticService);
  //
  // private destroy$ = new Subject<void>();
  //
  // // ViewChild para tabla
  // @ViewChild(MatPaginator) paginator!: MatPaginator;
  // @ViewChild(MatSort) sort!: MatSort;
  //
  // // Propiedades del componente
  // displayedColumns: string[] = ['user', 'type', 'status', 'stores', 'lastLogin', 'actions'];
  // dataSource = new MatTableDataSource<UserTableData>([]);
  // showFilters = false;
   isLoading = false;
  //
  // // Datos
  // allUsers: baseProfile[] = [];
  // stores: StoreUser[] = [];
  //
  // // Formularios
  // filterForm!: FormGroup ;
  //
  // // Estadísticas
  // userStats: UserStats = {
  //   totalUsers: 0,
  //   activeUsers: 0,
  //   newUsersThisMonth: 0,
  //   pendingUsers: 0,
  //   usersByType: {
  //     [UserType.ADMIN]: 0,
  //     [UserType.STORE]: 0,
  //     [UserType.VENDOR]: 0,
  //     [UserType.ACCOUNTANT]: 0,
  //     [UserType.FINANCIAL]: 0
  //   }
  // };
  //
  // // Configuración de tipos de usuario
  // userTypes: UserTypeConfig[] = [
  //   {
  //     value: UserType.ADMIN,
  //     label: 'Administrador',
  //     icon: 'admin_panel_settings',
  //     class: 'admin-type',
  //     description: 'Control total del sistema'
  //   },
  //   {
  //     value: UserType.STORE,
  //     label: 'Tienda',
  //     icon: 'store',
  //     class: 'store-type',
  //     description: 'Gestión de inventario y ventas'
  //   },
  //   {
  //     value: UserType.VENDOR,
  //     label: 'Vendedor',
  //     icon: 'person',
  //     class: 'vendor-type',
  //     description: 'Ventas y gestión de clientes'
  //   },
  //   {
  //     value: UserType.ACCOUNTANT,
  //     label: 'Contable',
  //     icon: 'calculate',
  //     class: 'accountant-type',
  //     description: 'Gestión contable y financiera'
  //   },
  //   {
  //     value: UserType.FINANCIAL,
  //     label: 'Financiero',
  //     icon: 'trending_up',
  //     class: 'financial-type',
  //     description: 'Evaluación y aprobación de créditos'
  //   }
  // ];
  //
  // constructor() {
  //   this.initializeFilterForm();
  // }
  //
  // ngOnInit(): void {
  //   this.loadAllData();
  //   this.setupFilterSubscription();
  // }
  //
  // ngAfterViewInit(): void {
  //   this.dataSource.paginator = this.paginator;
  //   this.dataSource.sort = this.sort;
  //   this.dataSource.filterPredicate = this.createFilterPredicate();
  // }
  //
  // ngOnDestroy(): void {
  //   this.destroy$.next();
  //   this.destroy$.complete();
  // }
  //
  // // ====================================================================
  // // INICIALIZACIÓN
  // // ====================================================================
  //
  // private initializeFilterForm(): void {
  //   this.filterForm = this.fb.group({
  //     search: [''],
  //     status: [''],
  //     userType: [''],
  //     storeId: [''],
  //     dateFrom: [null],
  //     dateTo: [null]
  //   });
  // }
  //
  // private setupFilterSubscription(): void {
  //   this.filterForm.valueChanges.pipe(
  //     debounceTime(300),
  //     distinctUntilChanged(),
  //     takeUntil(this.destroy$)
  //   ).subscribe(() => {
  //     this.applyFilters();
  //   });
  // }
  //
  // // ====================================================================
  // // CARGA DE DATOS
  // // ====================================================================
  //
  // async loadAllData(): Promise<void> {
  //   this.isLoading = true;
  //
  //   try {
  //     // Cargar todos los tipos de usuarios en paralelo
  //     const [adminUsers, storeUsers, vendorUsers, accountantUsers, financialUsers] =
  //       await Promise.all([
  //         this.userService.getUsersByType(UserType.ADMIN),
  //         this.userService.getUsersByType(UserType.STORE),
  //         this.userService.getUsersByType(UserType.VENDOR),
  //         this.userService.getUsersByType(UserType.ACCOUNTANT),
  //         this.userService.getUsersByType(UserType.FINANCIAL)
  //       ]);
  //
  //     // Combinar todos los usuarios
  //     this.allUsers = [
  //       ...adminUsers,
  //       ...storeUsers,
  //       ...vendorUsers,
  //       ...accountantUsers,
  //       ...financialUsers
  //     ];
  //
  //     // Guardar tiendas para los filtros
  //     this.stores = storeUsers as StoreUser[];
  //
  //     // Convertir a formato de tabla
  //     const tableData = this.convertUsersToTableData(this.allUsers);
  //     this.dataSource.data = tableData;
  //
  //     // Actualizar estadísticas
  //     this.updateStats();
  //
  //   } catch (error) {
  //     console.error('Error loading users:', error);
  //     this.snackBar.open('Error al cargar usuarios', 'Cerrar', {
  //       duration: 5000
  //     });
  //   } finally {
  //     this.isLoading = false;
  //   }
  // }
  //
  // private convertUsersToTableData(users: BaseProfile[]): UserTableData[] {
  //   return users.map(user => ({
  //     uid: user.uid,
  //     name: user.getFullName(),
  //     email: user.email,
  //     phone: user.phone,
  //     userType: user.userType,
  //     isActive: user.isActive,
  //     lastLogin: this.getLastLogin(user),
  //     avatar: this.generateAvatar(user.firstName, user.lastName),
  //     createdAt: user.createdAt,
  //     storeIds: user.storeIds || [],
  //     specificData: user.getSpecificData(),
  //     originalUser: user
  //   }));
  // }
  //
  // private getLastLogin(user: BaseProfile): Date | null {
  //   // TODO: Implementar sistema de tracking de último login
  //   // Por ahora retornamos una fecha aleatoria para demo
  //   const randomDays = Math.floor(Math.random() * 30);
  //   const randomDate = new Date();
  //   randomDate.setDate(randomDate.getDate() - randomDays);
  //   return user.isActive ? randomDate : null;
  // }
  //
  // private generateAvatar(firstName: string, lastName: string): string {
  //   return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  // }
  //
  // // ====================================================================
  // // ESTADÍSTICAS
  // // ====================================================================
  //
  // private updateStats(): void {
  //   const users = this.dataSource.data;
  //   const currentDate = new Date();
  //   const currentMonth = currentDate.getMonth();
  //   const currentYear = currentDate.getFullYear();
  //
  //   this.userStats = {
  //     totalUsers: users.length,
  //     activeUsers: users.filter(u => u.isActive).length,
  //     newUsersThisMonth: users.filter(u =>
  //       u.createdAt.getMonth() === currentMonth &&
  //       u.createdAt.getFullYear() === currentYear
  //     ).length,
  //     pendingUsers: users.filter(u => !u.isActive).length,
  //     usersByType: {
  //       [UserType.ADMIN]: users.filter(u => u.userType === UserType.ADMIN).length,
  //       [UserType.STORE]: users.filter(u => u.userType === UserType.STORE).length,
  //       [UserType.VENDOR]: users.filter(u => u.userType === UserType.VENDOR).length,
  //       [UserType.ACCOUNTANT]: users.filter(u => u.userType === UserType.ACCOUNTANT).length,
  //       [UserType.FINANCIAL]: users.filter(u => u.userType === UserType.FINANCIAL).length
  //     }
  //   };
  // }
  //
  // // ====================================================================
  // // FILTROS
  // // ====================================================================
  //
  // private createFilterPredicate() {
  //   return (data: UserTableData, filter: string): boolean => {
  //     if (!filter) return true;
  //
  //     const filterObject: FilterOptions = JSON.parse(filter);
  //
  //     // Filtro de búsqueda
  //     if (filterObject.search) {
  //       const searchTerm = filterObject.search.toLowerCase();
  //       const matchesSearch =
  //         data.name.toLowerCase().includes(searchTerm) ||
  //         data.email.toLowerCase().includes(searchTerm) ||
  //         data.phone.includes(searchTerm) ||
  //         data.uid.toLowerCase().includes(searchTerm);
  //       if (!matchesSearch) return false;
  //     }
  //
  //     // Filtro de estado
  //     if (filterObject.status) {
  //       const isActive = filterObject.status === 'active';
  //       if (data.isActive !== isActive) return false;
  //     }
  //
  //     // Filtro de tipo de usuario
  //     if (filterObject.userType && data.userType !== filterObject.userType) {
  //       return false;
  //     }
  //
  //     // Filtro de tienda
  //     if (filterObject.storeId) {
  //       if (!data.storeIds?.includes(filterObject.storeId)) {
  //         return false;
  //       }
  //     }
  //
  //     // Filtro de fecha desde
  //     if (filterObject.dateFrom && data.createdAt < filterObject.dateFrom) {
  //       return false;
  //     }
  //
  //     // Filtro de fecha hasta
  //     if (filterObject.dateTo && data.createdAt > filterObject.dateTo) {
  //       return false;
  //     }
  //
  //     return true;
  //   };
  // }
  //
  // toggleFilters(): void {
  //   this.showFilters = !this.showFilters;
  // }
  //
  // clearFilters(): void {
  //   this.filterForm.reset();
  //   this.dataSource.filter = '';
  // }
  //
  // applyFilters(): void {
  //   const filterValue = JSON.stringify(this.filterForm.value);
  //   this.dataSource.filter = filterValue;
  // }
  //
  // // ====================================================================
  // // ACCIONES DE USUARIO
  // // ====================================================================
  //
   openCreateUserDialog(): void {
     const dialogRef = this.dialog.open(CrearComponent, {
       width: '900px',
      maxWidth: '95vw',
       maxHeight: '95vh',
       disableClose: true,
       //data: { userTypes: this.userTypes }
     });
     // dialogRef.afterClosed().subscribe(result => {
     //   if (result) {
     //     this.handleUserCreated(result);
     //   }
     // }
     //);
   }
  //
  // private async handleUserCreated(newUser: baseProfile): Promise<void> {
  //   try {
  //     // Agregar el nuevo usuario a la lista
  //     this.allUsers.push(newUser);
  //
  //     // Si es una tienda, agregarla a la lista de tiendas
  //     if (newUser.userType === UserType.STORE) {
  //       this.stores.push(newUser as StoreUser);
  //     }
  //
  //     // Actualizar la tabla
  //     const tableData = this.convertUsersToTableData(this.allUsers);
  //     this.dataSource.data = tableData;
  //
  //     // Actualizar estadísticas
  //     this.updateStats();
  //
  //     this.snackBar.open(
  //       `Usuario ${newUser.getFullName()} creado exitosamente`,
  //       'Cerrar',
  //       { duration: 5000 }
  //     );
  //
  //   } catch (error) {
  //     console.error('Error handling user creation:', error);
  //     this.snackBar.open('Error al procesar el nuevo usuario', 'Cerrar', {
  //       duration: 5000
  //     });
  //   }
  // }
  //
  // async viewUser(user: UserTableData): Promise<void> {
  //   try {
  //     // Obtener datos completos del usuario desde Firebase
  //     const fullUser = await this.userService.getUserByUid(user.uid);
  //
  //     if (fullUser) {
  //       // TODO: Abrir modal de detalles del usuario
  //       console.log('Full user data:', fullUser);
  //       this.snackBar.open(`Viendo detalles de ${user.name}`, 'Cerrar', {
  //         duration: 3000
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error viewing user:', error);
  //     this.snackBar.open('Error al cargar detalles del usuario', 'Cerrar', {
  //       duration: 3000
  //     });
  //   }
  // }
  //
  // async editUser(user: UserTableData): Promise<void> {
  //   // TODO: Implementar modal de edición
  //   this.snackBar.open(`Editando usuario ${user.name}`, 'Cerrar', {
  //     duration: 3000
  //   });
  // }
  //
  // async toggleUserStatus(user: UserTableData): Promise<void> {
  //   try {
  //     if (user.isActive) {
  //       await this.userService.deactivateUser(user.uid);
  //       user.isActive = false;
  //       this.snackBar.open(`Usuario ${user.name} desactivado`, 'Cerrar', {
  //         duration: 3000
  //       });
  //     } else {
  //       // TODO: Implementar reactivación de usuario
  //       this.snackBar.open('Función de reactivación en desarrollo', 'Cerrar', {
  //         duration: 3000
  //       });
  //     }
  //
  //     this.updateStats();
  //   } catch (error) {
  //     console.error('Error toggling user status:', error);
  //     this.snackBar.open('Error al cambiar estado del usuario', 'Cerrar', {
  //       duration: 3000
  //     });
  //   }
  // }
  //
  // async resetUserPassword(user: UserTableData): Promise<void> {
  //   try {
  //     await this.userService.resetUserPassword(user.email);
  //     this.snackBar.open(
  //       `Email de restablecimiento enviado a ${user.email}`,
  //       'Cerrar',
  //       { duration: 5000 }
  //     );
  //   } catch (error) {
  //     console.error('Error resetting password:', error);
  //     this.snackBar.open('Error al enviar email de restablecimiento', 'Cerrar', {
  //       duration: 3000
  //     });
  //   }
  // }
  //
  // async deleteUser(user: UserTableData): Promise<void> {
  //   // TODO: Implementar modal de confirmación
  //   const confirmed = confirm(`¿Está seguro de eliminar al usuario ${user.name}?`);
  //
  //   if (confirmed) {
  //     try {
  //       await this.userService.deactivateUser(user.uid);
  //
  //       // Remover de la lista local
  //       this.allUsers = this.allUsers.filter(u => u.uid !== user.uid);
  //       const tableData = this.convertUsersToTableData(this.allUsers);
  //       this.dataSource.data = tableData;
  //
  //       this.updateStats();
  //
  //       this.snackBar.open(`Usuario ${user.name} eliminado`, 'Cerrar', {
  //         duration: 3000
  //       });
  //     } catch (error) {
  //       console.error('Error deleting user:', error);
  //       this.snackBar.open('Error al eliminar usuario', 'Cerrar', {
  //         duration: 3000
  //       });
  //     }
  //   }
  // }
  //
  // // ====================================================================
  // // MÉTODOS HELPER
  // // ====================================================================
  //
  // getUserTypeIcon(type: UserType): string {
  //   const userType = this.userTypes.find(ut => ut.value === type);
  //   return userType?.icon || 'person';
  // }
  //
  // getUserTypeLabel(type: UserType): string {
  //   const userType = this.userTypes.find(ut => ut.value === type);
  //   return userType?.label || type;
  // }
  //
  // getUserTypeClass(type: UserType): string {
  //   const userType = this.userTypes.find(ut => ut.value === type);
  //   return userType?.class || '';
  // }
  //
  // getStatusLabel(isActive: boolean): string {
  //   return isActive ? 'Activo' : 'Inactivo';
  // }
  //
  // getStatusClass(isActive: boolean): string {
  //   return isActive ? 'status-active' : 'status-inactive';
  // }
  //
  // getStoreNames(storeIds: string[] = []): string {
  //   if (!storeIds.length) return 'Sin asignar';
  //
  //   const storeNames = storeIds.map(storeId => {
  //     const store = this.stores.find(s => s.storeInfo.storeId === storeId);
  //     return store?.storeInfo.storeName || `Tienda ${storeId}`;
  //   });
  //
  //   return storeNames.join(', ');
  // }
  //
  // getStoreName(storeId: string): string {
  //   const store = this.stores.find(s => s.storeInfo.storeId === storeId);
  //   return store?.storeInfo.storeName || `Tienda ${storeId}`;
  // }
  //
  // getRelativeTime(date: Date): string {
  //   const now = new Date();
  //   const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  //
  //   if (diffInHours < 1) return 'Hace menos de 1 hora';
  //   if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  //
  //   const diffInDays = Math.floor(diffInHours / 24);
  //   if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  //
  //   const diffInWeeks = Math.floor(diffInDays / 7);
  //   if (diffInWeeks < 4) return `Hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
  //
  //   const diffInMonths = Math.floor(diffInDays / 30);
  //   return `Hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
  // }
  //
  // trackByStoreId(index: number, storeId: string): string {
  //   return storeId;
  // }
  //
  // getUserSpecificInfo(user: UserTableData): string {
  //   switch (user.userType) {
  //     case UserType.VENDOR:
  //       const vendorData = user.specificData?.vendorInfo;
  //       return vendorData ? `ID: ${vendorData.employeeId} | Comisión: ${(vendorData.commissionRate * 100).toFixed(1)}%` : '';
  //
  //     case UserType.FINANCIAL:
  //       const financialData = user.specificData?.financialInfo;
  //       return financialData ? `Límite: $${financialData.approvalLimit?.toLocaleString()} | Riesgo: ${financialData.riskLevel}` : '';
  //
  //     case UserType.ACCOUNTANT:
  //       const accountantData = user.specificData?.accountantInfo;
  //       return accountantData ? `Nivel: ${accountantData.accessLevel} | Dpto: ${accountantData.department}` : '';
  //
  //     case UserType.STORE:
  //       const storeData = user.specificData?.storeInfo;
  //       return storeData ? `Código: ${storeData.storeCode} | Max Inv: ${storeData.maxInventory}` : '';
  //
  //     default:
  //       return '';
  //   }
  // }
  //
  // // ====================================================================
  // // EXPORTACIÓN
  // // ====================================================================
  //
  // exportToCSV(): void {
  //   try {
  //     const headers = ['UID', 'Nombre', 'Email', 'Teléfono', 'Tipo', 'Estado', 'Tiendas', 'Fecha Creación'];
  //     const csvData = this.dataSource.filteredData.map(user => [
  //       user.uid,
  //       user.name,
  //       user.email,
  //       user.phone,
  //       this.getUserTypeLabel(user.userType),
  //       this.getStatusLabel(user.isActive),
  //       this.getStoreNames(user.storeIds),
  //       user.createdAt.toLocaleDateString()
  //     ]);
  //
  //     const csvContent = [headers, ...csvData]
  //       .map(row => row.map(field => `"${field}"`).join(','))
  //       .join('\n');
  //
  //     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //     const link = document.createElement('a');
  //     link.href = URL.createObjectURL(blob);
  //     link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
  //     link.click();
  //
  //     this.snackBar.open('CSV exportado exitosamente', 'Cerrar', {
  //       duration: 3000
  //     });
  //   } catch (error) {
  //     console.error('Error exporting CSV:', error);
  //     this.snackBar.open('Error al exportar CSV', 'Cerrar', {
  //       duration: 3000
  //     });
  //   }
  // }
  //
  // printTable(): void {
  //   // TODO: Implementar función de impresión
  //   this.snackBar.open('Función de impresión en desarrollo', 'Cerrar', {
  //     duration: 3000
  //   });
  // }
  //
  // // ====================================================================
  // // ESTADÍSTICAS AVANZADAS
  // // ====================================================================
  //
  // async viewStoreStatistics(): Promise<void> {
  //   // try {
  //   //   const stats = await this.statisticsService.getAllStoresStatistics();
  //   //   console.log('Store statistics:', stats);
  //   //
  //   //   // TODO: Abrir modal con estadísticas por tienda
  //   //   this.snackBar.open('Cargando estadísticas por tienda...', 'Cerrar', {
  //   //     duration: 3000
  //   //   });
  //   // } catch (error) {
  //   //   console.error('Error loading store statistics:', error);
  //   //   this.snackBar.open('Error al cargar estadísticas', 'Cerrar', {
  //   //     duration: 3000
  //   //   });
  //   // }
  // }
  //
  // async getUsersByStore(storeId: string): Promise<void> {
  //   try {
  //     const users = await this.userService.getUsersByStore(storeId);
  //     const tableData = this.convertUsersToTableData(users);
  //
  //     // Aplicar filtro temporal por tienda
  //     this.filterForm.patchValue({ storeId });
  //     this.applyFilters();
  //
  //     this.snackBar.open(`Mostrando ${users.length} usuarios de la tienda`, 'Cerrar', {
  //       duration: 3000
  //     });
  //   } catch (error) {
  //     console.error('Error filtering by store:', error);
  //     this.snackBar.open('Error al filtrar por tienda', 'Cerrar', {
  //       duration: 3000
  //     });
  //   }
  // }
}
