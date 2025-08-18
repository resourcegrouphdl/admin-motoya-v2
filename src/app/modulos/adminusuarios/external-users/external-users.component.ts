import { Component, inject, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';
import {
  TiendaProfile,
  TiendaStatus,
  VendedorProfile,
  VendedorStatus,
} from '../enums/user-type.types';
import { ExternalUserService } from '../services/external-user.service';
import { DateUtils } from '../enums/date-utils';
import { NgModel } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule } from '@angular/material/table';
import { CreateTiendaDialogComponent } from '../create-tienda-dialog/create-tienda-dialog.component';
import { CreateVendedorDialogComponent } from '../create-vendedor-dialog/create-vendedor-dialog.component';

@Component({
  selector: 'app-external-users',
  standalone: true,
  imports: [
    MatIcon,
    NgClass,
    NgIf,
    NgFor,
    MatFormField,
    MatTabsModule,
    MatTableModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
  ],
  templateUrl: './external-users.component.html',
  styleUrl: './external-users.component.css',
})
export class ExternalUsersComponent implements OnInit {
  private externalUsersService = inject(ExternalUserService);
  private errorHandler = inject(ErrorHandlerService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Data
  tiendas: TiendaProfile[] = [];
  vendedores: VendedorProfile[] = [];
  filteredTiendas: TiendaProfile[] = [];
  filteredVendedores: VendedorProfile[] = [];
  availableTiendas: Array<{ value: string; label: string }> = [];

  // State
  isLoading = false;

  // Filters
  selectedTiendaStatus = '';
  selectedTiendaFilter = '';
  selectedVendedorStatus = '';

  // Table config
  vendedoresDisplayedColumns = [
    'avatar',
    'info',
    'tienda',
    'status',
    'commission',
    'hireDate',
    'actions',
  ];

  // Status lists for stats
  tiendaStatusList = [
    { value: 'activa', label: 'Activas' },
    { value: 'pendiente_aprobacion', label: 'Pendientes' },
    { value: 'suspendida', label: 'Suspendidas' },
    { value: 'rechazada', label: 'Rechazadas' },
  ];

  vendedorStatusList = [
    { value: 'activo', label: 'Activos' },
    { value: 'inactivo', label: 'Inactivos' },
    { value: 'suspendido', label: 'Suspendidos' },
  ];

  ngOnInit(): void {
    this.loadInitialData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadInitialData(): Promise<void> {
    this.isLoading = true;

    try {
      // Cargar tiendas
      await this.externalUsersService.loadTiendas();

      // Cargar vendedores
      await this.loadAllVendedores();

      // Cargar tiendas disponibles para selector
      this.availableTiendas =
        await this.externalUsersService.getTiendasForSelector();
    } catch (error) {
      this.errorHandler.handleError(error, 'LoadExternalUsers');
    } finally {
      this.isLoading = false;
    }
  }

  private setupSubscriptions(): void {
    // Suscribirse a cambios de tiendas
    this.externalUsersService.tiendas$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tiendas) => {
        this.tiendas = tiendas;
        this.filterTiendas();
      });

    // Suscribirse a cambios de vendedores
    this.externalUsersService.vendedores$
      .pipe(takeUntil(this.destroy$))
      .subscribe((vendedores) => {
        this.vendedores = vendedores;
        this.filterVendedores();
      });

    // Suscribirse a loading state
    this.externalUsersService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.isLoading = loading;
      });
  }

  // Métodos de filtrado
  filterTiendas(): void {
    this.filteredTiendas = this.tiendas.filter((tienda) => {
      if (
        this.selectedTiendaStatus &&
        tienda.tiendaStatus !== this.selectedTiendaStatus
      ) {
        return false;
      }
      return true;
    });
  }

  filterVendedores(): void {
    this.filteredVendedores = this.vendedores.filter((vendedor) => {
      if (
        this.selectedTiendaFilter &&
        vendedor.tiendaId !== this.selectedTiendaFilter
      ) {
        return false;
      }
      if (
        this.selectedVendedorStatus &&
        vendedor.vendedorStatus !== this.selectedVendedorStatus
      ) {
        return false;
      }
      return true;
    });
  }

  // Métodos de diálogo
  openCreateTiendaDialog(): void {
    const dialogRef = this.dialog.open(CreateTiendaDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        console.log('Tienda creada con UID:', result.tiendaUid);
        this.loadInitialData(); // Recargar datos
      }
    });
  }

  openCreateVendedorDialog(): void {
    const dialogRef = this.dialog.open(CreateVendedorDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        console.log('Vendedor creado con UID:', result.vendedorUid);
        this.loadInitialData(); // Recargar datos
      }
    });
  }

  addVendedorToTienda(tienda: TiendaProfile): void {
    const dialogRef = this.dialog.open(CreateVendedorDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false,
      data: { preselectedTiendaId: tienda.uid },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        console.log('Vendedor agregado a tienda:', tienda.businessName);
        this.loadInitialData(); // Recargar datos
      }
    });
  }

  // Métodos de datos
  private async loadAllVendedores(): Promise<void> {
    // Este método debería estar en el servicio
    // Por ahora usamos un workaround
    console.log('Loading all vendedores...');
  }

  async loadVendedoresByTienda(tiendaId: string): Promise<void> {
    try {
      const vendedores = await this.externalUsersService.getVendedoresByTienda(
        tiendaId
      );
      console.log(`Vendedores de tienda ${tiendaId}:`, vendedores);
      // TODO: Mostrar en modal o expandir card
    } catch (error) {
      this.errorHandler.handleError(error, 'LoadVendedoresByTienda');
    }
  }

  // Métodos de acciones
  viewTiendaDetails(tienda: TiendaProfile): void {
    console.log('Ver detalles tienda:', tienda);
    // TODO: Implementar modal de detalles
  }

  editTienda(tienda: TiendaProfile): void {
    console.log('Editar tienda:', tienda);
    // TODO: Implementar edición
  }

  async changeTiendaStatus(
    tienda: TiendaProfile,
    newStatus: string
  ): Promise<void> {
    try {
      const result = await this.externalUsersService.updateTiendaStatus(
        tienda.uid,
        newStatus as TiendaStatus,
        'current-user-uid' // TODO: Obtener del auth service
      );

      if (result.success) {
        this.errorHandler.showSuccess(
          `Tienda ${
            newStatus === 'activa' ? 'activada' : 'suspendida'
          } exitosamente`
        );
      } else {
        this.errorHandler.showWarning(
          result.error || 'Error al cambiar estado'
        );
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'ChangeTiendaStatus');
    }
  }

  viewVendedorDetails(vendedor: VendedorProfile): void {
    console.log('Ver detalles vendedor:', vendedor);
    // TODO: Implementar modal de detalles
  }

  editVendedor(vendedor: VendedorProfile): void {
    console.log('Editar vendedor:', vendedor);
    // TODO: Implementar edición
  }

  async changeVendedorStatus(
    vendedor: VendedorProfile,
    newStatus: string
  ): Promise<void> {
    try {
      const result = await this.externalUsersService.updateVendedorStatus(
        vendedor.uid,
        newStatus as VendedorStatus,
        'current-user-uid' // TODO: Obtener del auth service
      );

      if (result.success) {
        this.errorHandler.showSuccess(
          `Vendedor ${
            newStatus === 'activo' ? 'activado' : 'suspendido'
          } exitosamente`
        );
      } else {
        this.errorHandler.showWarning(
          result.error || 'Error al cambiar estado'
        );
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'ChangeVendedorStatus');
    }
  }

  // Métodos de utilidad
  getTiendaStatusLabel(status: TiendaStatus): string {
    const labels = {
      [TiendaStatus.ACTIVA]: 'Activa',
      [TiendaStatus.PENDIENTE_APROBACION]: 'Pendiente',
      [TiendaStatus.SUSPENDIDA]: 'Suspendida',
      [TiendaStatus.RECHAZADA]: 'Rechazada',
    };
    return labels[status] || status;
  }

  getVendedorStatusLabel(status: VendedorStatus): string {
    const labels = {
      [VendedorStatus.ACTIVO]: 'Activo',
      [VendedorStatus.INACTIVO]: 'Inactivo',
      [VendedorStatus.SUSPENDIDO]: 'Suspendido',
    };
    return labels[status] || status;
  }

  getVendedorInitials(vendedor: VendedorProfile): string {
    const firstInitial = vendedor.firstName.charAt(0).toUpperCase();
    const lastInitial = vendedor.lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  getVendedoresCount(tiendaId: string): number {
    return this.vendedores.filter((v) => v.tiendaId === tiendaId).length;
  }

  getTiendaName(tiendaId: string): string {
    const tienda = this.tiendas.find((t) => t.uid === tiendaId);
    return tienda ? tienda.businessName : 'Tienda no encontrada';
  }

  getTiendaLocation(tiendaId: string): string {
    const tienda = this.tiendas.find((t) => t.uid === tiendaId);
    return tienda ? `${tienda.city}, ${tienda.district}` : '';
  }

  formatDate(date: Date | any): string {
    return DateUtils.formatForDisplay(date);
  }

  // Métodos para estadísticas
  getTiendasByStatus(status: string): TiendaProfile[] {
    return this.tiendas.filter((tienda) => tienda.tiendaStatus === status);
  }

  getVendedoresByStatus(status: string): VendedorProfile[] {
    return this.vendedores.filter(
      (vendedor) => vendedor.vendedorStatus === status
    );
  }
}
