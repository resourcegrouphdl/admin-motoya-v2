import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ESTADOS_CONFIG, EstadoSolicitud, ExpedienteCompleto, FASES_PROCESO } from '../../admin-clientes/modelos/modelos-solicitudes';
import { MatCardModule } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';

interface MetricaResumen {
  id: string;
  label: string;
  valor: string | number;
  porcentaje?: number;
  tipo: 'score' | 'dinero' | 'tiempo' | 'cantidad' | 'porcentaje';
  color: 'primary' | 'accent' | 'warn' | 'success';
  icono: string;
  descripcion?: string;
}

interface ItemTimeline {
  fecha: Date;
  titulo: string;
  descripcion: string;
  estado: 'completado' | 'actual' | 'pendiente';
  icono: string;
  color: string;
}


@Component({
  selector: 'app-expediente-resumen',
  standalone: true,
  imports: [MatCardModule, MatIcon, MatChipsModule, MatDividerModule, MatProgressBarModule, FormsModule, NgIf, NgFor, CommonModule],
  templateUrl: './expediente-resumen.component.html',
  styleUrl: './expediente-resumen.component.scss'
})
export class ExpedienteResumenComponent implements OnInit, OnChanges {

  @Input() expediente!: ExpedienteCompleto;

  // Propiedades calculadas
  metricas: MetricaResumen[] = [];
  timeline: ItemTimeline[] = [];
  alertasCriticas: string[] = [];
  recomendaciones: string[] = [];
  
  // Estado del componente
  mostrarDetallesScore = false;
  mostrarHistorialCompleto = false;

  // Referencias a configuraciones
  ESTADOS_CONFIG = ESTADOS_CONFIG;
  FASES_PROCESO = FASES_PROCESO;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.inicializarResumen();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expediente'] && !changes['expediente'].firstChange) {
      this.inicializarResumen();
    }
  }

  // ======================================
  // INICIALIZACIÓN DEL RESUMEN
  // ======================================

  private inicializarResumen(): void {
    if (!this.expediente) return;

    this.calcularMetricas();
    this.generarTimeline();
    this.identificarAlertasCriticas();
    this.generarRecomendaciones();
  }

  // ======================================
  // CÁLCULO DE MÉTRICAS
  // ======================================

  private calcularMetricas(): void {
    const solicitud = this.expediente.solicitud;
    const resumen = this.expediente.resumenEvaluacion;

    this.metricas = [
      {
        id: 'score_final',
        label: 'Score Final',
        valor: solicitud.scoreFinal || 0,
        porcentaje: solicitud.scoreFinal || 0,
        tipo: 'score',
        color: this.getColorScore(solicitud.scoreFinal || 0),
        icono: 'assessment',
        descripcion: 'Puntuación integral del expediente'
      },
      {
        id: 'monto_solicitado',
        label: 'Monto Solicitado',
        valor: solicitud.precioCompraMoto,
        tipo: 'dinero',
        color: 'primary',
        icono: 'attach_money',
        descripcion: `Inicial: ${this.formatearMoneda(solicitud.inicial)}`
      },
      {
        id: 'probabilidad_aprobacion',
        label: 'Probabilidad Aprobación',
        valor: resumen.probabilidadAprobacion,
        porcentaje: resumen.probabilidadAprobacion,
        tipo: 'porcentaje',
        color: this.getColorProbabilidad(resumen.probabilidadAprobacion),
        icono: 'trending_up',
        descripcion: 'Basado en análisis integral'
      },
      {
        id: 'documentos_validados',
        label: 'Documentos',
        valor: `${resumen.porcentajeDocumentosValidados}%`,
        porcentaje: resumen.porcentajeDocumentosValidados,
        tipo: 'porcentaje',
        color: resumen.porcentajeDocumentosValidados >= 80 ? 'success' : 'warn',
        icono: 'folder_open',
        descripcion: 'Documentos validados correctamente'
      },
      {
        id: 'referencias_verificadas',
        label: 'Referencias',
        valor: `${this.expediente.referencias.filter(r => r.estadoVerificacion === 'verificado').length}/${this.expediente.referencias.length}`,
        porcentaje: resumen.porcentajeReferenciasVerificadas,
        tipo: 'cantidad',
        color: resumen.porcentajeReferenciasVerificadas >= 100 ? 'success' : 'accent',
        icono: 'contacts',
        descripcion: 'Referencias contactadas y verificadas'
      },
      {
        id: 'dias_en_proceso',
        label: 'Días en Proceso',
        valor: solicitud.diasEnEstado,
        tipo: 'tiempo',
        color: solicitud.estaVencido ? 'warn' : 'primary',
        icono: 'schedule',
        descripcion: solicitud.estaVencido ? 'Proceso vencido' : 'Dentro del tiempo límite'
      }
    ];
  }

  // ======================================
  // GENERACIÓN DE TIMELINE
  // ======================================

  private generarTimeline(): void {
    this.timeline = [];
    
    // Obtener historial de estados ordenado por fecha
    const historial = [...this.expediente.historialEstados]
      .sort((a, b) => a.fechaCambio.getTime() - b.fechaCambio.getTime());

    // Agregar eventos del historial
    historial.forEach((evento, index) => {
      this.timeline.push({
        fecha: evento.fechaCambio,
        titulo: ESTADOS_CONFIG[evento.estadoNuevo]?.label || evento.estadoNuevo,
        descripcion: evento.observaciones || `Cambio realizado por ${evento.usuarioNombre}`,
        estado: index === historial.length - 1 ? 'actual' : 'completado',
        icono: ESTADOS_CONFIG[evento.estadoNuevo]?.icon || 'radio_button_checked',
        color: ESTADOS_CONFIG[evento.estadoNuevo]?.color || 'primary'
      });
    });

    // Agregar eventos futuros estimados
    this.agregarEventosFuturos();

    // Limitar a los últimos 8 eventos si no se muestra el historial completo
    if (!this.mostrarHistorialCompleto && this.timeline.length > 8) {
      this.timeline = this.timeline.slice(-8);
    }
  }

  private agregarEventosFuturos(): void {
    const estadoActual = this.expediente.solicitud.estado;
    const estadosOrdenados = Object.keys(ESTADOS_CONFIG) as EstadoSolicitud[];
    const indiceActual = estadosOrdenados.indexOf(estadoActual);

    // Agregar próximos 3 estados como pendientes
    for (let i = indiceActual + 1; i < Math.min(indiceActual + 4, estadosOrdenados.length); i++) {
      const estado = estadosOrdenados[i];
      
      // Estimar fecha futura (basado en tiempos límite promedio)
      const diasEstimados = this.calcularDiasEstimados(estado);
      const fechaEstimada = new Date();
      fechaEstimada.setDate(fechaEstimada.getDate() + diasEstimados);

      this.timeline.push({
        fecha: fechaEstimada,
        titulo: ESTADOS_CONFIG[estado].label,
        descripcion: 'Estimado - Fecha aproximada',
        estado: 'pendiente',
        icono: ESTADOS_CONFIG[estado].icon,
        color: 'accent'
      });
    }
  }

  private calcularDiasEstimados(estado: EstadoSolicitud): number {
    const tiemposEstimados: { [key in EstadoSolicitud]: number } = {
      pendiente: 1,
      en_revision_inicial: 2,
      evaluacion_documental: 3,
      documentos_observados: 5,
      evaluacion_garantes: 2,
      garante_rechazado: 3,
      entrevista_programada: 4,
      en_entrevista: 1,
      entrevista_completada: 1,
      en_decision: 2,
      aprobado: 1,
      rechazado: 0,
      condicional: 3,
      certificado_generado: 2,
      esperando_inicial: 7,
      inicial_confirmada: 2,
      contrato_firmado: 5,
      entrega_completada: 0,
      suspendido: 0,
      cancelado: 0
    };

    return tiemposEstimados[estado] || 2;
  }

  // ======================================
  // IDENTIFICACIÓN DE ALERTAS CRÍTICAS
  // ======================================

  private identificarAlertasCriticas(): void {
    this.alertasCriticas = [];
    const alertas = this.expediente.alertas;
    const solicitud = this.expediente.solicitud;

    // Alertas de tiempo crítico
    if (alertas.requiereAtencionUrgente) {
      this.alertasCriticas.push('🚨 ATENCIÓN URGENTE REQUERIDA');
    }

    if (solicitud.estaVencido) {
      this.alertasCriticas.push('⏰ Tiempo límite EXCEDIDO');
    }

    // Alertas de documentos
    if (alertas.documentosVencidos.length > 0) {
      this.alertasCriticas.push(`📄 ${alertas.documentosVencidos.length} documentos observados`);
    }

    // Alertas de inconsistencias
    if (alertas.inconsistenciasDetectadas.length > 0) {
      this.alertasCriticas.push(`⚠️ ${alertas.inconsistenciasDetectadas.length} inconsistencias detectadas`);
    }

    // Alertas de score bajo
    if (solicitud.scoreFinal && solicitud.scoreFinal < 60) {
      this.alertasCriticas.push('📊 Score final por debajo del mínimo recomendado');
    }

    // Alertas de referencias
    const referenciasVerificadas = this.expediente.referencias.filter(r => r.estadoVerificacion === 'verificado').length;
    if (referenciasVerificadas < 2) {
      this.alertasCriticas.push(`👥 Solo ${referenciasVerificadas} referencias verificadas`);
    }

    // Alertas de aprobación supervisoria
    if (solicitud.requiereAprobacionSupervisor && !solicitud.aprobadoPorSupervisor) {
      this.alertasCriticas.push('👨‍💼 Requiere aprobación de supervisor');
    }
  }

  // ======================================
  // GENERACIÓN DE RECOMENDACIONES
  // ======================================

  private generarRecomendaciones(): void {
    this.recomendaciones = [];
    const resumen = this.expediente.resumenEvaluacion;
    const solicitud = this.expediente.solicitud;

    // Recomendación del sistema
    switch (resumen.recomendacionSistema) {
      case 'aprobar':
        this.recomendaciones.push('✅ El sistema recomienda APROBAR esta solicitud');
        break;
      case 'rechazar':
        this.recomendaciones.push('❌ El sistema recomienda RECHAZAR esta solicitud');
        break;
      case 'revisar':
        this.recomendaciones.push('🔍 El sistema recomienda REVISAR con más detalle');
        break;
    }

    // Recomendaciones específicas basadas en el análisis
    if (resumen.nivelRiesgoCalculado === 'alto') {
      this.recomendaciones.push('🔴 Solicitar garantías adicionales debido al alto riesgo');
    }

    if (resumen.porcentajeDocumentosValidados < 100) {
      this.recomendaciones.push('📋 Completar validación de documentos pendientes');
    }

    if (resumen.porcentajeReferenciasVerificadas < 100) {
      this.recomendaciones.push('📞 Contactar referencias pendientes de verificación');
    }

    if (solicitud.scoreDocumental && solicitud.scoreDocumental < 70) {
      this.recomendaciones.push('📄 Revisar y mejorar documentación presentada');
    }

    if (solicitud.scoreGarantes && solicitud.scoreGarantes < 70) {
      this.recomendaciones.push('🤝 Evaluar cambio de fiador o garante');
    }

    if (solicitud.scoreEntrevista && solicitud.scoreEntrevista < 70) {
      this.recomendaciones.push('🗣️ Considerar entrevista adicional o complementaria');
    }

    // Recomendaciones financieras
    const porcentajeInicial = (solicitud.inicial / solicitud.precioCompraMoto) * 100;
    if (porcentajeInicial < 25) {
      this.recomendaciones.push('💰 Sugerir incrementar el pago inicial al 25% o más');
    }

    // Recomendaciones de proceso
    if (solicitud.diasEnEstado > 5) {
      this.recomendaciones.push('⚡ Priorizar para evitar mayor retraso en el proceso');
    }
  }

  // ======================================
  // MÉTODOS DE UTILIDAD Y COLORES
  // ======================================

  

  private getColorProbabilidad(probabilidad: number): 'primary' | 'accent' | 'warn' | 'success' {
    if (probabilidad >= 80) return 'success';
    if (probabilidad >= 60) return 'primary';
    if (probabilidad >= 40) return 'accent';
    return 'warn';
  }

  // ======================================
  // MÉTODOS PÚBLICOS PARA TEMPLATE
  // ======================================

  toggleDetallesScore(): void {
    this.mostrarDetallesScore = !this.mostrarDetallesScore;
  }

  toggleHistorialCompleto(): void {
    this.mostrarHistorialCompleto = !this.mostrarHistorialCompleto;
    this.generarTimeline(); // Regenerar timeline con nueva configuración
  }

  verDetalleMetrica(metrica: MetricaResumen): void {
    // TODO: Implementar diálogo con detalles de la métrica
    this.snackBar.open(`Detalle de ${metrica.label}: ${metrica.descripcion}`, 'Cerrar', {
      duration: 4000
    });
  }

  abrirCalculadoraScore(): void {
    // TODO: Implementar diálogo con calculadora de score detallada
    this.snackBar.open('Calculadora de score próximamente disponible', 'Cerrar', {
      duration: 3000
    });
  }

  exportarResumen(): void {
    // TODO: Implementar exportación del resumen
    this.snackBar.open('Funcionalidad de exportación en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }

  // ======================================
  // FORMATEO Y PRESENTACIÓN
  // ======================================

  formatearValorMetrica(valor: string | number, tipo: string): string {
  if (tipo === 'dinero' && typeof valor === 'number') {
    return this.formatearMoneda(valor);
  }
  return valor.toString();
}

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatearFechaCompleta(fecha: Date): string {
    return fecha.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearDuracion(dias: number): string {
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Hace 1 día';
    if (dias < 30) return `Hace ${dias} días`;
    
    const meses = Math.floor(dias / 30);
    if (meses === 1) return 'Hace 1 mes';
    return `Hace ${meses} meses`;
  }

  obtenerIconoEstado(estado: EstadoSolicitud): string {
    return ESTADOS_CONFIG[estado]?.icon || 'help';
  }

  obtenerColorEstado(estado: EstadoSolicitud): string {
    return ESTADOS_CONFIG[estado]?.color || 'primary';
  }

  getColorScore(score: number): 'primary' | 'accent' | 'warn' | 'success' {
    if (score >= 80) return 'success';
    if (score >= 70) return 'primary';
    if (score >= 60) return 'accent';
    return 'warn';
  }

  getDocumentoColor(estado?: string): 'primary' | 'accent' | 'warn' | 'success' {
    switch (estado) {
      case 'aprobado': return 'success';
      case 'observado': return 'warn';
      case 'rechazado': return 'warn';
      default: return 'accent';
    }
  }

  getReferenciasColor(estado?: string): 'primary' | 'accent' | 'warn' | 'success' {
    switch (estado) {
      case 'verificado': return 'success';
      case 'contactado': return 'primary';
      case 'no_contactado': return 'warn';
      case 'rechazado': return 'warn';
      default: return 'accent';
    }
  }
  formatearMoneda(monto: number): string {
  if (typeof monto !== 'number' || isNaN(monto)) {
    return 'S/ 0.00';
  }
  
  try {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(monto);
  } catch (error) {
    return `S/ ${monto.toFixed(2)}`;
  }
}

  // ======================================
  // GETTERS PARA TEMPLATE
  // ======================================

  get estadoConfigActual() {
    return ESTADOS_CONFIG[this.expediente.solicitud.estado];
  }

  get tiempoProcesoFormateado(): string {
    const tiempoMinutos = this.expediente.solicitud.tiempoTotalProceso || 0;
    const horas = Math.floor(tiempoMinutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) return `${dias} días`;
    if (horas > 0) return `${horas} horas`;
    return `${tiempoMinutos} minutos`;
  }

  get porcentajeProgresoGeneral(): number {
    return this.expediente.solicitud.porcentajeProgreso;
  }

  get scorePromedio(): number {
    const scores = [
      this.expediente.solicitud.scoreDocumental,
      this.expediente.solicitud.scoreGarantes,
      this.expediente.solicitud.scoreEntrevista
    ].filter(score => score !== undefined && score !== null) as number[];

    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }
}