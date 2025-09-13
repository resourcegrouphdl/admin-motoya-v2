import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { EstadoSolicitud, Evaluacion, Referencia, TipoEvaluacion } from '../../admin-clientes/modelos/modelos-solicitudes';

interface EstadisticasEntrevistas {
  totalEvaluaciones: number;
  entrevistasCompletadas: number;
  entrevistasPendientes: number;
  entrevistasEnProceso: number;
  referenciasVerificadas: number;
  porcentajeCompletitud: number;
  tiempoPromedioEntrevista: number;
  scorePromedioEntrevistas: number;
}

interface EntrevistaAgrupada {
  tipo: TipoEvaluacion;
  label: string;
  evaluaciones: Evaluacion[];
  icono: string;
  color: string;
  obligatoria: boolean;
  completada: boolean;
}

interface ProgramacionEntrevista {
  tipo: TipoEvaluacion;
  fechaPropuesta: Date;
  evaluadorId: string;
  evaluadorNombre: string;
  modalidad: 'presencial' | 'virtual' | 'telefonica';
  observaciones?: string;
}

@Component({
  selector: 'app-entrevistas-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatStepperModule
  ],
  templateUrl: './entrevistas-detalle.component.html',
  styleUrl: './entrevistas-detalle.component.css'
})
export class EntrevistasDetalleComponent implements OnInit, OnChanges{

  @Input() evaluaciones!: Evaluacion[];
  @Input() referencias!: Referencia[];
  @Input() solicitudId!: string;
  @Input() estado!: EstadoSolicitud;

  // Datos procesados
  estadisticas: EstadisticasEntrevistas = this.inicializarEstadisticas();
  entrevistasAgrupadas: EntrevistaAgrupada[] = [];
  evaluacionSeleccionada: Evaluacion | null = null;
  
  // Estado de la UI
  seccionExpandida = 'resumen';
  mostrarProgramacion = false;
  mostrarDetalleEvaluacion = false;
  
  // Configuración de tipos de entrevista
  readonly TIPOS_ENTREVISTA = {
    entrevista: {
      label: 'Entrevista Personal',
      icono: 'record_voice_over',
      color: 'primary',
      obligatoria: true,
      descripcion: 'Entrevista directa con el titular de la solicitud'
    }
  };

  readonly ESTADOS_EVALUACION = {
    pendiente: { label: 'Pendiente', color: 'accent', icono: 'schedule' },
    en_proceso: { label: 'En Proceso', color: 'primary', icono: 'play_circle' },
    completada: { label: 'Completada', color: 'primary', icono: 'check_circle' },
    observada: { label: 'Observada', color: 'warn', icono: 'error' },
    rechazada: { label: 'Rechazada', color: 'warn', icono: 'cancel' }
  };

  readonly MODALIDADES_ENTREVISTA = {
    presencial: { label: 'Presencial', icono: 'person', color: 'primary' },
    virtual: { label: 'Virtual', icono: 'videocam', color: 'accent' },
    telefonica: { label: 'Telefónica', icono: 'phone', color: 'warn' }
  };

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.procesarEntrevistas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['evaluaciones'] || changes['referencias'] || changes['estado']) && 
        !changes['evaluaciones']?.firstChange) {
      this.procesarEntrevistas();
    }
  }

  // ======================================
  // PROCESAMIENTO DE DATOS
  // ======================================

  private procesarEntrevistas(): void {
    this.calcularEstadisticas();
    this.agruparEntrevistas();
  }

  private inicializarEstadisticas(): EstadisticasEntrevistas {
    return {
      totalEvaluaciones: 0,
      entrevistasCompletadas: 0,
      entrevistasPendientes: 0,
      entrevistasEnProceso: 0,
      referenciasVerificadas: 0,
      porcentajeCompletitud: 0,
      tiempoPromedioEntrevista: 0,
      scorePromedioEntrevistas: 0
    };
  }

  private calcularEstadisticas(): void {
    if (!this.evaluaciones || this.evaluaciones.length === 0) {
      this.estadisticas = this.inicializarEstadisticas();
      return;
    }

    // Filtrar solo evaluaciones de tipo entrevista
    const entrevistas = this.evaluaciones.filter(e => e.tipoEvaluacion === 'entrevista');
    
    const totalEvaluaciones = entrevistas.length;
    const entrevistasCompletadas = entrevistas.filter(e => e.estado === 'completada').length;
    const entrevistasPendientes = entrevistas.filter(e => e.estado === 'pendiente').length;
    const entrevistasEnProceso = entrevistas.filter(e => e.estado === 'en_proceso').length;

    // Estadísticas de referencias
    const referenciasVerificadas = this.referencias ? 
      this.referencias.filter(r => r.estadoVerificacion === 'verificado').length : 0;

    // Cálculo de tiempo promedio
    const entrevistasConTiempo = entrevistas.filter(e => 
      e.tiempoEmpleado && e.tiempoEmpleado > 0
    );
    const tiempoPromedioEntrevista = entrevistasConTiempo.length > 0 ?
      Math.round(entrevistasConTiempo.reduce((sum, e) => sum + (e.tiempoEmpleado || 0), 0) / entrevistasConTiempo.length) : 0;

    // Cálculo de score promedio
    const entrevistasConScore = entrevistas.filter(e => e.score && e.score > 0);
    const scorePromedioEntrevistas = entrevistasConScore.length > 0 ?
      Math.round(entrevistasConScore.reduce((sum, e) => sum + (e.score || 0), 0) / entrevistasConScore.length) : 0;

    const porcentajeCompletitud = totalEvaluaciones > 0 ? 
      Math.round((entrevistasCompletadas / totalEvaluaciones) * 100) : 0;

    this.estadisticas = {
      totalEvaluaciones,
      entrevistasCompletadas,
      entrevistasPendientes,
      entrevistasEnProceso,
      referenciasVerificadas,
      porcentajeCompletitud,
      tiempoPromedioEntrevista,
      scorePromedioEntrevistas
    };
  }

  private agruparEntrevistas(): void {
    // Filtrar solo evaluaciones de tipo entrevista
    const entrevistas = this.evaluaciones.filter(e => e.tipoEvaluacion === 'entrevista');

    this.entrevistasAgrupadas = [{
      tipo: 'entrevista',
      label: this.TIPOS_ENTREVISTA.entrevista.label,
      evaluaciones: entrevistas,
      icono: this.TIPOS_ENTREVISTA.entrevista.icono,
      color: this.TIPOS_ENTREVISTA.entrevista.color,
      obligatoria: this.TIPOS_ENTREVISTA.entrevista.obligatoria,
      completada: entrevistas.some(e => e.estado === 'completada')
    }];
  }

  // ======================================
  // MÉTODOS DE VALIDACIÓN Y CÁLCULO
  // ======================================

  cumpleRequisitosMinimos(): boolean {
    // Al menos una entrevista completada
    const entrevistasCompletadas = this.estadisticas.entrevistasCompletadas;
    
    // Al menos 2 referencias verificadas
    const referenciasVerificadas = this.estadisticas.referenciasVerificadas;
    
    return entrevistasCompletadas >= 1 && referenciasVerificadas >= 2;
  }

  obtenerEstadoEntrevistas(): { estado: 'completo' | 'incompleto' | 'en_proceso'; mensaje: string; color: string } {
    const completadas = this.estadisticas.entrevistasCompletadas;
    const enProceso = this.estadisticas.entrevistasEnProceso;
    const pendientes = this.estadisticas.entrevistasPendientes;

    if (completadas >= 1 && this.estadisticas.referenciasVerificadas >= 2) {
      return {
        estado: 'completo',
        mensaje: 'Proceso de entrevistas completado',
        color: 'primary'
      };
    }

    if (enProceso > 0) {
      return {
        estado: 'en_proceso',
        mensaje: `${enProceso} entrevista(s) en proceso`,
        color: 'accent'
      };
    }

    if (pendientes > 0) {
      return {
        estado: 'incompleto',
        mensaje: `${pendientes} entrevista(s) pendiente(s)`,
        color: 'warn'
      };
    }

    return {
      estado: 'incompleto',
      mensaje: 'No hay entrevistas programadas',
      color: 'warn'
    };
  }

  puedeIniciarEntrevista(): boolean {
    const estadosPermitidos: EstadoSolicitud[] = [
      'entrevista_programada', 'en_entrevista'
    ];
    return estadosPermitidos.includes(this.estado);
  }

  puedeCompletarEntrevista(): boolean {
    const estadosPermitidos: EstadoSolicitud[] = [
      'en_entrevista', 'entrevista_completada'
    ];
    return estadosPermitidos.includes(this.estado) && 
           this.estadisticas.entrevistasEnProceso > 0;
  }

  // ======================================
  // MÉTODOS DE INTERFAZ
  // ======================================

  expandirSeccion(seccionId: string): void {
    this.seccionExpandida = this.seccionExpandida === seccionId ? '' : seccionId;
  }

  estaSeccionExpandida(seccionId: string): boolean {
    return this.seccionExpandida === seccionId;
  }

  seleccionarEvaluacion(evaluacion: Evaluacion): void {
    this.evaluacionSeleccionada = this.evaluacionSeleccionada?.id === evaluacion.id 
      ? null 
      : evaluacion;
  }

  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'No programada';
    
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearDuracion(minutos: number): string {
    if (!minutos || minutos === 0) return 'No registrado';
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins} minutos`;
  }

  obtenerColorScore(score: number): 'primary' | 'accent' | 'warn' {
    if (score >= 80) return 'primary';
    if (score >= 60) return 'accent';
    return 'warn';
  }

  obtenerDescripcionScore(score: number): string {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muy Bueno';
    if (score >= 70) return 'Bueno';
    if (score >= 60) return 'Regular';
    if (score >= 50) return 'Deficiente';
    return 'Muy Deficiente';
  }

  // ======================================
  // ACCIONES DE ENTREVISTAS
  // ======================================

  programarEntrevista(): void {
    this.mostrarProgramacion = true;
  }

  iniciarEntrevista(evaluacion: Evaluacion): void {
    if (!this.puedeIniciarEntrevista()) {
      this.mostrarError('No se puede iniciar la entrevista en el estado actual');
      return;
    }

    // TODO: Implementar inicio de entrevista real
    this.mostrarExito(`Entrevista iniciada: ${evaluacion.id}`);
  }

  completarEntrevista(evaluacion: Evaluacion): void {
    if (!this.puedeCompletarEntrevista()) {
      this.mostrarError('No se puede completar la entrevista en el estado actual');
      return;
    }

    // TODO: Implementar finalización de entrevista
    this.mostrarExito(`Entrevista completada: ${evaluacion.id}`);
  }

  editarEntrevista(evaluacion: Evaluacion): void {
    this.evaluacionSeleccionada = evaluacion;
    this.mostrarDetalleEvaluacion = true;
  }

  cancelarEntrevista(evaluacion: Evaluacion): void {
    // TODO: Implementar cancelación de entrevista
    this.mostrarInfo(`Cancelando entrevista: ${evaluacion.id}`);
  }

  reprogramarEntrevista(evaluacion: Evaluacion): void {
    // TODO: Implementar reprogramación
    this.mostrarInfo(`Reprogramando entrevista: ${evaluacion.id}`);
  }

  agregarObservaciones(evaluacion: Evaluacion): void {
    // TODO: Implementar agregar observaciones
    this.mostrarInfo(`Agregando observaciones para: ${evaluacion.id}`);
  }

  // ======================================
  // ACCIONES GENERALES
  // ======================================

  exportarEntrevistas(): void {
    try {
      const datosExportacion = this.evaluaciones
        .filter(e => e.tipoEvaluacion === 'entrevista')
        .map(evalu => ({
          'ID': evalu.id,
          'Evaluador': evalu.evaluadorNombre,
          'Fecha Inicio': evalu.fechaInicio ? this.formatearFecha(evalu.fechaInicio) : 'N/A',
          'Fecha Fin': evalu.fechaFin ? this.formatearFecha(evalu.fechaFin) : 'N/A',
          'Estado': this.ESTADOS_EVALUACION[evalu.estado].label,
          'Score': evalu.score || 'N/A',
          'Tiempo Empleado': evalu.tiempoEmpleado ? this.formatearDuracion(evalu.tiempoEmpleado) : 'N/A',
          'Observaciones': evalu.observaciones || 'N/A',
          'Recomendación': evalu.recomendacion || 'N/A'
        }));

      const headers = Object.keys(datosExportacion[0] || {});
      const csvContent = [
        headers.join(','),
        ...datosExportacion.map(row => 
          headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `entrevistas_${this.solicitudId}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.mostrarExito('Entrevistas exportadas exitosamente');
    } catch (error) {
      this.mostrarError('Error al exportar entrevistas');
    }
  }

  generarReporteEntrevistas(): void {
    try {
      const reporte = {
        fechaGeneracion: new Date().toLocaleString('es-PE'),
        solicitudId: this.solicitudId,
        resumenGeneral: {
          totalEntrevistas: this.estadisticas.totalEvaluaciones,
          completadas: this.estadisticas.entrevistasCompletadas,
          pendientes: this.estadisticas.entrevistasPendientes,
          porcentajeCompletitud: this.estadisticas.porcentajeCompletitud,
          scorePromedio: this.estadisticas.scorePromedioEntrevistas,
          tiempoPromedio: this.estadisticas.tiempoPromedioEntrevista,
          cumpleRequisitos: this.cumpleRequisitosMinimos()
        },
        detalleEntrevistas: this.evaluaciones
          .filter(e => e.tipoEvaluacion === 'entrevista')
          .map(evalu => ({
            id: evalu.id,
            evaluador: evalu.evaluadorNombre,
            estado: this.ESTADOS_EVALUACION[evalu.estado].label,
            score: evalu.score,
            duracion: evalu.tiempoEmpleado,
            observaciones: evalu.observaciones
          })),
        recomendaciones: this.generarRecomendaciones()
      };

      const reporteJson = JSON.stringify(reporte, null, 2);
      const blob = new Blob([reporteJson], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_entrevistas_${this.solicitudId}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.mostrarExito('Reporte de entrevistas generado exitosamente');
    } catch (error) {
      this.mostrarError('Error al generar reporte de entrevistas');
    }
  }

  private generarRecomendaciones(): string[] {
    const recomendaciones: string[] = [];

    // Análisis de completitud
    if (this.estadisticas.entrevistasCompletadas === 0) {
      recomendaciones.push('Se requiere completar al menos una entrevista para continuar el proceso');
    }

    // Análisis de referencias
    if (this.estadisticas.referenciasVerificadas < 2) {
      recomendaciones.push('Se necesitan al menos 2 referencias verificadas antes de proceder');
    }

    // Análisis de calidad
    if (this.estadisticas.scorePromedioEntrevistas > 0 && this.estadisticas.scorePromedioEntrevistas < 60) {
      recomendaciones.push('El score promedio de entrevistas es bajo. Considere entrevistas adicionales');
    }

    // Análisis de tiempo
    if (this.estadisticas.tiempoPromedioEntrevista > 0 && this.estadisticas.tiempoPromedioEntrevista < 15) {
      recomendaciones.push('Las entrevistas son muy breves. Considere profundizar más en la evaluación');
    }

    // Si todo está bien
    if (recomendaciones.length === 0) {
      recomendaciones.push('El proceso de entrevistas cumple con todos los estándares de calidad');
    }

    return recomendaciones;
  }

  cerrarProgramacion(): void {
    this.mostrarProgramacion = false;
  }

  cerrarDetalleEvaluacion(): void {
    this.mostrarDetalleEvaluacion = false;
    this.evaluacionSeleccionada = null;
  }

  // ======================================
  // UTILIDADES DE NOTIFICACIÓN
  // ======================================

  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // ======================================
  // GETTERS PARA TEMPLATE
  // ======================================

  get tieneEntrevistas(): boolean {
    return this.evaluaciones && this.evaluaciones.filter(e => e.tipoEvaluacion === 'entrevista').length > 0;
  }

  get estadoEntrevistas() {
    return this.obtenerEstadoEntrevistas();
  }

  get entrevistasPendientes(): Evaluacion[] {
    return this.evaluaciones.filter(e => 
      e.tipoEvaluacion === 'entrevista' && e.estado === 'pendiente'
    );
  }

  get entrevistasEnProceso(): Evaluacion[] {
    return this.evaluaciones.filter(e => 
      e.tipoEvaluacion === 'entrevista' && e.estado === 'en_proceso'
    );
  }

  get entrevistasCompletadas(): Evaluacion[] {
    return this.evaluaciones.filter(e => 
      e.tipoEvaluacion === 'entrevista' && e.estado === 'completada'
    );
  }
}