import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, combineLatest, filter, startWith, map } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';
import {
  TiendaProfile,
  TiendaStatus,
  VendedorProfile,
  VendedorStatus,
} from '../enums/user-type.types';
import { ExternalUserService } from '../services/external-user.service';
import { DateUtils } from '../enums/date-utils';
import { CreateTiendaDialogComponent } from '../create-tienda-dialog/create-tienda-dialog.component';
import { CreateVendedorDialogComponent } from '../create-vendedor-dialog/create-vendedor-dialog.component';

@Component({
  selector: 'app-external-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIcon,
    MatFormField,
    MatLabel,
    MatTabsModule,
    MatTableModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './external-users.component.html',
  styleUrl: './external-users.component.css',
})
export class ExternalUsersComponent implements OnInit, OnDestroy {
  private externalUsersService = inject(ExternalUserService);
  private errorHandler = inject(ErrorHandlerService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Data arrays - populated by subscriptions
  tiendas: TiendaProfile[] = [];
  vendedores: VendedorProfile[] = [];
  filteredTiendas: TiendaProfile[] = [];
  filteredVendedores: VendedorProfile[] = [];
  availableTiendas: Array<{ value: string; label: string }> = [];

  // Loading state - SOLO usar el del servicio
  isLoading = false;
  
  // Estado de inicialización para evitar filtros prematuros
  isDataInitialized = false;

  // Filter states
  selectedTiendaStatus = '';
  selectedTiendaFilter = '';
  selectedVendedorStatus = '';

  // Table configuration
  vendedoresDisplayedColumns = [
    'avatar',
    'info',
    'tienda',
    'status',
    'commission',
    'hireDate',
    'actions',
  ];

  // Status configuration
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
    console.log('🚀 ExternalUsersComponent iniciando...');
    this.setupSubscriptions();
    this.initializeData();
  }

  ngOnDestroy(): void {
    console.log('🔚 ExternalUsersComponent destruyendo...');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configure subscriptions to service observables
   * Usa filter para evitar ejecutar filtros antes de que los datos estén listos
   */
  private setupSubscriptions(): void {
    console.log('📡 Configurando subscripciones...');
    
    // Subscription combinada solo cuando los datos estén listos
    combineLatest([
      this.externalUsersService.tiendas$,
      this.externalUsersService.vendedores$,
      this.externalUsersService.loading$
    ])
    .pipe(
      takeUntil(this.destroy$),
      // Solo procesar cuando no esté cargando Y tengamos datos reales
      filter(([tiendas, vendedores, loading]) => {
        const hasData = tiendas.length > 0 || vendedores.length > 0 || !loading;
        console.log('🔍 Filtrando subscription:', { 
          tiendasLength: tiendas.length, 
          vendedoresLength: vendedores.length, 
          loading, 
          hasData 
        });
        return hasData;
      })
    )
    .subscribe(([tiendas, vendedores, loading]) => {
      console.log('📊 Datos procesados en subscription:', {
        tiendas: tiendas.length,
        vendedores: vendedores.length,
        loading
      });

      // Update local data
      this.tiendas = tiendas;
      this.vendedores = vendedores;
      this.isLoading = loading;
      
      // Marcar como inicializado solo si no está cargando
      if (!loading) {
        this.isDataInitialized = true;
        console.log('✅ Datos inicializados, aplicando filtros...');
        
        // Apply filters después de asegurar que los datos están listos
        this.filterTiendas();
        this.filterVendedores();

        console.log('✅ Estado actualizado:', {
          filteredTiendas: this.filteredTiendas.length,
          filteredVendedores: this.filteredVendedores.length,
          isDataInitialized: this.isDataInitialized
        });
      }
    });
  }

  /**
   * Initialize data using the service's unified method
   */
  private async initializeData(): Promise<void> {
    console.log('📊 Iniciando inicialización de datos...');
    
    try {
      // Usar el método unificado del servicio
      await this.externalUsersService.initializeData();
      
      // Cargar tiendas para selector después de que los datos principales estén listos
      console.log('📋 Cargando tiendas para selector...');
      this.availableTiendas = await this.externalUsersService.getTiendasForSelector();
      console.log('📋 Tiendas disponibles para selector:', this.availableTiendas.length);

    } catch (error) {
      console.error('❌ Error en inicialización:', error);
      this.errorHandler.handleError(error, 'InitializeExternalUsers');
    }
  }

  /**
   * Filter tiendas based on current criteria
   * Solo ejecutar si los datos están inicializados
   */
  filterTiendas(): void {
    if (!this.isDataInitialized) {
      console.log('⚠️ Saltando filtro de tiendas - datos no inicializados');
      return;
    }

    console.log('🔍 Filtrando tiendas. Estado seleccionado:', this.selectedTiendaStatus);
    console.log('🔍 Total tiendas antes del filtro:', this.tiendas.length);
    
    this.filteredTiendas = this.tiendas.filter((tienda) => {
      // Status filter
      if (this.selectedTiendaStatus && tienda.tiendaStatus !== this.selectedTiendaStatus) {
        return false;
      }
      return true;
    });
    
    console.log('🔍 Tiendas después del filtro:', this.filteredTiendas.length);
  }

  /**
   * Filter vendedores based on current criteria
   * Solo ejecutar si los datos están inicializados
   */
  filterVendedores(): void {
    if (!this.isDataInitialized) {
      console.log('⚠️ Saltando filtro de vendedores - datos no inicializados');
      return;
    }

    console.log('🔍 Filtrando vendedores. Filtros:', {
      tienda: this.selectedTiendaFilter,
      status: this.selectedVendedorStatus
    });
    console.log('🔍 Total vendedores antes del filtro:', this.vendedores.length);
    
    this.filteredVendedores = this.vendedores.filter((vendedor) => {
      // Tienda filter
      if (this.selectedTiendaFilter && vendedor.tiendaId !== this.selectedTiendaFilter) {
        return false;
      }
      // Status filter
      if (this.selectedVendedorStatus && vendedor.vendedorStatus !== this.selectedVendedorStatus) {
        return false;
      }
      return true;
    });
    
    console.log('🔍 Vendedores después del filtro:', this.filteredVendedores.length);
  }

  /**
   * Filter event handlers
   */
  onTiendaStatusChange(): void {
    console.log('🔄 Cambio en filtro de estado de tienda:', this.selectedTiendaStatus);
    this.filterTiendas();
  }

  onTiendaFilterChange(): void {
    console.log('🔄 Cambio en filtro de tienda:', this.selectedTiendaFilter);
    this.filterVendedores();
  }

  onVendedorStatusChange(): void {
    console.log('🔄 Cambio en filtro de estado de vendedor:', this.selectedVendedorStatus);
    this.filterVendedores();
  }

  /**
   * Refresh data method
   */
  async refreshData(): Promise<void> {
    console.log('🔄 Refrescando datos...');
    this.isDataInitialized = false;
    await this.externalUsersService.refreshAllData();
  }

  /**
   * Dialog methods
   */
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
        // No necesario recargar manualmente, el servicio ya lo hace
        // pero recargar las tiendas para selector
        this.loadTiendasForSelector();
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
        // El servicio ya actualiza automáticamente los observables
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
        // El servicio ya actualiza automáticamente los observables
      }
    });
  }

  /**
   * Action methods
   */
  async loadVendedoresByTienda(tiendaId: string): Promise<void> {
    try {
      const vendedores = await this.externalUsersService.getVendedoresByTienda(tiendaId);
      console.log(`Vendedores de tienda ${tiendaId}:`, vendedores);
      // TODO: Show in modal or expand card
    } catch (error) {
      this.errorHandler.handleError(error, 'LoadVendedoresByTienda');
    }
  }

  viewTiendaDetails(tienda: TiendaProfile): void {
    console.log('Ver detalles tienda:', tienda);
    // TODO: Implement details modal
  }

  editTienda(tienda: TiendaProfile): void {
    console.log('Editar tienda:', tienda);
    // TODO: Implement edit functionality
  }

  async changeTiendaStatus(tienda: TiendaProfile, newStatus: string): Promise<void> {
    try {
      const result = await this.externalUsersService.updateTiendaStatus(
        tienda.uid,
        newStatus as TiendaStatus,
        'current-user-uid' // TODO: Get from auth service
      );

      if (result.success) {
        this.errorHandler.showSuccess(
          `Tienda ${newStatus === 'activa' ? 'activada' : 'suspendida'} exitosamente`
        );
      } else {
        this.errorHandler.showWarning(result.error || 'Error al cambiar estado');
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'ChangeTiendaStatus');
    }
  }

  viewVendedorDetails(vendedor: VendedorProfile): void {
    console.log('Ver detalles vendedor:', vendedor);
    // TODO: Implement details modal
  }

  editVendedor(vendedor: VendedorProfile): void {
    console.log('Editar vendedor:', vendedor);
    // TODO: Implement edit functionality
  }

  async changeVendedorStatus(vendedor: VendedorProfile, newStatus: string): Promise<void> {
    try {
      const result = await this.externalUsersService.updateVendedorStatus(
        vendedor.uid,
        newStatus as VendedorStatus,
        'current-user-uid' // TODO: Get from auth service
      );

      if (result.success) {
        this.errorHandler.showSuccess(
          `Vendedor ${newStatus === 'activo' ? 'activado' : 'suspendido'} exitosamente`
        );
      } else {
        this.errorHandler.showWarning(result.error || 'Error al cambiar estado');
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'ChangeVendedorStatus');
    }
  }

  /**
   * Utility methods
   */
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
    const firstInitial = vendedor.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = vendedor.lastName?.charAt(0)?.toUpperCase() || '';
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

  /**
   * Statistics methods
   */
  getTiendasByStatus(status: string): TiendaProfile[] {
    return this.tiendas.filter((tienda) => tienda.tiendaStatus === status);
  }

  getVendedoresByStatus(status: string): VendedorProfile[] {
    return this.vendedores.filter((vendedor) => vendedor.vendedorStatus === status);
  }

  /**
   * Helper method to reload tiendas for selector
   */
  private async loadTiendasForSelector(): Promise<void> {
    try {
      this.availableTiendas = await this.externalUsersService.getTiendasForSelector();
      console.log('📋 Tiendas para selector actualizadas:', this.availableTiendas.length);
    } catch (error) {
      console.error('❌ Error cargando tiendas para selector:', error);
    }
  }

  /**
   * Debug methods
   */
  debugComponentState(): void {
    console.log('🐛 Estado actual del componente:', {
      isLoading: this.isLoading,
      isDataInitialized: this.isDataInitialized,
      tiendas: this.tiendas.length,
      filteredTiendas: this.filteredTiendas.length,
      vendedores: this.vendedores.length,
      filteredVendedores: this.filteredVendedores.length,
      availableTiendas: this.availableTiendas.length,
      filters: {
        selectedTiendaStatus: this.selectedTiendaStatus,
        selectedTiendaFilter: this.selectedTiendaFilter,
        selectedVendedorStatus: this.selectedVendedorStatus
      },
      serviceState: {
        isDataLoaded: this.externalUsersService.isDataLoaded,
        currentTiendas: this.externalUsersService.currentTiendas.length,
        currentVendedores: this.externalUsersService.currentVendedores.length,
        isLoading: this.externalUsersService.isLoading
      }
    });
  }

  onDebugClick(): void {
    this.debugComponentState();
  }

  /**
   * TrackBy functions for performance
   */
  trackByTiendaId(index: number, tienda: TiendaProfile): string {
    return tienda.uid;
  }

  trackByVendedorId(index: number, vendedor: VendedorProfile): string {
    return vendedor.uid;
  }
}