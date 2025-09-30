import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Servicios OTOYA

import { ClienteEvaluacionService } from '../../servicios/cliente-evaluacion.service';

import { SistemaEvaluacionIntegradoService } from '../../servicios/sistema-evaluacion-integrado.service';

// Interfaces OTOYA
interface ExpedienteEvaluado {
  id: string;
  solicitudId: string;
  datosBasicos: {
    nombreCompleto: string;
    documentNumber: string;
    edad: number;
    ocupacion: string;
    rangoIngresos: string;
    tipoSolicitud: string;
  };
  evaluacion: {
    estado: 'pendiente' | 'en_proceso' | 'completada' | 'rechazada';
    asignadoA?: string;
    prioridad: 'alta' | 'media' | 'baja';
    scoreTotal: number;
    nivelRiesgo: 'bajo' | 'medio' | 'alto';
    requiereRevisionManual: boolean;
    alertasActivas: string[];
    etapaActual: number;
    porcentajeProgreso: number;
  };
  financiero: {
    precioVehiculo: number;
    montoInicial: number;
    montoCuota: number;
    numeroCuotas: number;
  };
  vehiculo: {
    marca: string;
    modelo: string;
    color: string;
    descripcion: string;
  };
  metadatos: {
    fechaCreacion: Date;
    fechaActualizacion: Date;
    versionModelo: string;
  };
}

interface EstadisticasOTOYA {
  // Resumen de migración
  migracion: {
    totalV1: number;
    totalMigradosOTOYA: number;
    pendientesMigracion: number;
    estadosMigracion?: {
      exitosos: number;
      fallidos: number;
      rollbacks: number;
      enProceso?: number;        // Hacer opcional
      noIniciados?: number;      // Hacer opcional
      cancelados?: number;       // Hacer opcional
    };
    ultimaMigracion?: Date;
    tiempoPromedioMigracion?: number;
    entidadesCreadas: {
      solicitudes: number;
      personas: number;
      vehiculos: number;
      documentos: number;
      referencias: number;
    };
  };
  
  // Evaluación
  evaluacion: {
    expedientesDisponibles: number;
    evaluacionesPendientes: number;
    evaluacionesEnProceso: number;
    evaluacionesCompletadas: number;
    evaluacionesRechazadas: number;
    tiempoPromedioEvaluacion: number;
    tasaAprobacion: number;
    alertasCriticas: number;
  };
  
  // Calidad del sistema
  calidad: {
    integridadDatos: number;
    completitudModelo: number;
    consistenciaRelacional: number;
    errorRate: number;
  };
  ultimaActualizacion: Date;
  sistemaOperativo: boolean;
  alertasActivas: string[];
}

interface ProcesoMigracionOTOYA {
  estado: 'inactivo' | 'verificando' | 'migrando' | 'validando' | 'completado' | 'error';
  mensaje: string;
  progreso?: number;
  detalles?: {
    solicitudesProcesadas: number;
    entidadesCreadas: number;
    tiempoTranscurrido: number;
  };
}

@Component({
  selector: 'app-evaluacion-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './evaluacion-dashboard.component.html',
  styleUrl: './evaluacion-dashboard.component.css'
})
export class EvaluacionDashboardComponent implements OnInit, OnDestroy {

  // Servicios OTOYA
  
  private sistemaOTOYA = inject(SistemaEvaluacionIntegradoService);
 

  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  
  // Destructor para subscripciones
  private destroy$ = new Subject<void>();
  
  // Signals principales OTOYA
  readonly estadisticasOTOYA = signal<EstadisticasOTOYA | null>(null);
  readonly expedientesPendientes = signal<ExpedienteEvaluado[]>([]);
  readonly expedientesEnProceso = signal<ExpedienteEvaluado[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly tabActivo = signal<number>(0);
  
  // Signals para migración OTOYA
  readonly procesoMigracionOTOYA = signal<ProcesoMigracionOTOYA>({ 
    estado: 'inactivo', 
    mensaje: '' 
  });
  readonly sistemaOTOYAListo = signal<boolean>(false);
  
  // Métricas en tiempo real
  
  
  // Configuración de tablas
  readonly displayedColumnsPendientes = ['expediente', 'datos', 'financiero', 'prioridad', 'fecha', 'acciones'];
  readonly displayedColumnsEnProceso = ['expediente', 'evaluador', 'progreso', 'score', 'alertas', 'acciones'];
  
  ngOnInit(): void {
    this.inicializarSistemaOTOYA();
    this.configurarActualizacionesAutomaticas();
    
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Inicializar sistema OTOYA completo
   * 
   * 
   */

  readonly metricsCalidad = computed(() => {
  const stats = this.estadisticasOTOYA();
  if (!stats?.calidad) return null;
  
  return {
    integridadDatos: stats.calidad.integridadDatos || 0,
    completitudModelo: stats.calidad.completitudModelo || 0,
    errorRate: stats.calidad.errorRate || 0
  };
});


  private async inicializarSistemaOTOYA(): Promise<void> {
    try {
      console.log('🚀 Inicializando sistema OTOYA desde dashboard...');
      
      this.procesoMigracionOTOYA.set({
        estado: 'verificando',
        mensaje: 'Inicializando sistema OTOYA...'
      });
      
      // Suscribirse a cambios de estado del sistema OTOYA
      this.sistemaOTOYA.estadoSistemaObservable
        .pipe(takeUntil(this.destroy$))
        .subscribe(estado => {
          this.actualizarEstadoProceso(estado);
        });
      
      // Inicializar sistema OTOYA
      await this.sistemaOTOYA.inicializarSistemaOTOYA();
      
      // Cargar datos una vez inicializado
      if (this.sistemaOTOYAListo()) {
        await this.cargarDatosOTOYA();
      }
      
    } catch (error) {
      console.error('❌ Error inicializando sistema OTOYA:', error);
      this.procesoMigracionOTOYA.set({
        estado: 'error',
        mensaje: `Error inicializando OTOYA: ${error}`
      });
      
      // Intentar cargar datos básicos aunque falle la inicialización
      this.sistemaOTOYAListo.set(true);
      await this.cargarDatosOTOYA();
    }
  }
  
  /**
   * Actualizar estado del proceso basado en el sistema OTOYA
   */
  private actualizarEstadoProceso(estado: any): void {
    if (!estado.procesoActual) {
      if (estado.sistemaListo) {
        this.procesoMigracionOTOYA.set({
          estado: 'completado',
          mensaje: 'Sistema OTOYA listo para evaluación'
        });
        this.sistemaOTOYAListo.set(true);
        
        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
          if (this.procesoMigracionOTOYA().estado === 'completado') {
            this.procesoMigracionOTOYA.set({ estado: 'inactivo', mensaje: '' });
          }
        }, 3000);
      }
      return;
    }
    
    // Mapear estados del sistema a estados del dashboard
    let estadoDashboard: ProcesoMigracionOTOYA['estado'] = 'verificando';
    
    if (estado.procesoActual.includes('Verificando')) {
      estadoDashboard = 'verificando';
    } else if (estado.procesoActual.includes('Migrando')) {
      estadoDashboard = 'migrando';
    } else if (estado.procesoActual.includes('Validando')) {
      estadoDashboard = 'validando';
    } else if (estado.error) {
      estadoDashboard = 'error';
    }
    
    this.procesoMigracionOTOYA.set({
      estado: estadoDashboard,
      mensaje: estado.procesoActual,
      detalles: {
        solicitudesProcesadas: 0, // TODO: obtener del estado
        entidadesCreadas: 0,
        tiempoTranscurrido: 0
      }
    });
  }
  
  /**
   * Cargar datos OTOYA del dashboard
   */
  private async cargarDatosOTOYA(): Promise<void> {
    if (!this.sistemaOTOYA.sistemaListo) {
      console.warn('⚠️ Sistema OTOYA no está listo, esperando...');
      return;
    }
    
    try {
      this.cargando.set(true);
      
      // Cargar resumen del sistema OTOYA
      
      
      
      // Cargar métricas en tiempo real
      
      // Cargar expedientes pendientes
      this.sistemaOTOYA.obtenerExpedientesPendientes()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (expedientes) => {
            const expedientesFormateados = this.formatearExpedientes(expedientes);
            this.expedientesPendientes.set(expedientesFormateados);
          },
          error: (error) => {
            console.error('Error cargando expedientes pendientes:', error);
            this.mostrarError('Error al cargar expedientes pendientes');
          }
        });
      
      // Cargar expedientes en proceso
      this.sistemaOTOYA.obtenerExpedientesEnProceso()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (expedientes) => {
            const expedientesFormateados = this.formatearExpedientes(expedientes);
            this.expedientesEnProceso.set(expedientesFormateados);
          },
          error: (error) => {
            console.error('Error cargando expedientes en proceso:', error);
            this.mostrarError('Error al cargar expedientes en proceso');
          }
        });
      
    } catch (error) {
      console.error('❌ Error cargando datos OTOYA:', error);
      this.mostrarError('Error al cargar los datos del dashboard OTOYA');
    } finally {
      this.cargando.set(false);
    }
  }
  
  /**
   * Formatear expedientes para el dashboard
   */
  private formatearExpedientes(expedientes: any[]): ExpedienteEvaluado[] {
    return expedientes.map(exp => ({
      id: exp.id,
      solicitudId: exp.solicitudId || exp.id,
      datosBasicos: {
        nombreCompleto: exp.datosBasicos?.nombreCompleto || exp.titular?.datosPersonales?.nombreCompleto || 'Sin nombre',
        documentNumber: exp.datosBasicos?.documentNumber || exp.titular?.datosPersonales?.numeroDocumento || 'Sin DNI',
        edad: exp.datosBasicos?.edad || exp.titular?.datosPersonales?.edad || 0,
        ocupacion: exp.datosBasicos?.ocupacion || exp.titular?.datosPersonales?.ocupacion || 'Sin ocupación',
        rangoIngresos: exp.datosBasicos?.rangoIngresos || exp.titular?.datosPersonales?.rangoIngresos || 'No especificado',
        tipoSolicitud: 'Crédito Vehicular'
      },
      evaluacion: {
        estado: exp.evaluacion?.estado || 'pendiente',
        asignadoA: exp.evaluacion?.asignadoA,
        prioridad: exp.evaluacion?.prioridad || 'media',
        scoreTotal: exp.evaluacion?.scoreTotal || exp.titular?.evaluacion?.scoreGeneral || 0,
        nivelRiesgo: exp.evaluacion?.nivelRiesgo || 'medio',
        requiereRevisionManual: exp.evaluacion?.requiereRevisionManual || false,
        alertasActivas: exp.evaluacion?.alertasActivas || exp.alertas?.map((a: any) => a.mensaje) || [],
        etapaActual: exp.solicitud?.estadoCalculado?.etapaActual || 1,
        porcentajeProgreso: exp.solicitud?.estadoCalculado?.porcentajeProgreso || 0
      },
      financiero: {
        precioVehiculo: exp.solicitud?.datosFinancieros?.precioVehiculo || 0,
        montoInicial: exp.solicitud?.datosFinancieros?.montoInicial || 0,
        montoCuota: exp.solicitud?.datosFinancieros?.montoCuota || 0,
        numeroCuotas: exp.solicitud?.datosFinancieros?.numeroCuotas || 0
      },
      vehiculo: {
        marca: exp.vehiculo?.marca || 'Sin especificar',
        modelo: exp.vehiculo?.modelo || 'Sin especificar',
        color: exp.vehiculo?.color || 'Sin especificar',
        descripcion: exp.vehiculo?.descripcionCompleta || 'Vehículo no especificado'
      },
      metadatos: {
        fechaCreacion: new Date(exp.metadatos?.fechaCreacion || exp.solicitud?.fechaCreacion || Date.now()),
        fechaActualizacion: new Date(exp.metadatos?.fechaActualizacion || exp.solicitud?.fechaActualizacion || Date.now()),
        versionModelo: 'OTOYA-2.0'
      }
    }));
  }
  
  /**
   * Configurar actualizaciones automáticas
   */
  private configurarActualizacionesAutomaticas(): void {
    // Actualizar métricas cada 30 segundos
    setInterval(async () => {
      if (this.sistemaOTOYAListo() && !this.cargando()) {
        try {
          
        } catch (error) {
          console.warn('Error actualizando métricas:', error);
        }
      }
    }, 30000);
  }
  
  /**
   * Refrescar datos completos
   */
  async refrescarDatos(): Promise<void> {
    await this.cargarDatosOTOYA();
    this.mostrarExito('Datos OTOYA actualizados correctamente');
  }
  
  /**
   * Forzar migración OTOYA manual
   */
  async forzarMigracionOTOYA(): Promise<void> {
    try {
      this.procesoMigracionOTOYA.set({
        estado: 'migrando',
        mensaje: 'Ejecutando migración OTOYA manual...'
      });
      
      await this.sistemaOTOYA.forzarMigracionOTOYA();
      await this.cargarDatosOTOYA();
      
      this.mostrarExito('Migración OTOYA ejecutada correctamente');
      
    } catch (error) {
      console.error('Error en migración OTOYA:', error);
      this.mostrarError(`Error ejecutando migración OTOYA: ${error}`);
      
      this.procesoMigracionOTOYA.set({
        estado: 'error',
        mensaje: `Error en migración: ${error}`
      });
    }
  }
  
  /**
   * Cambiar tab activo
   */
  cambiarTab(index: number): void {
    this.tabActivo.set(index);
  }
  
  /**
   * Iniciar evaluación de un expediente
   */
  async iniciarEvaluacionExpediente(expedienteId: string): Promise<void> {
    try {
      // Crear expediente OTOYA completo para evaluación
      const expedienteCompleto = await this.sistemaOTOYA.crearExpedienteParaEvaluacion(expedienteId);
      
      this.mostrarExito('Expediente OTOYA preparado para evaluación');
      
      // Navegar a la vista de evaluación con el expediente completo
      await this.router.navigate(['/evaluacion/expediente', expedienteId], {
        state: { expedienteOTOYA: expedienteCompleto }
      });
      
    } catch (error) {
      console.error('Error iniciando evaluación OTOYA:', error);
      this.mostrarError('Error al preparar expediente para evaluación');
    }
  }
  
  /**
   * Continuar evaluación de expediente
   */
  async continuarEvaluacionExpediente(expedienteId: string): Promise<void> {
    await this.router.navigate(['/evaluacion/expediente', expedienteId]);
  }
  
  /**
   * Ver detalle completo del expediente OTOYA
   */
  async verDetalleExpediente(expedienteId: string): Promise<void> {
    try {
      const expedienteCompleto = await this.sistemaOTOYA.crearExpedienteParaEvaluacion(expedienteId);
      
      console.log('Expediente OTOYA completo:', expedienteCompleto);
      
      // TODO: Abrir diálogo con detalles del expediente OTOYA
      this.mostrarInfo('Función de detalle en desarrollo');
      
    } catch (error) {
      console.error('Error obteniendo detalle:', error);
      this.mostrarError('Error al obtener detalle del expediente');
    }
  }
  
  /**
   * Verificar salud del sistema OTOYA
   */
  
  
  /**
   * Reinicializar sistema OTOYA
   */
  
  /**
   * Obtener color para el score
   */
  getScoreColor(score: number): 'primary' | 'accent' | 'warn' {
    if (score >= 80) return 'primary';
    if (score >= 60) return 'accent';
    return 'warn';
  }
  
  /**
   * Obtener color para la prioridad
   */
  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  /**
   * Formatear moneda
   */
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0
    }).format(valor);
  }
  
  /**
   * Obtener descripción de etapa
   */
  getDescripcionEtapa(etapa: number): string {
    const etapas = {
      1: 'Captura inicial',
      2: 'Revisión preliminar', 
      3: 'Evaluación documental',
      4: 'Evaluación de garantes',
      5: 'Entrevista virtual',
      6: 'Decisión final',
      7: 'Generación documentos',
      8: 'Confirmación inicial',
      9: 'Firma contrato',
      10: 'Entrega'
    };
    return etapas[etapa as keyof typeof etapas] || `Etapa ${etapa}`;
  }
  
  // Métodos de utilidad para mensajes (sin cambios)
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }
  
  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 8000,
      panelClass: ['error-snackbar']
    });
  }
  
  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }
  
  private mostrarAdvertencia(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 6000,
      panelClass: ['warning-snackbar']
    });
  }
  
  // ======================================
  // MÉTODOS DE COMPATIBILIDAD (LEGACY)
  // ======================================
  
  /**
   * Métodos para mantener compatibilidad con el template HTML existente
   */
  
  // Getters para compatibilidad con el template
  readonly estadisticas = computed(() => {
  const stats = this.estadisticasOTOYA();
  if (!stats) return null;
  
  return {
    totalPendientes: stats.evaluacion.evaluacionesPendientes,
    totalEnProceso: stats.evaluacion.evaluacionesEnProceso,
    totalCompletadas: stats.evaluacion.evaluacionesCompletadas,
    totalRechazadas: stats.evaluacion.evaluacionesRechazadas,
    tiempoPromedioEvaluacion: stats.evaluacion.tiempoPromedioEvaluacion,
    tasaAprobacion: stats.evaluacion.tasaAprobacion
  };
});
  
  get clientesPendientes() {
    return this.expedientesPendientes;
  }
  
  get clientesEnProceso() {
    return this.expedientesEnProceso;
  }
  
  get procesoMigracion() {
    return this.procesoMigracionOTOYA;
  }
  
  readonly estadisticasMigracion = computed(() => {
  const stats = this.estadisticasOTOYA();
  if (!stats) return null;
  
  return {
    totalOriginales: stats.migracion.totalV1,
    totalMigrados: stats.migracion.totalMigradosOTOYA,
    pendientesMigracion: stats.migracion.pendientesMigracion
  };
});
  
  get sistemaListo() {
    return this.sistemaOTOYAListo;
  }
  
  // Métodos adaptados para compatibilidad
  async cargarDatos(): Promise<void> {
    return this.cargarDatosOTOYA();
  }
  
  async iniciarEvaluacion(clienteId: string): Promise<void> {
    return this.iniciarEvaluacionExpediente(clienteId);
  }
  
  async continuarEvaluacion(clienteId: string): Promise<void> {
    return this.continuarEvaluacionExpediente(clienteId);
  }
  
  async completarEvaluacion(clienteId: string): Promise<void> {
    // TODO: Implementar completar evaluación para expedientes OTOYA
    this.mostrarInfo('Función de completar evaluación en desarrollo para OTOYA');
  }
  
  verDetalleCliente(clienteId: string): void {
    this.verDetalleExpediente(clienteId);
  }
  
  forzarMigracion(): void {
    this.forzarMigracionOTOYA();
  }
  
  
  
}