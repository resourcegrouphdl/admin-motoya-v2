import { Component, OnInit, inject, signal, computed, OnDestroy, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatNativeDateModule } from '@angular/material/core';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Subject, takeUntil, BehaviorSubject, combineLatest, of, delay, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatDividerModule } from "@angular/material/divider";
import { FirebaseService } from '../../servicios/firebase.service';
import { TablaSolicitudesService } from '../../servicios/tabla-solicitudes.service';

// Interfaces existentes
export interface FormTitular {
  apellido: string;
  departamento: string;
  direccion: string;
  distrito: string;
  dniFrenteuRL: string;
  dniReversoURL: string;
  documentNumber: string;
  documentType: string;
  email: string;
  estadoCivil: string;
  fechaNacimiento: string;
  fotoCasaURL: string;
  licConducirFrenteURL: string;
  licConducirReversoURL: string;
  licenciaConducir: string;
  licenciaStatus: string;
  nombre?: string;
  provincia?: string;
  reciboDeServicioURL: string;
  serlfieURL: string;
  telefono1: string;
  telefono2: string;
}

export interface FormFiador {
  apellidoFiador: string;
  departamentoFiador: string;
  direccionFiador: string;
  distritoFiador: string;
  dniFrenteuRLfiador: string;
  dniReversoURLfiador: string;
  documentNumberFiador: string;
  documentTypeFiador: string;
  emailFiador: string;
  estadoCivilFiador: string;
  fechaNacimientoFiador: string;
  fotoCasaURLfiador: string;
  nombreFiador: string;
  provinciaFiador: string;
  telefonoPriFiador: string;
  telefonoSegFiador: string;
}

export interface FormVehiculo {
  archivos: string[];
  colorVehiculo: string;
  inicialVehiculo: string;
  marcaVehiculo: string;
  mensajeOpcional: string;
  modeloVehiculo: string;
  montotDeLaCuota: string;
  nombreDelVendedor: string;
  numeroQuincenas: string;
  precioCompraMoto: string;

  priApellidoReferenciaTitular: string;
  priNombreReferenciaTitular: string;
  priParentescoReferenciaTitular: string;
  priTelefonoReferenciaTitular: string;

  segApellidoReferenciaTitular: string;
  segNombreReferenciaTitular: string;
  segParentescoReferenciaTitular: string;
  segTelefonoReferenciaTitular: string;

  terApellidoReferenciaTitular: string;
  terNombreReferenciaTitular: string;
  terParentescoReferenciaTitular: string;
  terTelefonoReferenciaTitular: string;
  
  puntoDeVenta: string;
}

export interface FormularioFirebase {
  id?: string;
  formTitular: FormTitular;
  formularioFiador: FormFiador;
  formularioVehiculo: FormVehiculo;
  createdAt?: any;
  updatedAt?: any;
  fromCache?: boolean;
  hasPendingWrites?: boolean;
}

// Interface mejorada para la vista de la tabla
interface CreditRequest {
  id: string;
  clientName: string;
  registrationDate: Date;
  sellerName: string;
  amount: number;
  status: 'pending' | 'in-progress' | 'approved' | 'rejected';
  puntoVenta: string;
  vehiculo: string;
  telefono: string;
  email: string;
  priority?: 'high' | 'medium' | 'low';
  progress?: number;
  statusNote?: string;
}

@Component({
  selector: 'app-tabla-de-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
],
  templateUrl: './tabla-de-solicitudes.component.html',
  styleUrl: './tabla-de-solicitudes.component.css'
})
export class TablaDeSolicitudesComponent implements OnInit, OnDestroy {

   readonly dialog = inject(MatDialog);
  

   @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private dataService = inject(TablaSolicitudesService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Estado principal
  private searchTermInternal = signal<string>('');
  private statusFilterInternal = signal<string>('all');
  private isLoadingInternal = signal<boolean>(false);

  // Datos principales desde el servicio
  readonly requests = this.dataService.requests;
  readonly stats = this.dataService.stats;
  readonly isServiceLoading = computed(() => this.isLoadingInternal());

  // Filtros y búsqueda
  readonly searchTerm = this.searchTermInternal.asReadonly();
  readonly statusFilter = this.statusFilterInternal.asReadonly();

  // Datos filtrados
  readonly filteredRequests = computed(() => {
    const allRequests = this.requests();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    if (!search && status === 'all') {
      this.log(`📊 Mostrando todos los datos: ${allRequests.length} solicitudes`);
      return allRequests;
    }

    let filtered = allRequests;

    // Filtro por búsqueda
    if (search) {
      filtered = filtered.filter(req => 
        req.clientName.toLowerCase().includes(search) ||
        req.sellerName.toLowerCase().includes(search) ||
        req.email.toLowerCase().includes(search) ||
        req.telefono.includes(search) ||
        req.vehiculo.toLowerCase().includes(search) ||
        req.puntoVenta.toLowerCase().includes(search)
      );
      this.log(`🔍 Filtro de búsqueda "${search}": ${filtered.length} resultados`);
    }

    // Filtro por estado
    if (status !== 'all') {
      filtered = filtered.filter(req => req.status === status);
      this.log(`🔽 Filtro por estado "${status}": ${filtered.length} resultados`);
    }

    return filtered;
  });

  // Configuración de tabla
  displayedColumns: string[] = ['clientName', 'registrationDate', 'sellerName', 'amount', 'status', 'actions'];
  dataSource = new MatTableDataSource<CreditRequest>([]);

  // Subject para búsqueda con debounce
  private searchSubject = new Subject<string>();

  constructor() {
    // Efecto para actualizar tabla cuando cambian los datos filtrados
    effect(() => {
      const filtered = this.filteredRequests();
      this.dataSource.data = filtered;
      this.log(`📋 Tabla actualizada con ${filtered.length} elementos`);
    });

    // Configurar búsqueda con debounce
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
    this.log('🚀 Iniciando TablaDeSolicitudesComponent');
    this.loadInitialData();
    this.setupTableConfiguration();
  }

  ngOnDestroy(): void {
    this.log('🔚 Destruyendo TablaDeSolicitudesComponent');
    this.destroy$.next();
    this.destroy$.complete();
  }

  abrirDialogoMigracion(idSolicitud: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      disableClose: true, // Evita cerrar con ESC o click fuera
      data: { id: idSolicitud }
    });

    // Suscribirse al resultado del diálogo
    dialogRef.afterClosed().subscribe(resultado => {
      this.procesarResultadoMigracion(resultado, idSolicitud);
    });
  }
  private procesarResultadoMigracion(resultado: any, idSolicitud: string): void {
    if (!resultado) {
      console.log('Migración cancelada por el usuario');
      return;
    }

    if (resultado.confirmado) {
      if (resultado.resultado) {
        // Migración exitosa
        console.log('Migración completada:', resultado.estadoMigracion);
        
        this.snackBar.open(
          `Solicitud ${idSolicitud} migrada exitosamente`,
          'Cerrar',
          { duration: 5000, panelClass: ['success-snackbar'] }
        );

        // Aquí puedes actualizar la tabla, recargar datos, etc.
        
        
        // Opcional: mostrar detalles de la migración
        this.mostrarDetallesMigracion(resultado.estadoMigracion);

      } else {
        // Migración falló
        console.error('Error en la migración de solicitud:', idSolicitud);
        
        this.snackBar.open(
          'Error al migrar la solicitud. Inténtelo nuevamente.',
          'Cerrar',
          { duration: 8000, panelClass: ['error-snackbar'] }
        );
      }
    }
  }

  private mostrarDetallesMigracion(estadoMigracion: any): void {
    console.log('Detalles de la migración:', {
      solicitudOriginal: estadoMigracion.idCliente,
      nuevaSolicitud: estadoMigracion.idSolicitud,
      codigoGenerado: estadoMigracion.codigoSolicitud,
      titularCreado: estadoMigracion.idTitular,
      fiadorCreado: estadoMigracion.idFiador,
      datosPersonalesCreados: estadoMigracion.idDatosPersonales
    });
  }
  /**
   * Configuración inicial de búsqueda con debounce
   */
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm);
      });
  }

  /**
   * Carga datos iniciales
   */
  private loadInitialData(): void {
    this.log('⬇️ Cargando datos iniciales...');
    this.isLoadingInternal.set(true);

    this.dataService.getSolicitudes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          this.isLoadingInternal.set(false);
          this.showSuccess(`✅ ${requests.length} solicitudes cargadas`);
        },
        error: (error) => {
          this.handleError('❌ Error al cargar solicitudes', error);
        }
      });
  }

  /**
   * Configura tabla después de la vista inicializada
   */
  private setupTableConfiguration(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
        this.log('📄 Paginador configurado');
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
        this.log('🔢 Ordenamiento configurado');
      }
    });
  }

  /**
   * Maneja cambios en el input de búsqueda
   */
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.searchTermInternal.set(value);
    
    // Usar subject para debounce solo en búsquedas del servicio
    if (value.trim()) {
      this.searchSubject.next(value.trim());
    }
  }

  /**
   * Ejecuta búsqueda en el servicio
   */
  private performSearch(searchTerm: string): void {
    this.log(`🔍 Ejecutando búsqueda: "${searchTerm}"`);
    this.isLoadingInternal.set(true);

    this.dataService.searchSolicitudes(searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          this.isLoadingInternal.set(false);
          this.log(`✅ Búsqueda completada: ${requests.length} resultados`);
        },
        error: (error) => {
          this.handleError('❌ Error en búsqueda', error);
        }
      });
  }

  /**
   * Limpia búsqueda
   */
  clearSearch(): void {
    this.log('🗑️ Limpiando búsqueda');
    this.searchTermInternal.set('');
    this.loadInitialData();
  }

  /**
   * Cambia filtro de estado
   */
  onStatusFilterChange(status: string): void {
    this.log(`🔽 Cambiando filtro de estado a: ${status}`);
    this.statusFilterInternal.set(status);
  }

  /**
   * Refresca datos
   */
  refreshData(): void {
    this.log('🔄 Refrescando datos...');
    this.isLoadingInternal.set(true);

    this.dataService.refresh()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          this.isLoadingInternal.set(false);
          this.showSuccess(`🔄 Datos actualizados: ${requests.length} solicitudes`);
        },
        error: (error) => {
          this.handleError('❌ Error al actualizar', error);
        }
      });
  }

  /**
   * Maneja ordenamiento
   */
  onSortChange(sort: Sort): void {
    this.log(`📊 Ordenamiento cambiado: ${sort.active} ${sort.direction}`);
    // El MatTableDataSource maneja el ordenamiento automáticamente
  }

  // === ACCIONES DE TABLA ===

  /**
   * Ver detalles
   */
  viewDetails(request: CreditRequest): void {
    this.log(`👁️ Ver detalles: ${request.clientName} (${request.id})`);
    this.showInfo(`Mostrando detalles de ${request.clientName}`);
  }

  /**
   * Editar solicitud
   */
  editRequest(request: CreditRequest): void {
    this.log(`✏️ Editar: ${request.clientName} (${request.id})`);
    this.showInfo(`Editando solicitud de ${request.clientName}`);
  }

  /**
   * Iniciar proceso
   */
  startProcess(request: CreditRequest): void {
    if (request.status !== 'pending') {
      this.showWarning('Solo se pueden procesar solicitudes pendientes');
      return;
    }

    this.log(`▶️ Iniciar proceso: ${request.clientName} (${request.id})`);
    this.showSuccess(`Proceso iniciado para ${request.clientName}`);
  }

  /**
   * Exportar datos
   */
  exportData(): void {
    const dataToExport = this.filteredRequests();
    this.log(`📤 Exportar ${dataToExport.length} solicitudes`);
    this.showInfo(`Exportando ${dataToExport.length} solicitudes`);
  }

  // === UTILIDADES DE VISTA ===

  /**
   * Formatea fecha
   */
  formatDate(date: Date): string {
    if (!date || date.getTime() <= 86400000) return 'Sin fecha';
    
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Formatea monto
   */
  formatAmount(amount: number): string {
    if (!amount) return 'S/ 0.00';
    
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  /**
   * CSS para estado
   */
  getStatusClass(status: string): string {
    const classes = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Texto del estado
   */
  getStatusText(status: string): string {
    const texts = {
      'pending': 'Pendiente',
      'in-progress': 'En Proceso',
      'approved': 'Aprobado',
      'rejected': 'Rechazado'
    };
    return texts[status as keyof typeof texts] || 'Desconocido';
  }

  /**
   * Icono del estado
   */
  getStatusIcon(status: string): string {
    const icons = {
      'pending': 'schedule',
      'in-progress': 'hourglass_empty',
      'approved': 'check_circle',
      'rejected': 'cancel'
    };
    return icons[status as keyof typeof icons] || 'help';
  }

  /**
   * CSS para prioridad
   */
  getPriorityClass(priority?: string): string {
    if (!priority) return 'text-gray-600';
    
    const classes = {
      'high': 'text-red-600 font-semibold',
      'medium': 'text-yellow-600 font-medium',
      'low': 'text-green-600'
    };
    return classes[priority as keyof typeof classes] || 'text-gray-600';
  }

  /**
   * Tiempo transcurrido
   */
  getTimeAgo(date: Date): string {
    const diffInHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'hace menos de 1 hora';
    if (diffInHours < 24) return `hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `hace ${diffInDays} días`;
    
    return `hace ${Math.floor(diffInDays / 30)} meses`;
  }

  /**
   * Obtiene iniciales del nombre
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // === MANEJO DE MENSAJES ===

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 2000
    });
  }

  private showWarning(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private handleError(message: string, error: any): void {
    this.log(`❌ ${message}: ${error.message || error}`);
    this.isLoadingInternal.set(false);
    this.showError(message);
  }

  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`%c[${timestamp}] Component: ${message}`, 'color: #9C27B0; font-weight: bold;');
  }
}