import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, interval, map, Observable, combineLatest } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { ESTADOS_CONFIG, EstadoSolicitud, ExpedienteCompleto, FASES_PROCESO } from '../../admin-clientes/modelos/modelos-solicitudes';
import { ExpedienteService } from '../services/expediente.service';
import { MatDivider } from "@angular/material/divider";
import { MatMenu } from "@angular/material/menu";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { ExpedienteResumenComponent } from '../expediente-resumen/expediente-resumen.component';
import { ClienteDetalleComponent } from '../cliente-detalle/cliente-detalle.component';
import { VehiculoDetalleComponent } from '../vehiculo-detalle/vehiculo-detalle.component';
import { ReferenciaDetalleComponent } from '../referencia-detalle/referencia-detalle.component';
import { DocumentosProcesoComponent } from '../documentos-proceso/documentos-proceso.component';
import { EntrevistasDetalleComponent } from '../entrevistas-detalle/entrevistas-detalle.component';
import { EvaluacionIntegralComponent } from '../evaluacion-integral/evaluacion-integral.component';
import { DecisionFinalComponent } from '../decision-final/decision-final.component';
import { DocumentacionLegalComponent } from '../documentacion-legal/documentacion-legal.component';
import { ProcesoEntregaComponent } from '../proceso-entrega/proceso-entrega.component';
import {provideNativeDateAdapter} from '@angular/material/core';

interface TabInfo {
  id: string;
  label: string;
  icon: string;
  disponible: boolean;
  completado: boolean;
  badge?: string;
  color?: string;
}

interface AlertaInfo {
  tipo: 'error' | 'warning' | 'info' | 'success';
  mensaje: string;
  accion?: string;
}
@Component({
  selector: 'app-expediente-detalle',
  providers: [provideNativeDateAdapter()],
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDivider,
    MatMenu,
    MatProgressSpinner,
    MatMenuModule,
    ExpedienteResumenComponent,
    ClienteDetalleComponent,
    VehiculoDetalleComponent,
    ReferenciaDetalleComponent,
    DocumentosProcesoComponent,
    EntrevistasDetalleComponent,
    EvaluacionIntegralComponent,
    DecisionFinalComponent,
    DocumentacionLegalComponent,
    ProcesoEntregaComponent
    
],
  templateUrl: './expediente-detalle.component.html',
  styleUrl: './expediente-detalle.component.css'
})
export class ExpedienteDetalleComponent  implements OnInit, OnDestroy {
 private destroy$ = new Subject<void>();
  
  // Propiedades principales
  expediente: ExpedienteCompleto | null = null;
  cargando = false;
  error: string | null = null;
  
  // Navegación y UI
  tabActiva = 'resumen';
  tabs: TabInfo[] = [];
  alertas: AlertaInfo[] = [];
  accionesDisponibles: string[] = [];
  mostrarPanelObservaciones = false;
  
  // Referencias constantes
  ESTADOS_CONFIG = ESTADOS_CONFIG;
  FASES_PROCESO = FASES_PROCESO;

  // ======================================
  // PROPIEDADES CALCULADAS
  // ======================================

  get estadoActual(): EstadoSolicitud | undefined {
    return this.expediente?.solicitud.estado;
  }

  get configEstadoActual() {
    return this.estadoActual ? ESTADOS_CONFIG[this.estadoActual] : null;
  }

  get tiempoRestante(): number | null {
    if (!this.expediente?.solicitud.fechaLimiteEvaluacion) return null;
    return this.expedienteService.calcularTiempoRestante(this.expediente.solicitud.fechaLimiteEvaluacion);
  }

  get tiempoRestanteFormateado(): string | null {
    const tiempo = this.tiempoRestante;
    return tiempo !== null ? this.expedienteService.formatearTiempo(tiempo) : null;
  }

  get progresoLinealTiempo(): number {
    if (!this.expediente?.solicitud.fechaLimiteEvaluacion || !this.expediente?.solicitud.fechaAsignacion) {
      return 0;
    }
    
    const ahora = new Date();
    const inicio = this.expediente.solicitud.fechaAsignacion;
    const limite = this.expediente.solicitud.fechaLimiteEvaluacion;
    
    const tiempoTotal = limite.getTime() - inicio.getTime();
    const tiempoTranscurrido = ahora.getTime() - inicio.getTime();
    
    return Math.min(100, Math.max(0, (tiempoTranscurrido / tiempoTotal) * 100));
  }

  get puedeEditarExpediente(): boolean {
    if (!this.expediente) return false;
    
    const estadosEditables: EstadoSolicitud[] = [
      'pendiente', 'en_revision_inicial', 'evaluacion_documental', 
      'documentos_observados', 'evaluacion_garantes', 'entrevista_programada',
      'en_entrevista', 'entrevista_completada', 'en_decision'
    ];
    
    return estadosEditables.includes(this.expediente.solicitud.estado);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private expedienteService: ExpedienteService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  // ======================================
  // CICLO DE VIDA DEL COMPONENTE
  // ======================================

  ngOnInit(): void {
    this.inicializarComponente();
  }

   ngOnDestroy(): void {
  // Limpiar recursos del componente antes de destruir
  this.limpiarRecursosComponente();
  
  // Completar observables y limpiar subscripciones
  this.destroy$.next();
  this.destroy$.complete();
  
  // Limpiar estado del servicio
  this.expedienteService.limpiarEstado();
}
  

  // ======================================
  // INICIALIZACIÓN
  // ======================================|

   inicializarComponente(): void {
    const expedienteId = this.route.snapshot.paramMap.get('id');
    
    if (!expedienteId) {
      this.mostrarError('ID de expediente no válido');
      this.regresarAlDashboard();
      return;
    }

    // Suscribirse a los observables del servicio
    this.suscribirseADatos();
    
    // Cargar expediente completo
    this.cargarExpediente(expedienteId);
  }

  private suscribirseADatos(): void {
    combineLatest([
      this.expedienteService.expediente$,
      this.expedienteService.cargando$,
      this.expedienteService.error$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([expediente, cargando, error]) => {
        this.expediente = expediente;
        this.cargando = cargando;
        this.error = error;
        
        if (expediente) {
          this.procesarExpedienteCargado();
        }
      },
      error: (error) => {
        console.error('Error en suscripción:', error);
        this.mostrarError('Error en la comunicación con el servidor');
      }
    });
  }

  private cargarExpediente(expedienteId: string): void {
    this.expedienteService.obtenerExpedienteCompleto(expedienteId).subscribe({
      error: (error) => {
        console.error('Error al cargar expediente:', error);
        this.mostrarError('Error al cargar el expediente');
      }
    });
  }

  private procesarExpedienteCargado(): void {
    if (!this.expediente) return;
    
    this.actualizarTabs();
    this.actualizarAlertas();
    this.obtenerAccionesDisponibles();
    this.verificarNotificacionesAutomaticas();
  }

  // ======================================
  // GESTIÓN DE PESTAÑAS
  // ======================================

  private actualizarTabs(): void {
    if (!this.expediente) return;

    const estado = this.expediente.solicitud.estado;
    const solicitud = this.expediente.solicitud;

    this.tabs = [
      {
        id: 'resumen',
        label: 'Resumen',
        icon: 'dashboard',
        disponible: true,
        completado: true
      },
      {
        id: 'titular',
        label: 'Titular',
        icon: 'person',
        disponible: true,
        completado: this.expediente.titular.datosVerificados || false,
        badge: this.getDocumentoBadge(this.expediente.titular.estadoValidacionDocumentos),
        color: this.getDocumentoColor(this.expediente.titular.estadoValidacionDocumentos)
      },
      {
        id: 'fiador',
        label: 'Fiador',
        icon: 'supervisor_account',
        disponible: !!this.expediente.fiador,
        completado: this.expediente.fiador?.datosVerificados || false,
        badge: this.getDocumentoBadge(this.expediente.fiador?.estadoValidacionDocumentos),
        color: this.getDocumentoColor(this.expediente.fiador?.estadoValidacionDocumentos)
      },
      {
        id: 'vehiculo',
        label: 'Vehículo',
        icon: 'two_wheeler',
        disponible: true,
        completado: true
      },
      {
        id: 'referencias',
        label: 'Referencias',
        icon: 'contacts',
        disponible: this.expediente.referencias.length > 0,
        completado: this.calcularCompletitudReferencias(),
        badge: this.getReferenciaBadge()
      },
      {
        id: 'documentos',
        label: 'Documentos',
        icon: 'folder',
        disponible: this.puedeAccederADocumentos(estado),
        completado: this.calcularCompletitudDocumentos(),
        badge: this.getDocumentosProcesoBadge()
      },
      {
        id: 'entrevistas',
        label: 'Entrevistas',
        icon: 'record_voice_over',
        disponible: this.puedeAccederAEntrevistas(estado),
        completado: this.calcularCompletitudEntrevistas(),
        badge: this.getEntrevistasBadge()
      },
      {
        id: 'evaluacion',
        label: 'Evaluación',
        icon: 'assessment',
        disponible: this.puedeAccederAEvaluacion(estado),
        completado: this.calcularCompletitudEvaluacion(),
        color: this.getEvaluacionColor()
      },
      {
        id: 'decision',
        label: 'Decisión',
        icon: 'gavel',
        disponible: this.puedeAccederADecision(estado),
        completado: !!solicitud.decisionFinal,
        color: this.getDecisionColor(solicitud.decisionFinal)
      },
      {
        id: 'documentacion',
        label: 'Documentación',
        icon: 'description',
        disponible: this.puedeAccederADocumentacion(estado),
        completado: this.calcularCompletitudDocumentacion()
      },
      {
        id: 'entrega',
        label: 'Entrega',
        icon: 'local_shipping',
        disponible: this.puedeAccederAEntrega(estado),
        completado: solicitud.entregaCompletada || false
      }
    ].filter(tab => tab.disponible);
  }

  private getDocumentoBadge(estadoValidacion?: string): string | undefined {
    if (estadoValidacion === 'observado') return '!';
    if (estadoValidacion === 'pendiente') return '?';
    return undefined;
  }

  private getDocumentoColor(estadoValidacion?: string): string {
    switch (estadoValidacion) {
      case 'aprobado': return 'primary';
      case 'observado': return 'warn';
      case 'rechazado': return 'warn';
      default: return 'accent';
    }
  }

  private getReferenciaBadge(): string {
    if (!this.expediente) return '0';
    const verificadas = this.expediente.referencias.filter(r => r.estadoVerificacion === 'verificado').length;
    const total = this.expediente.referencias.length;
    return `${verificadas}/${total}`;
  }

  private getDocumentosProcesoBadge(): string | undefined {
  const observados = this.expediente?.documentosProceso
    ?.filter(d => d.estado === 'observado').length ?? 0;

  return observados > 0 ? observados.toString() : undefined;
}

  private getEntrevistasBadge(): string {
    if (!this.expediente) return '0';
    const completadas = this.expediente.evaluaciones.filter(
      e => e.tipoEvaluacion === 'entrevista' && e.estado === 'completada'
    ).length;
    return completadas.toString();
  }

  private getEvaluacionColor(): string {
    if (!this.expediente?.solicitud.scoreFinal) return 'accent';
    const score = this.expediente.solicitud.scoreFinal;
    if (score >= 80) return 'primary';
    if (score >= 60) return 'accent';
    return 'warn';
  }

  private getDecisionColor(decision?: string): string {
    switch (decision) {
      case 'aprobado': return 'primary';
      case 'rechazado': return 'warn';
      case 'condicional': return 'accent';
      default: return 'accent';
    }
  }

  // ======================================
  // CÁLCULOS DE COMPLETITUD
  // ======================================

  private calcularCompletitudReferencias(): boolean {
    if (!this.expediente) return false;
    const verificadas = this.expediente.referencias.filter(r => r.estadoVerificacion === 'verificado').length;
    return verificadas >= 2; // Mínimo 2 referencias verificadas
  }

  private calcularCompletitudDocumentos(): boolean {
  const docs = this.expediente?.documentosProceso ?? [];

  const documentosPendientes = docs.filter(
    d => d.estado === 'pendiente' || d.estado === 'observado'
  );

  return documentosPendientes.length === 0 && docs.length > 0;
}

  private calcularCompletitudEntrevistas(): boolean {
    if (!this.expediente) return false;
    const entrevistas = this.expediente.evaluaciones.filter(e => e.tipoEvaluacion === 'entrevista');
    if (entrevistas.length === 0) return false;
    return entrevistas.every(e => e.estado === 'completada');
  }

  private calcularCompletitudEvaluacion(): boolean {
    if (!this.expediente) return false;
    const solicitud = this.expediente.solicitud;
    return !!(solicitud.scoreDocumental && solicitud.scoreGarantes && 
             solicitud.scoreEntrevista && solicitud.scoreFinal);
  }

  private calcularCompletitudDocumentacion(): boolean {
    if (!this.expediente) return false;
    const solicitud = this.expediente.solicitud;
    return !!(solicitud.certificadoGenerado && solicitud.contratoGenerado);
  }

  // ======================================
  // VALIDACIONES DE ACCESO A PESTAÑAS
  // ======================================

  private puedeAccederADocumentos(estado: EstadoSolicitud): boolean {
    const estadosPermitidos: EstadoSolicitud[] = [
      'evaluacion_documental', 'documentos_observados', 'evaluacion_garantes',
      'entrevista_programada', 'en_entrevista', 'entrevista_completada',
      'en_decision', 'aprobado', 'condicional', 'certificado_generado',
      'esperando_inicial', 'inicial_confirmada', 'contrato_firmado', 'entrega_completada'
    ];
    return estadosPermitidos.includes(estado);
  }

  private puedeAccederAEntrevistas(estado: EstadoSolicitud): boolean {
    const estadosPermitidos: EstadoSolicitud[] = [
      'entrevista_programada', 'en_entrevista', 'entrevista_completada',
      'en_decision', 'aprobado', 'condicional', 'certificado_generado',
      'esperando_inicial', 'inicial_confirmada', 'contrato_firmado', 'entrega_completada'
    ];
    return estadosPermitidos.includes(estado);
  }

  private puedeAccederAEvaluacion(estado: EstadoSolicitud): boolean {
    const estadosPermitidos: EstadoSolicitud[] = [
      'evaluacion_documental', 'evaluacion_garantes', 'entrevista_completada',
      'en_decision', 'aprobado', 'rechazado', 'condicional', 'certificado_generado',
      'esperando_inicial', 'inicial_confirmada', 'contrato_firmado', 'entrega_completada'
    ];
    return estadosPermitidos.includes(estado);
  }

  private puedeAccederADecision(estado: EstadoSolicitud): boolean {
    const estadosPermitidos: EstadoSolicitud[] = [
      'en_decision', 'aprobado', 'rechazado', 'condicional', 'certificado_generado',
      'esperando_inicial', 'inicial_confirmada', 'contrato_firmado', 'entrega_completada'
    ];
    return estadosPermitidos.includes(estado);
  }

  private puedeAccederADocumentacion(estado: EstadoSolicitud): boolean {
    const estadosPermitidos: EstadoSolicitud[] = [
      'aprobado', 'condicional', 'certificado_generado', 'esperando_inicial',
      'inicial_confirmada', 'contrato_firmado', 'entrega_completada'
    ];
    return estadosPermitidos.includes(estado);
  }

  private puedeAccederAEntrega(estado: EstadoSolicitud): boolean {
    const estadosPermitidos: EstadoSolicitud[] = [
      'contrato_firmado', 'entrega_completada'
    ];
    return estadosPermitidos.includes(estado);
  }

  // ======================================
  // GESTIÓN DE ALERTAS
  // ======================================

  private actualizarAlertas(): void {
    if (!this.expediente) return;

    this.alertas = [];
    const alertasExpediente = this.expediente.alertas;

    // Alertas críticas de tiempo
    if (alertasExpediente.tiemposExcedidos.length > 0) {
      this.alertas.push({
        tipo: 'error',
        mensaje: `Tiempos excedidos: ${alertasExpediente.tiemposExcedidos.join(', ')}`,
        accion: 'Revisar SLA'
      });
    }

    // Alertas de documentos
    if (alertasExpediente.documentosVencidos.length > 0) {
      this.alertas.push({
        tipo: 'warning',
        mensaje: `Documentos observados: ${alertasExpediente.documentosVencidos.join(', ')}`,
        accion: 'Revisar documentos'
      });
    }

    // Alertas de inconsistencias
    if (alertasExpediente.inconsistenciasDetectadas.length > 0) {
      this.alertas.push({
        tipo: 'warning',
        mensaje: `${alertasExpediente.inconsistenciasDetectadas.length} inconsistencias detectadas`,
        accion: 'Ver detalles'
      });
    }

    // Alerta de atención urgente
    if (alertasExpediente.requiereAtencionUrgente) {
      this.alertas.push({
        tipo: 'error',
        mensaje: 'Este expediente requiere atención URGENTE',
        accion: 'Priorizar'
      });
    }

    // Alertas de tiempo restante
    this.procesarAlertasTiempo();

    // Alertas de aprobación supervisoria
    if (this.expediente.solicitud.requiereAprobacionSupervisor && !this.expediente.solicitud.aprobadoPorSupervisor) {
      this.alertas.push({
        tipo: 'info',
        mensaje: 'Requiere aprobación de supervisor',
        accion: 'Contactar supervisor'
      });
    }

    // Alertas de referencias
    this.procesarAlertasReferencias();
  }

  private procesarAlertasTiempo(): void {
    const tiempoRestante = this.tiempoRestante;
    if (tiempoRestante === null) return;

    if (tiempoRestante <= 0) {
      this.alertas.push({
        tipo: 'error',
        mensaje: 'El tiempo límite para esta etapa ha sido EXCEDIDO'
      });
    } else if (tiempoRestante <= 2) {
      this.alertas.push({
        tipo: 'error',
        mensaje: `URGENTE: Quedan ${this.tiempoRestanteFormateado} para completar esta etapa`
      });
    } else if (tiempoRestante <= 4) {
      this.alertas.push({
        tipo: 'warning',
        mensaje: `Atención: Quedan ${this.tiempoRestanteFormateado} para completar esta etapa`
      });
    }
  }

  private procesarAlertasReferencias(): void {
    if (!this.expediente) return;

    const referenciasVerificadas = this.expediente.referencias.filter(r => r.estadoVerificacion === 'verificado').length;
    const referenciasPendientes = this.expediente.referencias.filter(r => r.estadoVerificacion === 'pendiente').length;

    if (referenciasVerificadas < 2 && referenciasPendientes > 0) {
      this.alertas.push({
        tipo: 'info',
        mensaje: `Faltan verificar ${referenciasPendientes} referencias`,
        accion: 'Contactar referencias'
      });
    }
  }

  private verificarNotificacionesAutomaticas(): void {
    if (!this.expediente) return;

    // Lógica para enviar notificaciones automáticas según el estado
    const estado = this.expediente.solicitud.estado;
    const ultimaNotificacion = this.expediente.solicitud.ultimaNotificacionFecha;
    const ahora = new Date();

    // Si han pasado más de 24 horas sin notificar en ciertos estados
    if (ultimaNotificacion && estado === 'documentos_observados') {
      const horasSinNotificar = (ahora.getTime() - ultimaNotificacion.getTime()) / (1000 * 60 * 60);
      if (horasSinNotificar > 24) {
        this.alertas.push({
          tipo: 'info',
          mensaje: 'Cliente no ha recibido notificaciones en 24 horas',
          accion: 'Enviar recordatorio'
        });
      }
    }
  }

  // ======================================
  // ACCIONES DISPONIBLES
  // ======================================

  private obtenerAccionesDisponibles(): void {
    if (!this.expediente) return;
    
    this.accionesDisponibles = this.expedienteService.obtenerAccionesDisponibles(
      this.expediente.solicitud.estado
    );
  }

  // ======================================
  // NAVEGACIÓN
  // ======================================

  cambiarTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab && tab.disponible) {
      this.tabActiva = tabId;
      this.guardarTabActiva(tabId);
    }
  }

  private guardarTabActiva(tabId: string): void {
    // Guardar en localStorage para recordar la pestaña activa
    if (this.expediente) {
      localStorage.setItem(`expediente_tab_${this.expediente.solicitud.id}`, tabId);
    }
  }

  private recuperarTabActiva(): void {
    if (this.expediente) {
      const tabGuardada = localStorage.getItem(`expediente_tab_${this.expediente.solicitud.id}`);
      if (tabGuardada && this.tabs.some(t => t.id === tabGuardada && t.disponible)) {
        this.tabActiva = tabGuardada;
      }
    }
  }

  regresarAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // ======================================
  // EJECUCIÓN DE ACCIONES
  // ======================================

  async ejecutarAccion(accion: string): Promise<void> {
    if (!this.expediente) return;

    this.cargando = true;
    
    try {
      switch (accion) {
        case 'Asignar Asesor':
          await this.asignarAsesor();
          break;
        case 'Iniciar Evaluación Documental':
          await this.cambiarEstado('evaluacion_documental', 'Iniciando evaluación documental');
          break;
        case 'Aprobar Documentos':
          await this.aprobarDocumentos();
          break;
        case 'Observar Documentos':
          await this.observarDocumentos();
          break;
        case 'Evaluar Garantes':
          await this.cambiarEstado('evaluacion_garantes', 'Iniciando evaluación de garantes');
          break;
        case 'Aprobar Garante':
          await this.aprobarGarante();
          break;
        case 'Rechazar Garante':
          await this.rechazarGarante();
          break;
        case 'Programar Entrevista':
          await this.programarEntrevista();
          break;
        case 'Realizar Entrevista':
          await this.cambiarEstado('en_entrevista', 'Iniciando proceso de entrevista');
          break;
        case 'Completar Entrevista':
          await this.completarEntrevista();
          break;
        case 'Enviar a Decisión':
          await this.enviarADecision();
          break;
        case 'Aprobar':
          await this.aprobarSolicitud();
          break;
        case 'Rechazar':
          await this.rechazarSolicitud();
          break;
        case 'Aprobar Condicional':
          await this.aprobarCondicional();
          break;
        case 'Aprobar Definitivamente':
          await this.cambiarEstado('aprobado', 'Aprobación definitiva confirmada');
          break;
        case 'Generar Certificado':
          await this.generarCertificado();
          break;
        case 'Notificar Cliente':
          await this.notificarCliente();
          break;
        case 'Confirmar Pago':
          await this.confirmarPago();
          break;
        case 'Generar Contrato':
          await this.generarContrato();
          break;
        case 'Programar Entrega':
          await this.programarEntrega();
          break;
        case 'Revisar Correcciones':
          await this.revisarCorrecciones();
          break;
        case 'Cambiar Garante':
          await this.cambiarGarante();
          break;
        case 'Reactivar':
          await this.reactivarSolicitud();
          break;
        case 'Cancelar':
          await this.cancelarSolicitud();
          break;
        case 'Suspender':
          await this.suspenderSolicitud();
          break;
        default:
          this.mostrarError(`Acción no implementada: ${accion}`);
      }
    } catch (error) {
      console.error('Error al ejecutar acción:', error);
      this.mostrarError(`Error al ejecutar la acción: ${accion}`);
    } finally {
      this.cargando = false;
    }
  }

  // ======================================
  // MÉTODOS DE ACCIONES ESPECÍFICAS
  // ======================================

  private async cambiarEstado(nuevoEstado: EstadoSolicitud, observaciones?: string): Promise<void> {
    if (!this.expediente) return;

    await this.expedienteService.actualizarEstado(
      this.expediente.solicitud.id,
      nuevoEstado,
      observaciones
    );

    this.mostrarExito(`Estado actualizado a: ${ESTADOS_CONFIG[nuevoEstado].label}`);
  }

  private async asignarAsesor(): Promise<void> {
    // TODO: Implementar diálogo de selección de asesor
    const asesorSeleccionado = await this.abrirDialogoSeleccionAsesor();
    if (asesorSeleccionado) {
      await this.cambiarEstado('en_revision_inicial', `Asesor ${asesorSeleccionado.nombre} asignado`);
      // TODO: Actualizar asesorAsignadoId en la base de datos
    }
  }

  private async aprobarDocumentos(): Promise<void> {
    if (!this.validarDocumentosCompletos()) {
      this.mostrarError('No se pueden aprobar documentos incompletos');
      return;
    }
    
    await this.cambiarEstado('evaluacion_garantes', 'Documentos aprobados correctamente');
    this.mostrarInfo('Procediendo con evaluación de garantes');
  }

  private async observarDocumentos(): Promise<void> {
    const observaciones = await this.abrirDialogoObservaciones('documentos');
    if (observaciones) {
      await this.cambiarEstado('documentos_observados', observaciones);
      // TODO: Enviar notificación al cliente sobre las observaciones
    }
  }

  private async aprobarGarante(): Promise<void> {
    if (!this.validarGaranteCompleto()) {
      this.mostrarError('La evaluación del garante no está completa');
      return;
    }
    
    await this.cambiarEstado('entrevista_programada', 'Garante aprobado, procediendo con entrevistas');
  }

  private async rechazarGarante(): Promise<void> {
    const motivo = await this.abrirDialogoMotivoRechazo('garante');
    if (motivo) {
      await this.cambiarEstado('garante_rechazado', `Garante rechazado: ${motivo}`);
    }
  }

  private async programarEntrevista(): Promise<void> {
    const datosEntrevista = await this.abrirDialogoProgramacionEntrevista();
    if (datosEntrevista) {
      await this.cambiarEstado('entrevista_programada', 
        `Entrevista programada para ${datosEntrevista.fecha} con ${datosEntrevista.entrevistador}`);
      // TODO: Crear registro de entrevista en la base de datos
      // TODO: Enviar notificaciones a las partes involucradas
    }
  }

  private async completarEntrevista(): Promise<void> {
    if (!this.validarEntrevistasCompletadas()) {
      this.mostrarError('No se han completado todas las entrevistas requeridas');
      return;
    }
    
    await this.cambiarEstado('entrevista_completada', 'Todas las entrevistas han sido completadas');
    this.mostrarInfo('Expediente listo para evaluación integral');
  }

  private async enviarADecision(): Promise<void> {
    if (!this.validarExpedienteParaDecision()) {
      this.mostrarError('El expediente no está completo para enviar a decisión');
      return;
    }
    
    await this.cambiarEstado('en_decision', 'Expediente enviado al comité de decisión');
    this.mostrarInfo('El expediente será revisado por el comité de créditos');
  }

  private async aprobarSolicitud(): Promise<void> {
    const datosAprobacion = await this.abrirDialogoAprobacion();
    if (datosAprobacion) {
      // TODO: Actualizar campos de aprobación en la solicitud
      await this.cambiarEstado('aprobado', 
        `Solicitud aprobada - Monto: ${datosAprobacion.montoAprobado}, Tasa: ${datosAprobacion.tasa}%`);
      this.mostrarExito('¡Solicitud aprobada exitosamente!');
    }
  }

  private async rechazarSolicitud(): Promise<void> {
    const motivoRechazo = await this.abrirDialogoMotivoRechazo('solicitud');
    if (motivoRechazo) {
      await this.cambiarEstado('rechazado', `Solicitud rechazada: ${motivoRechazo}`);
      // TODO: Enviar notificación de rechazo al cliente
      this.mostrarInfo('Se ha notificado el rechazo al cliente');
    }
  }

  private async aprobarCondicional(): Promise<void> {
    const condiciones = await this.abrirDialogoCondicionesAprobacion();
    if (condiciones) {
      await this.cambiarEstado('condicional', 
        `Aprobación condicional: ${condiciones.join(', ')}`);
      // TODO: Actualizar condicionesEspeciales en la solicitud
    }
  }

  private async generarCertificado(): Promise<void> {
    try {
      // TODO: Implementar generación de certificado
      const urlCertificado = await this.generarDocumentoLegal('certificado');
      await this.cambiarEstado('certificado_generado', 'Certificado OTOYA generado exitosamente');
      this.mostrarExito('Certificado disponible para descarga');
    } catch (error) {
      this.mostrarError('Error al generar certificado');
    }
  }

  private async notificarCliente(): Promise<void> {
    try {
      // TODO: Implementar envío de notificación
      await this.enviarNotificacionCliente('certificado_disponible');
      await this.cambiarEstado('esperando_inicial', 'Cliente notificado, esperando pago inicial');
      this.mostrarExito('Cliente notificado exitosamente');
    } catch (error) {
      this.mostrarError('Error al notificar al cliente');
    }
  }

  private async confirmarPago(): Promise<void> {
    const datosPago = await this.abrirDialogoValidacionPago();
    if (datosPago) {
      await this.cambiarEstado('inicial_confirmada', 
        `Pago inicial confirmado - Comprobante: ${datosPago.numeroComprobante}`);
      this.mostrarExito('Pago inicial confirmado');
    }
  }

  private async generarContrato(): Promise<void> {
    try {
      // TODO: Implementar generación de contrato
      const urlContrato = await this.generarDocumentoLegal('contrato');
      await this.cambiarEstado('contrato_firmado', 'Contrato generado y firmado');
      this.mostrarExito('Contrato disponible');
    } catch (error) {
      this.mostrarError('Error al generar contrato');
    }
  }

  private async programarEntrega(): Promise<void> {
    const datosEntrega = await this.abrirDialogoProgramacionEntrega();
    if (datosEntrega) {
      await this.cambiarEstado('entrega_completada', 
        `Entrega programada para ${datosEntrega.fecha} en ${datosEntrega.lugar}`);
      // TODO: Actualizar campos de entrega en la solicitud
      this.mostrarExito('Entrega programada exitosamente');
    }
  }

  private async revisarCorrecciones(): Promise<void> {
    // Volver al estado de evaluación documental para revisar correcciones
    await this.cambiarEstado('evaluacion_documental', 'Revisando correcciones de documentos');
  }

  private async cambiarGarante(): Promise<void> {
    // TODO: Implementar proceso de cambio de garante
    this.mostrarInfo('Proceso de cambio de garante iniciado');
    await this.cambiarEstado('evaluacion_garantes', 'Iniciando proceso de cambio de garante');
  }

  private async reactivarSolicitud(): Promise<void> {
    const motivoReactivacion = await this.abrirDialogoReactivacion();
    if (motivoReactivacion) {
      await this.cambiarEstado('en_revision_inicial', `Solicitud reactivada: ${motivoReactivacion}`);
      this.mostrarExito('Solicitud reactivada exitosamente');
    }
  }

  private async cancelarSolicitud(): Promise<void> {
    const confirmacion = await this.abrirDialogoConfirmacion(
      'Cancelar Solicitud',
      '¿Está seguro que desea cancelar esta solicitud? Esta acción no se puede deshacer.'
    );
    
    if (confirmacion) {
      const motivo = await this.abrirDialogoMotivoCancelacion();
      if (motivo) {
        await this.cambiarEstado('cancelado', `Solicitud cancelada: ${motivo}`);
        this.mostrarInfo('Solicitud cancelada');
      }
    }
  }

  private async suspenderSolicitud(): Promise<void> {
    const motivoSuspension = await this.abrirDialogoSuspension();
    if (motivoSuspension) {
      await this.cambiarEstado('suspendido', `Solicitud suspendida: ${motivoSuspension}`);
      this.mostrarInfo('Solicitud suspendida temporalmente');
    }
  }

  // ======================================
  // MÉTODOS DE VALIDACIÓN
  // ======================================

  private validarDocumentosCompletos(): boolean {
    if (!this.expediente) return false;
    
    // Validar documentos del titular
    const titular = this.expediente.titular;
    if (titular.estadoValidacionDocumentos !== 'aprobado') {
      return false;
    }
    
    // Validar documentos del fiador si existe
    if (this.expediente.fiador && this.expediente.fiador.estadoValidacionDocumentos !== 'aprobado') {
      return false;
    }
    
    return true;
  }

  private validarGaranteCompleto(): boolean {
    if (!this.expediente?.fiador) return false;
    
    const fiador = this.expediente.fiador;
    return !!(fiador.datosVerificados && 
             fiador.consultaCentralesRealizada && 
             fiador.aceptaResponsabilidad);
  }

  private validarEntrevistasCompletadas(): boolean {
    if (!this.expediente) return false;
    
    const entrevistasRequeridas = ['personal_titular', 'personal_fiador'];
    if (this.expediente.fiador) {
      entrevistasRequeridas.push('personal_fiador');
    }
    
    // Validar que se hayan verificado al menos 2 referencias
    const referenciasVerificadas = this.expediente.referencias.filter(
      r => r.estadoVerificacion === 'verificado'
    ).length;
    
    return referenciasVerificadas >= 2;
  }

  private validarExpedienteParaDecision(): boolean {
    if (!this.expediente) return false;
    
    const solicitud = this.expediente.solicitud;
    
    // Validar que se tengan todos los scores necesarios
    return !!(solicitud.scoreDocumental && 
             solicitud.scoreGarantes && 
             solicitud.scoreEntrevista &&
             this.validarDocumentosCompletos() &&
             this.validarEntrevistasCompletadas());
  }

  // ======================================
  // DIÁLOGOS Y MODALES
  // ======================================

  private async abrirDialogoSeleccionAsesor(): Promise<any> {
    // TODO: Implementar diálogo de selección de asesor
    return new Promise((resolve) => {
      // Simulación - reemplazar con diálogo real
      resolve({ id: 'asesor1', nombre: 'Juan Pérez' });
    });
  }

  private async abrirDialogoObservaciones(tipo: string): Promise<string | null> {
    // TODO: Implementar diálogo de observaciones
    return new Promise((resolve) => {
      // Simulación - reemplazar con diálogo real
      const observaciones = prompt(`Ingrese las observaciones para ${tipo}:`);
      resolve(observaciones);
    });
  }

  private async abrirDialogoMotivoRechazo(tipo: string): Promise<string | null> {
    // TODO: Implementar diálogo de motivo de rechazo
    return new Promise((resolve) => {
      const motivo = prompt(`Ingrese el motivo de rechazo del ${tipo}:`);
      resolve(motivo);
    });
  }

  private async abrirDialogoProgramacionEntrevista(): Promise<any> {
    // TODO: Implementar diálogo de programación de entrevista
    return new Promise((resolve) => {
      resolve({
        fecha: new Date(),
        entrevistador: 'María García',
        tipo: 'presencial'
      });
    });
  }

  private async abrirDialogoAprobacion(): Promise<any> {
    // TODO: Implementar diálogo de aprobación
    return new Promise((resolve) => {
      resolve({
        montoAprobado: this.expediente?.solicitud.precioCompraMoto || 0,
        tasa: 18.5,
        plazo: 24
      });
    });
  }

  private async abrirDialogoCondicionesAprobacion(): Promise<string[]> {
    // TODO: Implementar diálogo de condiciones
    return new Promise((resolve) => {
      resolve(['Aumentar inicial al 25%', 'Incluir aval adicional']);
    });
  }

  private async abrirDialogoValidacionPago(): Promise<any> {
    // TODO: Implementar diálogo de validación de pago
    return new Promise((resolve) => {
      resolve({
        numeroComprobante: 'PAG001234',
        monto: this.expediente?.solicitud.inicial || 0,
        fecha: new Date()
      });
    });
  }

  private async abrirDialogoProgramacionEntrega(): Promise<any> {
    // TODO: Implementar diálogo de programación de entrega
    return new Promise((resolve) => {
      resolve({
        fecha: new Date(),
        lugar: 'Tienda Principal',
        responsable: 'Carlos López'
      });
    });
  }

  private async abrirDialogoConfirmacion(titulo: string, mensaje: string): Promise<boolean> {
    // TODO: Implementar diálogo de confirmación
    return new Promise((resolve) => {
      const confirmacion = confirm(`${titulo}\n\n${mensaje}`);
      resolve(confirmacion);
    });
  }

  private async abrirDialogoReactivacion(): Promise<string | null> {
    // TODO: Implementar diálogo de reactivación
    return new Promise((resolve) => {
      const motivo = prompt('Ingrese el motivo de la reactivación:');
      resolve(motivo);
    });
  }

  private async abrirDialogoMotivoCancelacion(): Promise<string | null> {
    // TODO: Implementar diálogo de motivo de cancelación
    return new Promise((resolve) => {
      const motivo = prompt('Ingrese el motivo de la cancelación:');
      resolve(motivo);
    });
  }

  private async abrirDialogoSuspension(): Promise<string | null> {
    // TODO: Implementar diálogo de suspensión
    return new Promise((resolve) => {
      const motivo = prompt('Ingrese el motivo de la suspensión:');
      resolve(motivo);
    });
  }

  // ======================================
  // MÉTODOS DE INTEGRACIÓN
  // ======================================

  private async generarDocumentoLegal(tipo: 'certificado' | 'contrato'): Promise<string> {
    // TODO: Integrar con DocumentosLegalesService
    return new Promise((resolve) => {
      // Simulación - reemplazar con servicio real
      const url = `https://documentos.otoya.com/${tipo}/${this.expediente?.solicitud.id}`;
      resolve(url);
    });
  }

  private async enviarNotificacionCliente(tipo: string): Promise<void> {
    // TODO: Integrar con NotificacionesService
    if (!this.expediente) return;
    
    // Simulación - reemplazar con servicio real
    console.log(`Enviando notificación ${tipo} a ${this.expediente.titular.email}`);
  }

  // ======================================
  // MÉTODOS DE UTILIDAD Y UI
  // ======================================

  obtenerColorEstado(estado: EstadoSolicitud): string {
    return ESTADOS_CONFIG[estado]?.color || 'grey';
  }

  obtenerIconoEstado(estado: EstadoSolicitud): string {
    return ESTADOS_CONFIG[estado]?.icon || 'help';
  }

  obtenerColorProgreso(): string {
    if (!this.expediente) return 'primary';
    
    const porcentaje = this.expediente.solicitud.porcentajeProgreso;
    if (porcentaje >= 80) return 'primary';
    if (porcentaje >= 50) return 'accent';
    return 'warn';
  }

  obtenerColorTiempo(): string {
    const tiempo = this.tiempoRestante;
    if (tiempo === null) return 'primary';
    if (tiempo <= 0) return 'warn';
    if (tiempo <= 4) return 'accent';
    return 'primary';
  }

  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'No disponible';
    
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(monto);
  }

  togglePanelObservaciones(): void {
    this.mostrarPanelObservaciones = !this.mostrarPanelObservaciones;
  }

  // ======================================
  // MÉTODOS DE NOTIFICACIÓN
  // ======================================

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private mostrarAdvertencia(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  // ======================================
  // MÉTODOS DE LIMPIEZA Y MANTENIMIENTO
  // ======================================

  private limpiarRecursosComponente(): void {
    // Limpiar localStorage si es necesario
    if (this.expediente) {
      // Mantener solo datos esenciales en localStorage
      const datosEsenciales = {
        ultimaTab: this.tabActiva,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(
        `expediente_session_${this.expediente.solicitud.id}`, 
        JSON.stringify(datosEsenciales)
      );
    }
  }

  // ======================================
  // MÉTODOS DE AYUDA Y SOPORTE
  // ======================================

  abrirAyuda(): void {
    // TODO: Implementar sistema de ayuda contextual
    this.mostrarInfo('Sistema de ayuda próximamente disponible');
  }

  exportarExpediente(): void {
    // TODO: Implementar exportación de expediente
    this.mostrarInfo('Funcionalidad de exportación en desarrollo');
  }

  imprimirExpediente(): void {
    // TODO: Implementar impresión de expediente
    window.print();
  }

  compartirExpediente(): void {
    // TODO: Implementar compartir expediente
    this.mostrarInfo('Funcionalidad de compartir en desarrollo');
  }

  // ======================================
  // CLEANUP FINAL
  // ======================================
public recargarExpediente(): void { }

 
}

