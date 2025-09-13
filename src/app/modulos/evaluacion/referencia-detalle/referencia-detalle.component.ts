import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Referencia } from '../../admin-clientes/modelos/modelos-solicitudes';
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

interface EstadisticasReferencias {
  total: number;
  verificadas: number;
  pendientes: number;
  contactadas: number;
  noContactadas: number;
  rechazadas: number;
  scorePromedio: number;
  confiabilidadPromedio: number;
}

interface ReferenciaAgrupada {
  categoria: 'familiar' | 'amigo' | 'laboral' | 'otro';
  label: string;
  referencias: Referencia[];
  icono: string;
  color: string;
}

interface AccionReferencia {
  id: string;
  label: string;
  icono: string;
  color: string;
  disponible: boolean;
}

@Component({
  selector: 'app-referencia-detalle',
  standalone: true,
  imports: [ CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule],
  templateUrl: './referencia-detalle.component.html',
  styleUrl: './referencia-detalle.component.css'
})
export class ReferenciaDetalleComponent implements OnInit, OnChanges{
@Input() referencias!: Referencia[];
  @Input() solicitudId!: string;

  // Datos procesados
  estadisticas: EstadisticasReferencias = this.inicializarEstadisticas();
  referenciasAgrupadas: ReferenciaAgrupada[] = [];
  referenciaSeleccionada: Referencia | null = null;
  
  // Estado de la UI
  seccionExpandida = 'resumen';
  mostrarDetalleCompleto = false;
  
  // Configuración
  readonly ESTADOS_REFERENCIA = {
    pendiente: { label: 'Pendiente', color: 'accent', icono: 'schedule' },
    contactado: { label: 'Contactado', color: 'primary', icono: 'phone' },
    verificado: { label: 'Verificado', color: 'primary', icono: 'verified' },
    no_contactado: { label: 'No Contactado', color: 'warn', icono: 'phone_disabled' },
    rechazado: { label: 'Rechazado', color: 'warn', icono: 'block' }
  };

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.procesarReferencias();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['referencias'] && !changes['referencias'].firstChange) {
      this.procesarReferencias();
    }
  }

  // ======================================
  // PROCESAMIENTO DE DATOS
  // ======================================

  private procesarReferencias(): void {
    if (!this.referencias || this.referencias.length === 0) {
      this.estadisticas = this.inicializarEstadisticas();
      this.referenciasAgrupadas = [];
      return;
    }

    this.calcularEstadisticas();
    this.agruparReferencias();
  }

  private inicializarEstadisticas(): EstadisticasReferencias {
    return {
      total: 0,
      verificadas: 0,
      pendientes: 0,
      contactadas: 0,
      noContactadas: 0,
      rechazadas: 0,
      scorePromedio: 0,
      confiabilidadPromedio: 0
    };
  }

  private calcularEstadisticas(): void {
    const total = this.referencias.length;
    
    const verificadas = this.referencias.filter(r => r.estadoVerificacion === 'verificado').length;
    const pendientes = this.referencias.filter(r => r.estadoVerificacion === 'pendiente').length;
    const contactadas = this.referencias.filter(r => r.estadoVerificacion === 'contactado').length;
    const noContactadas = this.referencias.filter(r => r.estadoVerificacion === 'no_contactado').length;
    const rechazadas = this.referencias.filter(r => r.estadoVerificacion === 'rechazado').length;

    const scoresValidos = this.referencias.filter(r => r.puntajeReferencia > 0);
    const scorePromedio = scoresValidos.length > 0 
      ? scoresValidos.reduce((sum, r) => sum + r.puntajeReferencia, 0) / scoresValidos.length 
      : 0;

    const referenciasConConfiabilidad = this.referencias.filter(
      r => r.resultadoVerificacion?.confiabilidad
    );
    const confiabilidadPromedio = referenciasConConfiabilidad.length > 0
      ? referenciasConConfiabilidad.reduce((sum, r) => sum + (r.resultadoVerificacion?.confiabilidad || 0), 0) / referenciasConConfiabilidad.length
      : 0;

    this.estadisticas = {
      total,
      verificadas,
      pendientes,
      contactadas,
      noContactadas,
      rechazadas,
      scorePromedio: Math.round(scorePromedio),
      confiabilidadPromedio: Math.round(confiabilidadPromedio * 10) / 10
    };
  }

  private agruparReferencias(): void {
    const grupos: { [key: string]: ReferenciaAgrupada } = {
      familiar: {
        categoria: 'familiar',
        label: 'Referencias Familiares',
        referencias: [],
        icono: 'family_restroom',
        color: 'primary'
      },
      amigo: {
        categoria: 'amigo',
        label: 'Referencias de Amistad',
        referencias: [],
        icono: 'people',
        color: 'accent'
      },
      laboral: {
        categoria: 'laboral',
        label: 'Referencias Laborales',
        referencias: [],
        icono: 'work',
        color: 'primary'
      },
      otro: {
        categoria: 'otro',
        label: 'Otras Referencias',
        referencias: [],
        icono: 'person',
        color: 'warn'
      }
    };

    // Agrupar referencias por tipo
    this.referencias.forEach(referencia => {
      const tipo = referencia.tipoParentesco;
      if (grupos[tipo]) {
        grupos[tipo].referencias.push(referencia);
      } else {
        grupos['otro'].referencias.push(referencia);
      }
    });

    // Convertir a array y filtrar grupos vacíos
    this.referenciasAgrupadas = Object.values(grupos)
      .filter(grupo => grupo.referencias.length > 0)
      .sort((a, b) => b.referencias.length - a.referencias.length);
  }

  // ======================================
  // MÉTODOS DE CÁLCULO Y VALIDACIÓN
  // ======================================

  calcularPorcentajeVerificacion(): number {
    if (this.estadisticas.total === 0) return 0;
    return Math.round((this.estadisticas.verificadas / this.estadisticas.total) * 100);
  }

  calcularPorcentajeContacto(): number {
    if (this.estadisticas.total === 0) return 0;
    const contactadas = this.estadisticas.contactadas + this.estadisticas.verificadas;
    return Math.round((contactadas / this.estadisticas.total) * 100);
  }

  obtenerColorEstadoVerificacion(): 'primary' | 'accent' | 'warn' {
    const porcentaje = this.calcularPorcentajeVerificacion();
    if (porcentaje >= 70) return 'primary';
    if (porcentaje >= 40) return 'accent';
    return 'warn';
  }

  cumpleRequisitoMinimo(): boolean {
    return this.estadisticas.verificadas >= 2;
  }

  obtenerRequisitoEstado(): { cumple: boolean; mensaje: string; color: string } {
    const verificadas = this.estadisticas.verificadas;
    
    if (verificadas >= 3) {
      return {
        cumple: true,
        mensaje: 'Cumple con el requisito mínimo y tiene referencias adicionales',
        color: 'primary'
      };
    } else if (verificadas >= 2) {
      return {
        cumple: true,
        mensaje: 'Cumple con el requisito mínimo de 2 referencias verificadas',
        color: 'primary'
      };
    } else if (verificadas === 1) {
      return {
        cumple: false,
        mensaje: 'Falta 1 referencia verificada para cumplir el mínimo',
        color: 'accent'
      };
    } else {
      return {
        cumple: false,
        mensaje: 'Faltan 2 referencias verificadas para cumplir el mínimo',
        color: 'warn'
      };
    }
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

  seleccionarReferencia(referencia: Referencia): void {
    this.referenciaSeleccionada = this.referenciaSeleccionada?.id === referencia.id 
      ? null 
      : referencia;
  }

  formatearTelefono(telefono: string): string {
    if (!telefono) return 'No disponible';
    
    const numeroLimpio = telefono.replace(/\D/g, '');
    if (numeroLimpio.length === 9) {
      return `${numeroLimpio.substring(0, 3)} ${numeroLimpio.substring(3, 6)} ${numeroLimpio.substring(6)}`;
    }
    return telefono;
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

  obtenerColorPuntaje(puntaje: number): string {
    if (puntaje >= 80) return 'primary';
    if (puntaje >= 60) return 'accent';
    if (puntaje >= 40) return 'warn';
    return 'warn';
  }

  obtenerIconoParentesco(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'familiar': 'family_restroom',
      'amigo': 'people',
      'laboral': 'work',
      'otro': 'person'
    };
    return iconos[tipo] || 'person';
  }

  obtenerColorVerificacionGrupo(grupo: ReferenciaAgrupada): 'primary' | 'warn' {
    const verificadas = grupo.referencias.filter(r => r.estadoVerificacion === 'verificado').length;
    return verificadas > 0 ? 'primary' : 'warn';
  }

  obtenerTextoVerificacionGrupo(grupo: ReferenciaAgrupada): string {
    const verificadas = grupo.referencias.filter(r => r.estadoVerificacion === 'verificado').length;
    const sufijo = verificadas === 1 ? 'verificada' : 'verificadas';
    return `${verificadas} ${sufijo}`;
  }

  obtenerDescripcionRelacion(referencia: Referencia): string {
    if (!referencia.resultadoVerificacion) {
      return 'Sin verificar';
    }

    const resultado = referencia.resultadoVerificacion;
    const relaciones: { [key: string]: string } = {
      'muy_buena': 'Excelente relación',
      'buena': 'Buena relación',
      'regular': 'Relación regular',
      'mala': 'Mala relación'
    };

    return relaciones[resultado.relacion] || 'Relación no especificada';
  }

  // ======================================
  // ACCIONES DISPONIBLES
  // ======================================

  obtenerAccionesDisponibles(referencia: Referencia): AccionReferencia[] {
    const acciones: AccionReferencia[] = [];

    switch (referencia.estadoVerificacion) {
      case 'pendiente':
        acciones.push(
          {
            id: 'contactar',
            label: 'Contactar',
            icono: 'phone',
            color: 'primary',
            disponible: true
          },
          {
            id: 'marcar_no_contactado',
            label: 'Marcar como No Contactado',
            icono: 'phone_disabled',
            color: 'warn',
            disponible: true
          }
        );
        break;

      case 'contactado':
        acciones.push(
          {
            id: 'verificar',
            label: 'Completar Verificación',
            icono: 'verified',
            color: 'primary',
            disponible: true
          },
          {
            id: 'rechazar',
            label: 'Rechazar Referencia',
            icono: 'block',
            color: 'warn',
            disponible: true
          }
        );
        break;

      case 'no_contactado':
        acciones.push(
          {
            id: 'reintentar_contacto',
            label: 'Reintentar Contacto',
            icono: 'refresh',
            color: 'accent',
            disponible: true
          },
          {
            id: 'usar_alternativo',
            label: 'Usar Teléfono Alternativo',
            icono: 'phone_callback',
            color: 'primary',
            disponible: !!referencia.telefonoAlternativo
          }
        );
        break;

      case 'verificado':
        acciones.push(
          {
            id: 'ver_resultado',
            label: 'Ver Resultado Completo',
            icono: 'visibility',
            color: 'primary',
            disponible: true
          }
        );
        
        if (referencia.requiereReverificacion) {
          acciones.push({
            id: 'reverificar',
            label: 'Re-verificar',
            icono: 'update',
            color: 'accent',
            disponible: true
          });
        }
        break;

      case 'rechazado':
        acciones.push(
          {
            id: 'reactivar',
            label: 'Reactivar',
            icono: 'restore',
            color: 'accent',
            disponible: true
          }
        );
        break;
    }

    // Acciones generales disponibles para todas
    acciones.push(
      {
        id: 'editar_datos',
        label: 'Editar Datos',
        icono: 'edit',
        color: 'accent',
        disponible: true
      },
      {
        id: 'agregar_observacion',
        label: 'Agregar Observación',
        icono: 'note_add',
        color: 'primary',
        disponible: true
      }
    );

    return acciones;
  }

  ejecutarAccion(referencia: Referencia, accionId: string): void {
    // TODO: Implementar las acciones específicas
    switch (accionId) {
      case 'contactar':
        this.contactarReferencia(referencia);
        break;
      case 'verificar':
        this.verificarReferencia(referencia);
        break;
      case 'rechazar':
        this.rechazarReferencia(referencia);
        break;
      case 'reintentar_contacto':
        this.reintentarContacto(referencia);
        break;
      case 'ver_resultado':
        this.verResultadoCompleto(referencia);
        break;
      case 'editar_datos':
        this.editarDatosReferencia(referencia);
        break;
      case 'agregar_observacion':
        this.agregarObservacion(referencia);
        break;
      default:
        this.mostrarInfo(`Acción ${accionId} en desarrollo`);
    }
  }

  // ======================================
  // IMPLEMENTACIÓN DE ACCIONES
  // ======================================

  private contactarReferencia(referencia: Referencia): void {
    // TODO: Implementar contacto con referencia
    this.mostrarInfo(`Iniciando contacto con ${referencia.nombreCompleto}`);
  }

  private verificarReferencia(referencia: Referencia): void {
    // TODO: Implementar verificación de referencia
    this.mostrarInfo(`Iniciando verificación de ${referencia.nombreCompleto}`);
  }

  private rechazarReferencia(referencia: Referencia): void {
    // TODO: Implementar rechazo de referencia
    this.mostrarInfo(`Rechazando referencia de ${referencia.nombreCompleto}`);
  }

  private reintentarContacto(referencia: Referencia): void {
    // TODO: Implementar reintento de contacto
    this.mostrarInfo(`Reintentando contacto con ${referencia.nombreCompleto}`);
  }

  private verResultadoCompleto(referencia: Referencia): void {
    this.seleccionarReferencia(referencia);
    this.mostrarDetalleCompleto = true;
  }

  private editarDatosReferencia(referencia: Referencia): void {
    // TODO: Implementar edición de datos
    this.mostrarInfo(`Editando datos de ${referencia.nombreCompleto}`);
  }

  private agregarObservacion(referencia: Referencia): void {
    // TODO: Implementar agregar observación
    this.mostrarInfo(`Agregando observación para ${referencia.nombreCompleto}`);
  }

  // ======================================
  // ACCIONES GENERALES AMPLIADAS
  // ======================================

  agregarNuevaReferencia(): void {
    // TODO: Implementar agregar nueva referencia
    this.mostrarInfo('Funcionalidad de agregar referencia en desarrollo');
  }

  exportarReferencias(): void {
    try {
      // Crear datos para exportar
      const datosExportacion = this.referencias.map(ref => ({
        'Nombre Completo': ref.nombreCompleto,
        'Parentesco': ref.parentesco,
        'Teléfono': ref.telefono,
        'Teléfono Alternativo': ref.telefonoAlternativo || 'N/A',
        'Email': ref.email || 'N/A',
        'Estado Verificación': this.ESTADOS_REFERENCIA[ref.estadoVerificacion || 'pendiente'].label,
        'Ocupación': ref.ocupacion || 'N/A',
        'Fecha Contacto': ref.fechaContacto ? this.formatearFecha(ref.fechaContacto) : 'N/A',
        'Puntaje': ref.puntajeReferencia,
        'Es Confiable': ref.esReferenciaConfiable ? 'Sí' : 'No',
        'Conoce Titular': ref.resultadoVerificacion?.conoceTitular ? 'Sí' : 'No',
        'Recomendaría': ref.resultadoVerificacion?.recomendaria ? 'Sí' : 'No',
        'Confiabilidad': ref.resultadoVerificacion?.confiabilidad || 'N/A'
      }));

      // Convertir a CSV
      const headers = Object.keys(datosExportacion[0]);
      const csvContent = [
        headers.join(','),
        ...datosExportacion.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `referencias_${this.solicitudId}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.mostrarExito('Referencias exportadas exitosamente');
    } catch (error) {
      this.mostrarError('Error al exportar referencias');
    }
  }

  importarReferencias(): void {
    // TODO: Implementar importación desde Excel
    this.mostrarInfo('Importación desde Excel próximamente disponible');
  }

  enviarRecordatorios(): void {
    const pendientes = this.referencias.filter(r => 
      r.estadoVerificacion === 'pendiente' || r.estadoVerificacion === 'contactado'
    );
    
    if (pendientes.length > 0) {
      // TODO: Implementar envío real de recordatorios
      this.mostrarInfo(`Enviando recordatorios a ${pendientes.length} referencias pendientes`);
      
      // Simular envío de recordatorios
      pendientes.forEach(ref => {
        console.log(`Enviando recordatorio a ${ref.nombreCompleto} - ${ref.telefono}`);
      });
      
      this.mostrarExito(`Recordatorios enviados a ${pendientes.length} referencias`);
    } else {
      this.mostrarInfo('No hay referencias pendientes para enviar recordatorios');
    }
  }

  validarTodasReferencias(): void {
    if (this.referenciasPendientes.length === 0) {
      this.mostrarInfo('No hay referencias pendientes para validar');
      return;
    }

    // TODO: Implementar validación masiva
    this.mostrarInfo(`Iniciando validación masiva de ${this.referenciasPendientes.length} referencias`);
    
    // Simular proceso de validación
    setTimeout(() => {
      this.mostrarExito('Proceso de validación masiva iniciado. Recibirá notificaciones del progreso.');
    }, 1000);
  }

  generarReporteReferencias(): void {
    try {
      // Crear reporte detallado
      const reporte = {
        fechaGeneracion: new Date().toLocaleString('es-PE'),
        solicitudId: this.solicitudId,
        resumenGeneral: {
          totalReferencias: this.estadisticas.total,
          verificadas: this.estadisticas.verificadas,
          pendientes: this.estadisticas.pendientes,
          porcentajeCompletitud: this.calcularPorcentajeVerificacion(),
          scorePromedio: this.estadisticas.scorePromedio,
          cumpleRequisito: this.cumpleRequisitoMinimo()
        },
        detalleReferencias: this.referencias.map(ref => ({
          nombre: ref.nombreCompleto,
          estado: this.ESTADOS_REFERENCIA[ref.estadoVerificacion || 'pendiente'].label,
          puntaje: ref.puntajeReferencia,
          confiable: ref.esReferenciaConfiable,
          observaciones: ref.resultadoVerificacion?.observaciones || 'N/A'
        })),
        recomendaciones: this.generarRecomendaciones()
      };

      // Convertir a JSON y descargar
      const reporteJson = JSON.stringify(reporte, null, 2);
      const blob = new Blob([reporteJson], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_referencias_${this.solicitudId}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.mostrarExito('Reporte de referencias generado exitosamente');
    } catch (error) {
      this.mostrarError('Error al generar reporte de referencias');
    }
  }

  configurarRecordatorios(): void {
    // TODO: Implementar configuración de recordatorios automáticos
    this.mostrarInfo('Configuración de recordatorios automáticos en desarrollo');
  }

  verHistorialCompleto(): void {
    // TODO: Implementar vista de historial completo
    this.mostrarInfo('Vista de historial completo próximamente disponible');
  }

  ayudaReferencias(): void {
    // TODO: Implementar sistema de ayuda contextual
    const mensaje = `
Guía Rápida - Referencias Personales:

1. REQUISITOS MÍNIMOS:
   • Mínimo 2 referencias verificadas
   • Al menos 1 referencia familiar
   • Contacto válido y confirmado

2. PROCESO DE VERIFICACIÓN:
   • Contactar → Verificar → Aprobar
   • Documentar observaciones
   • Evaluar confiabilidad

3. ESTADOS DISPONIBLES:
   • Pendiente: Sin contactar
   • Contactado: En proceso
   • Verificado: Completado
   • No Contactado: Problemas
   • Rechazado: No cumple criterios

4. ACCIONES RÁPIDAS:
   • Clic en referencia para ver detalles
   • Menú contextual para acciones
   • Panel de alertas para problemas

¿Necesita más ayuda? Contacte al soporte técnico.
    `;

    this.mostrarInfo(mensaje);
  }

  // ======================================
  // MÉTODOS AUXILIARES PARA REPORTES
  // ======================================

  private generarRecomendaciones(): string[] {
    const recomendaciones: string[] = [];

    // Análisis de completitud
    if (this.estadisticas.verificadas < 2) {
      recomendaciones.push('Se requieren al menos 2 referencias verificadas para continuar con el proceso');
    }

    // Análisis de calidad
    if (this.estadisticas.scorePromedio < 60) {
      recomendaciones.push('El score promedio de referencias es bajo. Considere solicitar referencias adicionales');
    }

    // Análisis de problemas
    if (this.referenciasProblematicas.length > 0) {
      recomendaciones.push(`Hay ${this.referenciasProblematicas.length} referencias problemáticas que requieren atención`);
    }

    // Análisis de diversidad
    const tiposReferencias = [...new Set(this.referencias.map(r => r.tipoParentesco))];
    if (tiposReferencias.length < 2) {
      recomendaciones.push('Se recomienda tener referencias de diferentes tipos (familiar, laboral, personal)');
    }

    // Análisis de confiabilidad
    const referenciasConfiables = this.referenciasConfiables.length;
    if (referenciasConfiables < this.estadisticas.verificadas * 0.7) {
      recomendaciones.push('Menos del 70% de referencias verificadas son consideradas confiables');
    }

    // Si todo está bien
    if (recomendaciones.length === 0) {
      recomendaciones.push('Las referencias cumplen con todos los requisitos y estándares de calidad');
    }

    return recomendaciones;
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

  get tieneReferencias(): boolean {
    return this.referencias && this.referencias.length > 0;
  }

  get requisitoEstado() {
    return this.obtenerRequisitoEstado();
  }

  get referenciasConfiables(): Referencia[] {
    return this.referencias.filter(r => r.esReferenciaConfiable);
  }

  get referenciasPendientes(): Referencia[] {
    return this.referencias.filter(r => 
      r.estadoVerificacion === 'pendiente' || r.estadoVerificacion === 'contactado'
    );
  }

  get referenciasProblematicas(): Referencia[] {
    return this.referencias.filter(r => 
      r.estadoVerificacion === 'no_contactado' || 
      r.estadoVerificacion === 'rechazado' ||
      r.requiereReverificacion
    );
  }
}