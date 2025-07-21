import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

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
import { CrearComponent } from '../crear/crear.component';
import { UserStatus, UserType } from '../../modelos/enums';


export interface UserTableData {
  id: string;
  name: string;
  email: string;
  type: UserType;
  status: UserStatus;
  lastLogin: Date | null;
  avatar: string;
  createdAt: Date;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  pendingUsers: number;
}

export interface UserTypeConfig {
  value: UserType;
  label: string;
  icon: string;
  class: string;
  description: string;
}

@Component({
  selector: 'app-listar',
  standalone: true,
  imports: [CommonModule,
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
    MatTooltipModule],
  templateUrl: './listar.component.html',
  styleUrl: './listar.component.css'
})
export class ListarComponent implements OnInit {

 private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // ViewChild para tabla
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Propiedades del componente
  displayedColumns: string[] = ['user', 'type', 'status', 'lastLogin', 'actions'];
  dataSource = new MatTableDataSource<UserTableData>([]);
  showFilters = false;
  isLoading = false;
  
  // Formularios
  filterForm: FormGroup;

  // Estadísticas
  userStats: UserStats = {
    totalUsers: 245,
    activeUsers: 198,
    newUsersThisMonth: 23,
    pendingUsers: 12
  };

  // Configuración de tipos de usuario
  userTypes: UserTypeConfig[] = [
    { 
      value: UserType.ADMIN, 
      label: 'Administrador', 
      icon: 'admin_panel_settings', 
      class: 'admin-type',
      description: 'Control total del sistema'
    },
    { 
      value: UserType.STORE, 
      label: 'Tienda', 
      icon: 'store', 
      class: 'store-type',
      description: 'Gestión de inventario y ventas'
    },
    { 
      value: UserType.VENDOR, 
      label: 'Vendedor', 
      icon: 'person', 
      class: 'vendor-type',
      description: 'Ventas y gestión de clientes'
    },
    { 
      value: UserType.ACCOUNTANT, 
      label: 'Contable', 
      icon: 'calculate', 
      class: 'accountant-type',
      description: 'Gestión contable y financiera'
    },
    { 
      value: UserType.FINANCIAL, 
      label: 'Financiero', 
      icon: 'trending_up', 
      class: 'financial-type',
      description: 'Evaluación y aprobación de créditos'
    }
  ];

  // Datos mock para pruebas
  private mockUsers: UserTableData[] = [
    {
      id: '1',
      name: 'Carlos Administrador',
      email: 'carlos@empresa.com',
      type: UserType.ADMIN,
      status: UserStatus.ACTIVE,
      lastLogin: new Date('2024-01-15'),
      avatar: 'CA',
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'María Vendedora',
      email: 'maria@empresa.com',
      type: UserType.VENDOR,
      status: UserStatus.ACTIVE,
      lastLogin: new Date('2024-01-14'),
      avatar: 'MV',
      createdAt: new Date('2024-01-05')
    },
    {
      id: '3',
      name: 'Juan Financiero',
      email: 'juan@empresa.com',
      type: UserType.FINANCIAL,
      status: UserStatus.INACTIVE,
      lastLogin: new Date('2024-01-10'),
      avatar: 'JF',
      createdAt: new Date('2024-01-03')
    },
    {
      id: '4',
      name: 'Ana Contable',
      email: 'ana@empresa.com',
      type: UserType.ACCOUNTANT,
      status: UserStatus.ACTIVE,
      lastLogin: new Date('2024-01-16'),
      avatar: 'AC',
      createdAt: new Date('2024-01-07')
    },
    {
      id: '5',
      name: 'Luis Tienda Norte',
      email: 'luis@empresa.com',
      type: UserType.STORE,
      status: UserStatus.PENDING,
      lastLogin: null,
      avatar: 'LT',
      createdAt: new Date('2024-01-12')
    }
  ];

  constructor() {
    // Inicializar formulario de filtros
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      userType: [''],
      dateFrom: [null],
      dateTo: [null]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.setupFilterSubscription();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Configurar filtro personalizado
    this.dataSource.filterPredicate = this.createFilterPredicate();
  }

  // ====================================================================
  // MÉTODOS DE CARGA Y FILTRADO
  // ====================================================================

  loadUsers(): void {
    this.isLoading = true;
    
    // Simular llamada a API
    setTimeout(() => {
      this.dataSource.data = [...this.mockUsers];
      this.updateStats();
      this.isLoading = false;
    }, 1000);
  }

  setupFilterSubscription(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  createFilterPredicate() {
    return (data: UserTableData, filter: string): boolean => {
      const filterObject = JSON.parse(filter);
      
      // Filtro de búsqueda
      if (filterObject.search) {
        const searchTerm = filterObject.search.toLowerCase();
        const matchesSearch = 
          data.name.toLowerCase().includes(searchTerm) ||
          data.email.toLowerCase().includes(searchTerm) ||
          data.id.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Filtro de estado
      if (filterObject.status && data.status !== filterObject.status) {
        return false;
      }

      // Filtro de tipo de usuario
      if (filterObject.userType && data.type !== filterObject.userType) {
        return false;
      }

      // Filtro de fecha desde
      if (filterObject.dateFrom && data.createdAt < filterObject.dateFrom) {
        return false;
      }

      // Filtro de fecha hasta
      if (filterObject.dateTo && data.createdAt > filterObject.dateTo) {
        return false;
      }

      return true;
    };
  }

  updateStats(): void {
    const users = this.dataSource.data;
    this.userStats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === UserStatus.ACTIVE).length,
      newUsersThisMonth: users.filter(u => this.isThisMonth(u.createdAt)).length,
      pendingUsers: users.filter(u => u.status === UserStatus.PENDING).length
    };
  }

  private isThisMonth(date: Date): boolean {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  // ====================================================================
  // MÉTODOS DE FILTROS
  // ====================================================================

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.dataSource.filter = '';
  }

  applyFilters(): void {
    const filterValue = JSON.stringify(this.filterForm.value);
    this.dataSource.filter = filterValue;
  }

  // ====================================================================
  // MÉTODOS DE ACCIONES
  // ====================================================================

   openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(CrearComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: true,
      data: { userTypes: this.userTypes }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.handleUserCreated(result);
      }
    });
  }
  private handleUserCreated(userData: any): void {
    // Simular creación de usuario
    const newUser: UserTableData = {
      id: this.generateUserId(),
      name: `${userData.profile.firstName} ${userData.profile.lastName}`,
      email: userData.profile.email,
      type: userData.userType,
      status: UserStatus.PENDING,
      lastLogin: null,
      avatar: this.generateAvatar(userData.profile.firstName, userData.profile.lastName),
      createdAt: new Date()
    };

    // Agregar a la lista
    this.mockUsers.push(newUser);
    this.dataSource.data = [...this.mockUsers];
    this.updateStats();

    this.snackBar.open(
      `Usuario ${newUser.name} creado exitosamente`,
      'Cerrar',
      { duration: 5000 }
    );
  }



  private generateUserId(): string {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateAvatar(firstName: string, lastName: string): string {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  viewUser(user: UserTableData): void {
    this.snackBar.open(`Viendo detalles de ${user.name}`, 'Cerrar', {
      duration: 3000
    });
  }

  editUser(user: UserTableData): void {
    this.snackBar.open(`Editando usuario ${user.name}`, 'Cerrar', {
      duration: 3000
    });
  }

  deleteUser(user: UserTableData): void {
    // TODO: Implementar confirmación de eliminación
    this.snackBar.open(`¿Eliminar usuario ${user.name}?`, 'Confirmar', {
      duration: 5000
    });
  }

  // ====================================================================
  // MÉTODOS HELPER
  // ====================================================================

 getUserTypeIcon(type: UserType): string {
    const userType = this.userTypes.find(ut => ut.value === type);
    return userType?.icon || 'person';
  }

  getUserTypeLabel(type: UserType): string {
    const userType = this.userTypes.find(ut => ut.value === type);
    return userType?.label || type;
  }

  getUserTypeClass(type: UserType): string {
    const userType = this.userTypes.find(ut => ut.value === type);
    return userType?.class || '';
  }

  getStatusLabel(status: UserStatus): string {
    const statusLabels: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: 'Activo',
      [UserStatus.INACTIVE]: 'Inactivo',
      [UserStatus.PENDING]: 'Pendiente',
      [UserStatus.BLOCKED]: 'Bloqueado',
      [UserStatus.SUSPENDED]: 'Suspendido'
    };
    return statusLabels[status] || status;
  }

  getStatusClass(status: UserStatus): string {
    const statusClasses: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: 'status-active',
      [UserStatus.INACTIVE]: 'status-inactive',
      [UserStatus.PENDING]: 'status-pending',
      [UserStatus.BLOCKED]: 'status-blocked',
      [UserStatus.SUSPENDED]: 'status-suspended'
    };
    return statusClasses[status] || '';
  }

  // ====================================================================
  // MÉTODOS DE EXPORTACIÓN
  // ====================================================================

  exportToCSV(): void {
    // TODO: Implementar exportación a CSV
    this.snackBar.open('Exportando a CSV...', 'Cerrar', {
      duration: 3000
    });
  }

  printTable(): void {
    // TODO: Implementar impresión
    this.snackBar.open('Preparando impresión...', 'Cerrar', {
      duration: 3000
    });
  }

}
