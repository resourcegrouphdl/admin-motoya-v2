import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  Subject,
  takeUntil,
  map,
  combineLatest,
  startWith,
  interval,
  switchMap,
  timeout,
  tap,
} from 'rxjs';

import { EvaluacionCreditosService } from '../services/evaluacion-creditos.service';
import {
  SolicitudCredito,
  EstadoSolicitud,
  SolicitudCreditoCompleta,
} from '../modelos/modelos-solicitudes';
import { ReasignacionDialogComponent } from '../reasignacion-dialog/reasignacion-dialog.component';

interface SolicitudColaTrabajoVM {
  id: string;
  numeroSolicitud: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  cliente: {
    nombre: string;
    apellidos: string;
    dni: string;
    avatar: string;
  };
  vehiculo: string;
  monto: number;
  estado: string;
  estadoColor: 'success' | 'warning' | 'error' | 'info';
  asignadoA: string;
  tiempo: string;
  tiempoColor: 'success' | 'warning' | 'error';
  fechaCreacion: Date;
  estaVencido: boolean;
  requiereAccion: boolean;
  solicitudOriginal: SolicitudCredito;
}

type FiltroEtapa = '' | 'documental' | 'garantes' | 'entrevista' | 'decision';
type FiltroPrioridad = '' | 'Alta' | 'Media' | 'Baja';

@Component({
  selector: 'app-tabla-general',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './tabla-general.component.html',
  styleUrl: './tabla-general.component.css',
})
export class TablaGeneralComponent implements OnInit, OnDestroy {
  private readonly evaluacionService = inject(EvaluacionCreditosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Signals para el estado del componente
  private readonly solicitudes = signal<SolicitudCredito[]>([]);
  readonly cargando = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly filtroEtapa = signal<FiltroEtapa>('');
  readonly filtroPrioridad = signal<FiltroPrioridad>('');
  readonly procesandoAccion = signal<string | null>(null);
  readonly ultimaActualizacion = signal<Date>(new Date());

  // Columnas de la tabla
  readonly displayedColumns = [
    'prioridad',
    'solicitud',
    'cliente',
    'vehiculo',
    'monto',
    'estado',
    'asignadoA',
    'tiempo',
    'progreso',
    'acciones',
  ];

  // Estados que requieren evaluación
  private readonly estadosEvaluacion: EstadoSolicitud[] = [
    'pendiente', // Recién creada
    'en_revision_inicial', // Asignada a asesor
    'evaluacion_documental', // Validando documentos
    'documentos_observados', // Documentos con observaciones
    'evaluacion_garantes', // Evaluando fiador/garantes
    'garante_rechazado', // Fiador no cumple requisitos
    'entrevista_programada', // Entrevista agendada
    'en_entrevista', // Entrevista en curso
    'entrevista_completada', // Entrevista finalizada
    'en_decision', // Comité evaluando
    'aprobado', // Crédito aprobado
    'rechazado', // Crédito rechazado
    'condicional', // Aprobado con condiciones
    'certificado_generado', // Certificado listo
    'esperando_inicial', // Esperando pago inicial
    'inicial_confirmada', // Inicial pagada
    'contrato_firmado', // Contrato firmado
    'entrega_completada', // Proceso terminado
    'suspendido', // Proceso suspendido
    'cancelado', // Cancelado por cliente
  ];

  // Computed para solicitudes filtradas
  readonly solicitudesFiltradas = computed(() => {
    const solicitudes = this.solicitudes();
    const etapa = this.filtroEtapa();
    const prioridad = this.filtroPrioridad();

    return solicitudes
      .map((s) => this.mapearSolicitudAViewModel(s))
      .filter((s) => {
        // Filtro por etapa
        if (etapa) {
          const estadosEtapa = this.getEstadosPorEtapa(etapa);
          if (!estadosEtapa.includes(s.solicitudOriginal.estado)) {
            return false;
          }
        }

        // Filtro por prioridad
        if (prioridad && s.prioridad !== prioridad) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Ordenar por prioridad y tiempo
        const prioridadOrden = { Alta: 3, Media: 2, Baja: 1 };
        if (prioridadOrden[a.prioridad] !== prioridadOrden[b.prioridad]) {
          return prioridadOrden[b.prioridad] - prioridadOrden[a.prioridad];
        }

        // Si están vencidas, van primero
        if (a.estaVencido !== b.estaVencido) {
          return a.estaVencido ? -1 : 1;
        }

        // Por fecha de creación (más antiguas primero)
        return a.fechaCreacion.getTime() - b.fechaCreacion.getTime();
      });
  });

  // Computed para métricas
  readonly solicitudesVencidas = computed(
    () => this.solicitudesFiltradas().filter((s) => s.estaVencido).length
  );

  readonly solicitudesUrgentes = computed(
    () => this.solicitudesFiltradas().filter((s) => s.requiereAccion).length
  );

  readonly totalSolicitudes = computed(
    () => this.solicitudesFiltradas().length
  );

  // Computed para estadísticas adicionales
  readonly porcentajeVencidas = computed(() => {
    const total = this.totalSolicitudes();
    return total > 0
      ? Math.round((this.solicitudesVencidas() / total) * 100)
      : 0;
  });

  readonly distribucionPorEstado = computed(() => {
    const solicitudes = this.solicitudesFiltradas();
    const distribucion: { [estado: string]: number } = {};

    solicitudes.forEach((s) => {
      distribucion[s.estado] = (distribucion[s.estado] || 0) + 1;
    });

    return distribucion;
  });

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.configurarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarSolicitudes(): void {
    console.log('🚀 [cargarSolicitudes] Iniciando proceso de carga...');
    console.log(
      '📊 [cargarSolicitudes] Estados solicitados:',
      this.estadosEvaluacion
    );
    console.log(
      '📈 [cargarSolicitudes] Cantidad de estados:',
      this.estadosEvaluacion.length
    );

    // Verificar estados antes de la consulta
    if (!this.estadosEvaluacion || this.estadosEvaluacion.length === 0) {
      console.warn(
        '⚠️ [cargarSolicitudes] No se han definido estados para buscar'
      );
      this.error.set('No se han definido estados para buscar');
      this.cargando.set(false);
      return;
    }

    // Inicializar estados de carga
    this.cargando.set(true);
    this.error.set(null);

    console.log('⏳ [cargarSolicitudes] Estado de carga activado');
    console.log('🔄 [cargarSolicitudes] Llamando al service...');

    // Timestamp inicio
    const tiempoInicio = performance.now();

    this.evaluacionService
      .getSolicitudesPorEstado(this.estadosEvaluacion)
      .pipe(
        takeUntil(this.destroy$),
        // Agregar timeout de 30 segundos
        timeout(30000),
        // Log del proceso
        tap({
          subscribe: () =>
            console.log('📡 [cargarSolicitudes] Suscripción iniciada'),
          unsubscribe: () =>
            console.log('🔌 [cargarSolicitudes] Suscripción terminada'),
        })
      )
      .subscribe({
        next: (solicitudes) => {
          const tiempoTranscurrido = Math.round(
            performance.now() - tiempoInicio
          );

          console.log('✅ [cargarSolicitudes] Respuesta recibida del service');
          console.log(
            '⏱️ [cargarSolicitudes] Tiempo transcurrido:',
            tiempoTranscurrido,
            'ms'
          );
          console.log(
            '📊 [cargarSolicitudes] Solicitudes recibidas:',
            solicitudes?.length || 0
          );

          // Validar respuesta
          if (!solicitudes) {
            console.warn('⚠️ [cargarSolicitudes] Respuesta nula del service');
            this.error.set('No se recibieron datos del servidor');
            this.cargando.set(false);
            this.mostrarAdvertencia('No se recibieron datos del servidor');
            return;
          }

          if (!Array.isArray(solicitudes)) {
            console.error(
              '❌ [cargarSolicitudes] Respuesta no es un array:',
              typeof solicitudes
            );
            this.error.set('Formato de datos incorrecto');
            this.cargando.set(false);
            this.mostrarError('Formato de datos incorrecto');
            return;
          }

          // Analizar datos recibidos
          console.log('🔍 [cargarSolicitudes] Analizando datos recibidos...');

          if (solicitudes.length === 0) {
            console.log('📭 [cargarSolicitudes] No se encontraron solicitudes');
            this.solicitudes.set([]);
            this.cargando.set(false);
            this.ultimaActualizacion.set(new Date());
            this.mostrarInfo(
              'No se encontraron solicitudes con los criterios especificados'
            );
            return;
          }

          // Análisis detallado de las solicitudes
          const analisis = this.analizarSolicitudes(solicitudes);
          console.log(
            '📈 [cargarSolicitudes] Análisis de solicitudes:',
            analisis
          );

          // Verificar integridad de datos
          const solicitudesValidas = solicitudes.filter((s) =>
            this.validarSolicitud(s)
          );

          if (solicitudesValidas.length !== solicitudes.length) {
            const invalidas = solicitudes.length - solicitudesValidas.length;
            console.warn(
              `⚠️ [cargarSolicitudes] ${invalidas} solicitudes con datos inválidos fueron filtradas`
            );
          }

          // Actualizar estado del componente
          console.log(
            '💾 [cargarSolicitudes] Actualizando estado del componente...'
          );
          this.solicitudes.set(solicitudesValidas);
          this.cargando.set(false);
          this.ultimaActualizacion.set(new Date());

          console.log('🎉 [cargarSolicitudes] Carga completada exitosamente');
          console.log(
            '📊 [cargarSolicitudes] Total final:',
            solicitudesValidas.length
          );

          // Mostrar mensaje de éxito
          if (solicitudesValidas.length > 0) {
            this.mostrarExito(
              `Se cargaron ${solicitudesValidas.length} solicitudes correctamente`
            );
          }

          // Log del estado actual del componente
          console.log('🏁 [cargarSolicitudes] Estado final del componente:');
          console.log('  - Cargando:', this.cargando());
          console.log('  - Error:', this.error());
          console.log('  - Solicitudes en memoria:', this.solicitudes().length);
          console.log('  - Última actualización:', this.ultimaActualizacion());
        },

        error: (error) => {
          const tiempoTranscurrido = Math.round(
            performance.now() - tiempoInicio
          );

          console.error('❌ [cargarSolicitudes] Error en la carga');
          console.error(
            '⏱️ [cargarSolicitudes] Tiempo hasta error:',
            tiempoTranscurrido,
            'ms'
          );
          console.error(
            '🔍 [cargarSolicitudes] Tipo de error:',
            error?.constructor?.name || 'Desconocido'
          );
          console.error(
            '📝 [cargarSolicitudes] Mensaje:',
            error?.message || 'Sin mensaje'
          );
          console.error(
            '🏷️ [cargarSolicitudes] Código:',
            error?.code || 'Sin código'
          );
          console.error('📄 [cargarSolicitudes] Error completo:', error);

          // Determinar tipo de error y mensaje apropiado
          let mensajeError = 'Error al cargar las solicitudes';

          if (error?.name === 'TimeoutError') {
            mensajeError =
              'La consulta tardó demasiado tiempo. Verifique su conexión.';
            console.error('⏱️ [cargarSolicitudes] Timeout detectado');
          } else if (error?.code === 'permission-denied') {
            mensajeError = 'No tiene permisos para acceder a esta información';
            console.error('🔒 [cargarSolicitudes] Permisos insuficientes');
          } else if (error?.code === 'unavailable') {
            mensajeError = 'Servicio no disponible. Intente nuevamente.';
            console.error('🚫 [cargarSolicitudes] Servicio no disponible');
          } else if (error?.message?.includes('index')) {
            mensajeError = 'Error de configuración de base de datos';
            console.error('📑 [cargarSolicitudes] Error de índice detectado');
          }

          // Actualizar estado del componente
          this.error.set(mensajeError);
          this.cargando.set(false);

          // Mostrar mensaje al usuario
          this.mostrarError(mensajeError);

          console.log('🏁 [cargarSolicitudes] Estado final con error:');
          console.log('  - Cargando:', this.cargando());
          console.log('  - Error:', this.error());
          console.log('  - Solicitudes en memoria:', this.solicitudes().length);
        },

        complete: () => {
          console.log('🏁 [cargarSolicitudes] Observable completado');
        },
      });
  }

  /**
   * Analiza las solicitudes recibidas y retorna estadísticas
   */
  private analizarSolicitudes(solicitudes: SolicitudCredito[]): any {
    const analisis = {
      total: solicitudes.length,
      porEstado: {} as Record<string, number>,
      porPrioridad: {} as Record<string, number>,
      vencidas: 0,
      urgentes: 0,
      fechaMasAntigua: null as Date | null,
      fechaMasReciente: null as Date | null,
    };

    solicitudes.forEach((solicitud) => {
      // Contar por estado
      analisis.porEstado[solicitud.estado] =
        (analisis.porEstado[solicitud.estado] || 0) + 1;

      // Contar por prioridad
      analisis.porPrioridad[solicitud.prioridad] =
        (analisis.porPrioridad[solicitud.prioridad] || 0) + 1;

      // Contar vencidas y urgentes
      if (solicitud.estaVencido) analisis.vencidas++;
      if (solicitud.requiereAccion) analisis.urgentes++;

      // Fechas extremas
      if (
        !analisis.fechaMasAntigua ||
        solicitud.fechaCreacion < analisis.fechaMasAntigua
      ) {
        analisis.fechaMasAntigua = solicitud.fechaCreacion;
      }

      if (
        !analisis.fechaMasReciente ||
        solicitud.fechaCreacion > analisis.fechaMasReciente
      ) {
        analisis.fechaMasReciente = solicitud.fechaCreacion;
      }
    });

    return analisis;
  }

  /**
   * Valida que una solicitud tenga los campos mínimos requeridos
   */
  private validarSolicitud(solicitud: any): boolean {
    if (!solicitud) {
      console.warn('⚠️ [validarSolicitud] Solicitud nula');
      return false;
    }

    const camposRequeridos = [
      'id',
      'numeroSolicitud',
      'estado',
      'fechaCreacion',
    ];

    for (const campo of camposRequeridos) {
      if (!solicitud[campo]) {
        console.warn(
          `⚠️ [validarSolicitud] Campo requerido faltante: ${campo} en solicitud ${
            solicitud.id || 'sin ID'
          }`
        );
        return false;
      }
    }

    // Validar tipos
    if (typeof solicitud.id !== 'string') {
      console.warn(`⚠️ [validarSolicitud] ID no es string: ${solicitud.id}`);
      return false;
    }

    if (!(solicitud.fechaCreacion instanceof Date)) {
      console.warn(
        `⚠️ [validarSolicitud] fechaCreacion no es Date: ${solicitud.fechaCreacion}`
      );
      return false;
    }

    return true;
  }

  /**
   * Método para reintentar la carga manualmente
   */
  reintentar(): void {
    console.log(
      '🔄 [reintentar] Reintentando carga por solicitud del usuario...'
    );
    this.cargarSolicitudes();
  }

  /**
   * Método para limpiar cache y recargar
   */
  recargarCompleto(): void {
    console.log('🗑️ [recargarCompleto] Limpiando cache y recargando...');
    this.evaluacionService.limpiarCache();
    this.solicitudes.set([]);
    this.cargarSolicitudes();
  }

  private configurarActualizacionAutomatica(): void {
    // Actualizar cada 30 segundos
    interval(30000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.evaluacionService.getSolicitudesPorEstado(this.estadosEvaluacion)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (solicitudes) => {
          if (!this.cargando()) {
            this.solicitudes.set(solicitudes);
            this.ultimaActualizacion.set(new Date());
          }
        },
        error: (error) => {
          console.error('Error en actualización automática:', error);
        },
      });
  }

  private mapearSolicitudAViewModel(
    solicitud: SolicitudCredito
  ): SolicitudColaTrabajoVM {
    return {
      id: solicitud.id,
      numeroSolicitud: solicitud.numeroSolicitud,
      prioridad: solicitud.prioridad,
      cliente: {
        nombre: this.extraerNombreCliente(solicitud),
        apellidos: this.extraerApellidosCliente(solicitud),
        dni: this.extraerDniCliente(solicitud),
        avatar: this.generarAvatar(this.extraerNombreCliente(solicitud)),
      },
      vehiculo: this.formatearVehiculo(solicitud),
      monto: solicitud.precioCompraMoto,
      estado: this.formatearEstado(solicitud.estado),
      estadoColor: this.getColorEstado(solicitud.estado),
      asignadoA: this.extraerNombreEvaluador(solicitud),
      tiempo: this.formatearTiempo(solicitud.diasEnEstado),
      tiempoColor: this.getColorTiempo(
        solicitud.diasEnEstado,
        solicitud.estaVencido
      ),
      fechaCreacion: solicitud.fechaCreacion,
      estaVencido: solicitud.estaVencido,
      requiereAccion: solicitud.requiereAccion,
      solicitudOriginal: solicitud,
    };
  }

  private extraerNombreCliente(solicitud: SolicitudCredito): string {
    // TODO: Integrar con datos reales del cliente cuando estén disponibles
    return `Cliente ${solicitud.titularId.slice(-4)}`;
  }

  private extraerApellidosCliente(solicitud: SolicitudCredito): string {
    return `Apellidos ${solicitud.titularId.slice(-4)}`;
  }

  private extraerDniCliente(solicitud: SolicitudCredito): string {
    return `123456${solicitud.titularId.slice(-2)}`;
  }

  private extraerNombreEvaluador(solicitud: SolicitudCredito): string {
    if (!solicitud.evaluadorActualId) return 'Sin asignar';
    // TODO: Obtener nombre real del evaluador desde el service
    return `Evaluador ${solicitud.evaluadorActualId.slice(-4)}`;
  }

  private formatearVehiculo(solicitud: SolicitudCredito): string {
    // TODO: Integrar con datos reales del vehículo
    return `Vehículo ${solicitud.vehiculoId.slice(-4)}`;
  }

  private generarAvatar(nombre: string): string {
    return nombre.substring(0, 2).toUpperCase();
  }

  private formatearEstado(estado: EstadoSolicitud): string {
    const estadosFormateados: { [key in EstadoSolicitud]: string } = {
      pendiente: 'Pendiente',
      en_revision_inicial: 'Revisión Inicial',
      evaluacion_documental: 'Eval. Documental',
      documentos_observados: 'Docs. Observados',
      evaluacion_garantes: 'Eval. Garantes',
      garante_rechazado: 'Garante Rechazado',
      entrevista_programada: 'Entrevista Programada',
      en_entrevista: 'En Entrevista',
      entrevista_completada: 'Entrevista Completada',
      en_decision: 'En Decisión',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado',
      condicional: 'Condicional',
      certificado_generado: 'Certificado Generado',
      esperando_inicial: 'Esperando Inicial',
      inicial_confirmada: 'Inicial Confirmada',
      contrato_firmado: 'Contrato Firmado',
      entrega_completada: 'Entrega Completada',
      suspendido: 'Suspendido',
      cancelado: 'Cancelado',
    };
    return estadosFormateados[estado];
  }

  private getColorEstado(
    estado: EstadoSolicitud
  ): 'success' | 'warning' | 'error' | 'info' {
    const estadosExito = [
      'aprobado',
      'certificado_generado',
      'entrega_completada',
    ];
    const estadosAdvertencia = [
      'documentos_observados',
      'garante_rechazado',
      'en_decision',
    ];
    const estadosError = ['rechazado', 'cancelado'];

    if (estadosExito.includes(estado)) return 'success';
    if (estadosAdvertencia.includes(estado)) return 'warning';
    if (estadosError.includes(estado)) return 'error';
    return 'info';
  }

  private formatearTiempo(dias: number): string {
    if (dias === 0) return 'Hoy';
    if (dias === 1) return '1 día';
    if (dias < 7) return `${dias} días`;
    if (dias < 30)
      return `${Math.floor(dias / 7)} semana${dias >= 14 ? 's' : ''}`;
    return `${Math.floor(dias / 30)} mes${dias >= 60 ? 'es' : ''}`;
  }

  private getColorTiempo(
    dias: number,
    estaVencido: boolean
  ): 'success' | 'warning' | 'error' {
    if (estaVencido) return 'error';
    if (dias >= 3) return 'warning';
    return 'success';
  }

  private getEstadosPorEtapa(etapa: FiltroEtapa): EstadoSolicitud[] {
    const etapas: { [key in FiltroEtapa]: EstadoSolicitud[] } = {
      '': [],
      documental: ['evaluacion_documental', 'documentos_observados'],
      garantes: ['evaluacion_garantes', 'garante_rechazado'],
      entrevista: ['entrevista_programada', 'en_entrevista'],
      decision: ['en_decision'],
    };
    return etapas[etapa];
  }

  // Métodos públicos para el template
  cambiarFiltroEtapa(etapa: FiltroEtapa): void {
    this.filtroEtapa.set(etapa);
  }

  cambiarFiltroPrioridad(prioridad: FiltroPrioridad): void {
    this.filtroPrioridad.set(prioridad);
  }

  actualizarCola(): void {
    this.cargarSolicitudes();
  }

  getEstadoClasses(color: 'success' | 'warning' | 'error' | 'info'): string {
    const classes = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    };
    return classes[color];
  }

  async abrirExpediente(solicitud: SolicitudColaTrabajoVM): Promise<void> {
    await this.router.navigate(['dashboard/admin-clientes/evaluacion/expediente', solicitud.id]);
  }

  async aprobarEtapa(solicitud: SolicitudColaTrabajoVM): Promise<void> {
    if (this.procesandoAccion()) return;

    this.procesandoAccion.set(solicitud.id);

    try {
      const siguienteEstado = this.calcularSiguienteEstado(
        solicitud.solicitudOriginal.estado
      );

      await this.evaluacionService.cambiarEstado(
        solicitud.id,
        siguienteEstado,
        'usuario_actual', // TODO: Obtener usuario actual del servicio de autenticación
        'Usuario Actual',
        'Etapa aprobada desde cola de trabajo'
      );

      this.mostrarExito(
        `Etapa aprobada. Estado actualizado a: ${this.formatearEstado(
          siguienteEstado
        )}`
      );
      this.cargarSolicitudes();
    } catch (error) {
      console.error('Error aprobando etapa:', error);
      this.mostrarError('Error al aprobar la etapa');
    } finally {
      this.procesandoAccion.set(null);
    }
  }

  async observarSolicitud(solicitud: SolicitudColaTrabajoVM): Promise<void> {
    if (this.procesandoAccion()) return;

    this.procesandoAccion.set(solicitud.id);

    try {
      const estadoObservado = this.calcularEstadoObservado(
        solicitud.solicitudOriginal.estado
      );

      await this.evaluacionService.cambiarEstado(
        solicitud.id,
        estadoObservado,
        'usuario_actual', // TODO: Obtener usuario actual del servicio de autenticación
        'Usuario Actual',
        'Solicitud observada desde cola de trabajo',
        'Requiere revisión adicional'
      );

      this.mostrarAdvertencia(
        `Solicitud observada. Estado: ${this.formatearEstado(estadoObservado)}`
      );
      this.cargarSolicitudes();
    } catch (error) {
      console.error('Error observando solicitud:', error);
      this.mostrarError('Error al observar la solicitud');
    } finally {
      this.procesandoAccion.set(null);
    }
  }

  async reasignarSolicitud(solicitud: SolicitudColaTrabajoVM): Promise<void> {
    if (this.procesandoAccion()) return;

    const dialogRef = this.dialog.open(ReasignacionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { solicitud: solicitud.solicitudOriginal },
      disableClose: true,
    });

    const resultado = await dialogRef.afterClosed().toPromise();

    if (resultado?.success) {
      this.mostrarExito(
        `Solicitud reasignada exitosamente a ${resultado.evaluadorNombre}`
      );
      this.cargarSolicitudes();
    } else if (resultado?.error) {
      this.mostrarError(resultado.error);
    }
  }

  // Métodos para acciones en lote (opcional)
  async aprobarVariasSolicitudes(
    solicitudes: SolicitudColaTrabajoVM[]
  ): Promise<void> {
    if (solicitudes.length === 0) return;

    this.procesandoAccion.set('lote');
    let exitosas = 0;
    let fallidas = 0;

    try {
      for (const solicitud of solicitudes) {
        try {
          const siguienteEstado = this.calcularSiguienteEstado(
            solicitud.solicitudOriginal.estado
          );
          await this.evaluacionService.cambiarEstado(
            solicitud.id,
            siguienteEstado,
            'usuario_actual',
            'Usuario Actual',
            'Aprobación en lote desde cola de trabajo'
          );
          exitosas++;
        } catch (error) {
          console.error(`Error aprobando solicitud ${solicitud.id}:`, error);
          fallidas++;
        }
      }

      if (exitosas > 0) {
        this.mostrarExito(`${exitosas} solicitud(es) aprobada(s) exitosamente`);
      }
      if (fallidas > 0) {
        this.mostrarError(
          `${fallidas} solicitud(es) no pudieron ser aprobadas`
        );
      }

      this.cargarSolicitudes();
    } finally {
      this.procesandoAccion.set(null);
    }
  }

  // Métodos de navegación y utilidades
  obtenerIconoEstado(estado: EstadoSolicitud): string {
    const iconos: { [key in EstadoSolicitud]: string } = {
      pendiente: 'schedule',
      en_revision_inicial: 'visibility',
      evaluacion_documental: 'description',
      documentos_observados: 'warning',
      evaluacion_garantes: 'people',
      garante_rechazado: 'person_off',
      entrevista_programada: 'event',
      en_entrevista: 'record_voice_over',
      entrevista_completada: 'check_circle_outline',
      en_decision: 'gavel',
      aprobado: 'check_circle',
      rechazado: 'cancel',
      condicional: 'help',
      certificado_generado: 'verified',
      esperando_inicial: 'payment',
      inicial_confirmada: 'paid',
      contrato_firmado: 'assignment',
      entrega_completada: 'done_all',
      suspendido: 'pause',
      cancelado: 'block',
    };
    return iconos[estado] || 'help';
  }

  obtenerTooltipEstado(solicitud: SolicitudColaTrabajoVM): string {
    const tooltips = {
      en_revision_inicial: 'Solicitud en revisión inicial por parte del equipo',
      evaluacion_documental: 'Documentos siendo evaluados por especialista',
      documentos_observados: 'Documentos requieren corrección o aclaración',
      evaluacion_garantes: 'Evaluando garantes y referencias proporcionadas',
      garante_rechazado: 'Garante no cumple requisitos, requiere reemplazo',
      entrevista_programada: 'Entrevista con cliente programada',
      en_entrevista: 'Entrevista en curso con el cliente',
      en_decision: 'Solicitud en evaluación final para decisión',
    };

    const estadoKey = solicitud.solicitudOriginal
      .estado as keyof typeof tooltips;
    return tooltips[estadoKey] || `Solicitud en estado: ${solicitud.estado}`;
  }

  private calcularSiguienteEstado(
    estadoActual: EstadoSolicitud
  ): EstadoSolicitud {
    const transiciones: { [key in EstadoSolicitud]: EstadoSolicitud } = {
      pendiente: 'en_revision_inicial',
      en_revision_inicial: 'evaluacion_documental',
      evaluacion_documental: 'evaluacion_garantes',
      documentos_observados: 'evaluacion_documental',
      evaluacion_garantes: 'entrevista_programada',
      garante_rechazado: 'evaluacion_garantes',
      entrevista_programada: 'en_entrevista',
      en_entrevista: 'entrevista_completada',
      entrevista_completada: 'en_decision',
      en_decision: 'aprobado',
      aprobado: 'certificado_generado',
      condicional: 'certificado_generado',
      certificado_generado: 'esperando_inicial',
      esperando_inicial: 'inicial_confirmada',
      inicial_confirmada: 'contrato_firmado',
      contrato_firmado: 'entrega_completada',
      entrega_completada: 'entrega_completada',
      rechazado: 'rechazado',
      suspendido: 'en_revision_inicial',
      cancelado: 'cancelado',
    };

    return transiciones[estadoActual] || estadoActual;
  }

  private calcularEstadoObservado(
    estadoActual: EstadoSolicitud
  ): EstadoSolicitud {
    const estadosObservados: { [key in EstadoSolicitud]: EstadoSolicitud } = {
      pendiente: 'pendiente',
      en_revision_inicial: 'pendiente',
      evaluacion_documental: 'documentos_observados',
      documentos_observados: 'documentos_observados',
      evaluacion_garantes: 'garante_rechazado',
      garante_rechazado: 'garante_rechazado',
      entrevista_programada: 'evaluacion_garantes',
      en_entrevista: 'entrevista_programada',
      entrevista_completada: 'entrevista_programada',
      en_decision: 'entrevista_completada',
      aprobado: 'en_decision',
      condicional: 'en_decision',
      certificado_generado: 'condicional',
      esperando_inicial: 'certificado_generado',
      inicial_confirmada: 'esperando_inicial',
      contrato_firmado: 'inicial_confirmada',
      entrega_completada: 'entrega_completada',
      rechazado: 'rechazado',
      suspendido: 'suspendido',
      cancelado: 'cancelado',
    };

    return estadosObservados[estadoActual] || estadoActual;
  }

  // Métodos para mostrar mensajes
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['success-snackbar'],
    });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 8000,
      panelClass: ['error-snackbar'],
    });
  }

  private mostrarAdvertencia(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 6000,
      panelClass: ['warning-snackbar'],
    });
  }

  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['info-snackbar'],
    });
  }

  // Métodos para trackBy (performance)
  trackBySolicitudId(index: number, solicitud: SolicitudColaTrabajoVM): string {
    return solicitud.id;
  }

  // Método para exportar datos (opcional)
  exportarDatos(): void {
    const solicitudes = this.solicitudesFiltradas();
    const datos = solicitudes.map((s) => ({
      numero: s.numeroSolicitud,
      cliente: `${s.cliente.nombre} ${s.cliente.apellidos}`,
      dni: s.cliente.dni,
      vehiculo: s.vehiculo,
      monto: s.monto,
      estado: s.estado,
      evaluador: s.asignadoA,
      tiempo: s.tiempo,
      vencida: s.estaVencido ? 'Sí' : 'No',
    }));

    // TODO: Implementar exportación a Excel/CSV
    console.log('Datos para exportar:', datos);
    this.mostrarInfo('Funcionalidad de exportación en desarrollo');
  }

  // Métodos para debugging (solo desarrollo)
  private logEstadoComponente(): void {
    console.log('Estado actual del componente:', {
      totalSolicitudes: this.totalSolicitudes(),
      solicitudesFiltradas: this.solicitudesFiltradas().length,
      vencidas: this.solicitudesVencidas(),
      urgentes: this.solicitudesUrgentes(),
      filtros: {
        etapa: this.filtroEtapa(),
        prioridad: this.filtroPrioridad(),
      },
      cargando: this.cargando(),
      ultimaActualizacion: this.ultimaActualizacion(),
    });
  }

  //--- Fin del componente ----
}
