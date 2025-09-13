import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
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
import { MatDialogModule } from '@angular/material/dialog';
import { DocumentoProceso, EstadoDocumento, EstadoSolicitud, TipoDocumento } from '../../admin-clientes/modelos/modelos-solicitudes';

interface EstadisticasDocumentos {
  total: number;
  aprobados: number;
  pendientes: number;
  observados: number;
  rechazados: number;
  porcentajeCompletitud: number;
  tamanoTotalMB: number;
}

interface DocumentoAgrupado {
  categoria: string;
  label: string;
  documentos: DocumentoProceso[];
  icono: string;
  color: string;
  requerido: boolean;
  completitud: number;
}

interface AccionDocumento {
  id: string;
  label: string;
  icono: string;
  color: string;
  disponible: boolean;
  requiereArchivo?: boolean;
}

@Component({
  selector: 'app-documentos-proceso',
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
    MatDialogModule,
    NgIf,
  ],
  templateUrl: './documentos-proceso.component.html',
  styleUrl: './documentos-proceso.component.css'
})
export class DocumentosProcesoComponent implements OnInit, OnChanges{

  @Input() documentos!: DocumentoProceso[];
  @Input() solicitudId!: string;
  @Input() estado!: EstadoSolicitud;

  // Datos procesados
  estadisticas: EstadisticasDocumentos = this.inicializarEstadisticas();
  documentosAgrupados: DocumentoAgrupado[] = [];
  documentoSeleccionado: DocumentoProceso | null = null;
  
  // Estado de la UI
  seccionExpandida = 'resumen';
  mostrarVisorDocumento = false;
  cargandoArchivo = false;
  
  // Configuración de tipos de documentos
  readonly TIPOS_DOCUMENTOS = {
    // Documentos del titular
    selfie: { label: 'Selfie', categoria: 'titular', icono: 'face', requerido: true },
    dniFrente: { label: 'DNI Frente', categoria: 'titular', icono: 'credit_card', requerido: true },
    dniReverso: { label: 'DNI Reverso', categoria: 'titular', icono: 'credit_card', requerido: true },
    reciboServicio: { label: 'Recibo de Servicio', categoria: 'titular', icono: 'receipt', requerido: true },
    fachada: { label: 'Foto de Fachada', categoria: 'titular', icono: 'home', requerido: true },
    licenciaConducir: { label: 'Licencia de Conducir', categoria: 'titular', icono: 'drive_eta', requerido: false },
    constanciaTrabajo: { label: 'Constancia de Trabajo', categoria: 'titular', icono: 'work', requerido: false },
    recibosIngresos: { label: 'Recibos de Ingresos', categoria: 'titular', icono: 'payments', requerido: false },
    
    // Documentos del proceso
    voucherInicial: { label: 'Voucher Pago Inicial', categoria: 'proceso', icono: 'payment', requerido: false },
    contratoFirmado: { label: 'Contrato Firmado', categoria: 'proceso', icono: 'assignment', requerido: false },
    actaEntrega: { label: 'Acta de Entrega', categoria: 'proceso', icono: 'handshake', requerido: false }
  };

  readonly ESTADOS_DOCUMENTO = {
    pendiente: { label: 'Pendiente', color: 'accent', icono: 'schedule' },
    aprobado: { label: 'Aprobado', color: 'primary', icono: 'check_circle' },
    observado: { label: 'Observado', color: 'warn', icono: 'error' },
    rechazado: { label: 'Rechazado', color: 'warn', icono: 'cancel' }
  };

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.procesarDocumentos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['documentos'] || changes['estado']) && !changes['documentos']?.firstChange) {
      this.procesarDocumentos();
    }
  }

  // ======================================
  // PROCESAMIENTO DE DATOS
  // ======================================

  private procesarDocumentos(): void {
    this.calcularEstadisticas();
    this.agruparDocumentos();
  }

  private inicializarEstadisticas(): EstadisticasDocumentos {
    return {
      total: 0,
      aprobados: 0,
      pendientes: 0,
      observados: 0,
      rechazados: 0,
      porcentajeCompletitud: 0,
      tamanoTotalMB: 0
    };
  }

  private calcularEstadisticas(): void {
    if (!this.documentos || this.documentos.length === 0) {
      this.estadisticas = this.inicializarEstadisticas();
      return;
    }

    const total = this.documentos.length;
    const aprobados = this.documentos.filter(d => d.estado === 'aprobado').length;
    const pendientes = this.documentos.filter(d => d.estado === 'pendiente').length;
    const observados = this.documentos.filter(d => d.estado === 'observado').length;
    const rechazados = this.documentos.filter(d => d.estado === 'rechazado').length;

    const tamanoTotalBytes = this.documentos.reduce((sum, d) => sum + (d['tamaño'] || 0), 0);
    const tamanoTotalMB = Number((tamanoTotalBytes / (1024 * 1024)).toFixed(2));

    const porcentajeCompletitud = total > 0 ? Math.round((aprobados / total) * 100) : 0;

    this.estadisticas = {
      total,
      aprobados,
      pendientes,
      observados,
      rechazados,
      porcentajeCompletitud,
      tamanoTotalMB
    };
  }

  private agruparDocumentos(): void {
    const grupos: { [key: string]: DocumentoAgrupado } = {
      titular: {
        categoria: 'titular',
        label: 'Documentos del Titular',
        documentos: [],
        icono: 'person',
        color: 'primary',
        requerido: true,
        completitud: 0
      },
      fiador: {
        categoria: 'fiador',
        label: 'Documentos del Fiador',
        documentos: [],
        icono: 'supervisor_account',
        color: 'accent',
        requerido: true,
        completitud: 0
      },
      proceso: {
        categoria: 'proceso',
        label: 'Documentos del Proceso',
        documentos: [],
        icono: 'description',
        color: 'primary',
        requerido: false,
        completitud: 0
      }
    };

    // Agrupar documentos existentes
    this.documentos.forEach(documento => {
      const tipoInfo = this.TIPOS_DOCUMENTOS[documento.tipoDocumento as keyof typeof this.TIPOS_DOCUMENTOS];
      if (tipoInfo) {
        const categoria = tipoInfo.categoria;
        if (grupos[categoria]) {
          grupos[categoria].documentos.push(documento);
        }
      }
    });

    // Calcular completitud por grupo
    Object.values(grupos).forEach(grupo => {
      if (grupo.documentos.length > 0) {
        const aprobados = grupo.documentos.filter(d => d.estado === 'aprobado').length;
        grupo.completitud = Math.round((aprobados / grupo.documentos.length) * 100);
      }
    });

    // Filtrar grupos que tienen documentos o son requeridos según el estado
    this.documentosAgrupados = Object.values(grupos)
      .filter(grupo => grupo.documentos.length > 0 || this.esGrupoRequeridoParaEstado(grupo.categoria))
      .sort((a, b) => {
        // Titular primero, luego fiador, luego proceso
        const orden = { titular: 1, fiador: 2, proceso: 3 };
        return orden[a.categoria as keyof typeof orden] - orden[b.categoria as keyof typeof orden];
      });
  }

  private esGrupoRequeridoParaEstado(categoria: string): boolean {
    const estadosQueRequierenDocumentos: EstadoSolicitud[] = [
      'evaluacion_documental', 'documentos_observados', 'evaluacion_garantes',
      'entrevista_programada', 'en_entrevista', 'entrevista_completada',
      'en_decision', 'aprobado', 'condicional'
    ];

    return estadosQueRequierenDocumentos.includes(this.estado) && categoria !== 'proceso';
  }

  // ======================================
  // MÉTODOS DE VALIDACIÓN Y CÁLCULO
  // ======================================

  obtenerDocumentosRequeridos(): TipoDocumento[] {
    const documentosBase: TipoDocumento[] = ['selfie', 'dniFrente', 'dniReverso', 'reciboServicio', 'fachada'];
    
    // Agregar documentos adicionales según el estado del proceso
    const estadosAvanzados: EstadoSolicitud[] = [
      'aprobado', 'condicional', 'certificado_generado', 'esperando_inicial',
      'inicial_confirmada', 'contrato_firmado', 'entrega_completada'
    ];

    if (estadosAvanzados.includes(this.estado)) {
      return [...documentosBase, 'voucherInicial', 'contratoFirmado'];
    }

    return documentosBase;
  }

  obtenerDocumentosFaltantes(): TipoDocumento[] {
    const requeridos = this.obtenerDocumentosRequeridos();
    const existentes = this.documentos.map(d => d.tipoDocumento);
    return requeridos.filter(tipo => !existentes.includes(tipo));
  }

  cumpleRequisitosMínimos(): boolean {
    const documentosRequeridos = this.obtenerDocumentosRequeridos();
    const documentosAprobados = this.documentos
      .filter(d => d.estado === 'aprobado')
      .map(d => d.tipoDocumento);

    const documentosBasicosRequeridos: TipoDocumento[] = ['selfie', 'dniFrente', 'dniReverso'];
    return documentosBasicosRequeridos.every(tipo => documentosAprobados.includes(tipo));
  }

  obtenerEstadoValidacion(): { estado: 'completo' | 'incompleto' | 'observado'; mensaje: string; color: string } {
    const faltantes = this.obtenerDocumentosFaltantes();
    const observados = this.documentos.filter(d => d.estado === 'observado');
    const rechazados = this.documentos.filter(d => d.estado === 'rechazado');

    if (rechazados.length > 0) {
      return {
        estado: 'observado',
        mensaje: `${rechazados.length} documentos rechazados requieren atención`,
        color: 'warn'
      };
    }

    if (observados.length > 0) {
      return {
        estado: 'observado',
        mensaje: `${observados.length} documentos observados requieren corrección`,
        color: 'warn'
      };
    }

    if (faltantes.length > 0) {
      return {
        estado: 'incompleto',
        mensaje: `Faltan ${faltantes.length} documentos requeridos`,
        color: 'accent'
      };
    }

    if (this.cumpleRequisitosMínimos()) {
      return {
        estado: 'completo',
        mensaje: 'Documentación completa y aprobada',
        color: 'primary'
      };
    }

    return {
      estado: 'incompleto',
      mensaje: 'Documentación incompleta',
      color: 'accent'
    };
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

  seleccionarDocumento(documento: DocumentoProceso): void {
    this.documentoSeleccionado = this.documentoSeleccionado?.id === documento.id 
      ? null 
      : documento;
  }

  formatearTamano(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  obtenerIconoTipoDocumento(tipo: TipoDocumento): string {
    return this.TIPOS_DOCUMENTOS[tipo]?.icono || 'description';
  }

  obtenerNombreTipoDocumento(tipo: TipoDocumento): string {
    return this.TIPOS_DOCUMENTOS[tipo]?.label || tipo;
  }

  obtenerColorEstado(estado: EstadoDocumento): 'primary' | 'accent' | 'warn' {
    return this.ESTADOS_DOCUMENTO[estado]?.color as 'primary' | 'accent' | 'warn' || 'accent';
  }

  esDocumentoImagen(documento: DocumentoProceso): boolean {
    const extensionesImagen = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return extensionesImagen.some(ext => 
      documento.nombreArchivo.toLowerCase().endsWith(ext)
    );
  }

  esDocumentoPDF(documento: DocumentoProceso): boolean {
    return documento.nombreArchivo.toLowerCase().endsWith('.pdf');
  }

  // ======================================
  // ACCIONES DISPONIBLES
  // ======================================

  obtenerAccionesDisponibles(documento: DocumentoProceso): AccionDocumento[] {
    const acciones: AccionDocumento[] = [];

    // Acción: Ver/Descargar documento
    acciones.push({
      id: 'ver_documento',
      label: 'Ver Documento',
      icono: 'visibility',
      color: 'primary',
      disponible: true
    });

    acciones.push({
      id: 'descargar',
      label: 'Descargar',
      icono: 'download',
      color: 'primary',
      disponible: true
    });

    // Acciones según estado
    switch (documento.estado) {
      case 'pendiente':
        acciones.push(
          {
            id: 'aprobar',
            label: 'Aprobar',
            icono: 'check_circle',
            color: 'primary',
            disponible: this.puedeAprobarDocumentos()
          },
          {
            id: 'observar',
            label: 'Observar',
            icono: 'error',
            color: 'warn',
            disponible: this.puedeAprobarDocumentos()
          },
          {
            id: 'rechazar',
            label: 'Rechazar',
            icono: 'cancel',
            color: 'warn',
            disponible: this.puedeAprobarDocumentos()
          }
        );
        break;

      case 'observado':
        acciones.push(
          {
            id: 'reemplazar',
            label: 'Reemplazar Documento',
            icono: 'file_upload',
            color: 'accent',
            disponible: true,
            requiereArchivo: true
          },
          {
            id: 'aprobar_correccion',
            label: 'Aprobar Corrección',
            icono: 'check_circle',
            color: 'primary',
            disponible: this.puedeAprobarDocumentos()
          }
        );
        break;

      case 'rechazado':
        acciones.push({
          id: 'subir_nuevo',
          label: 'Subir Nuevo Documento',
          icono: 'file_upload',
          color: 'primary',
          disponible: true,
          requiereArchivo: true
        });
        break;

      case 'aprobado':
        acciones.push({
          id: 'rever_aprobacion',
          label: 'Revertir Aprobación',
          icono: 'undo',
          color: 'accent',
          disponible: this.puedeAprobarDocumentos()
        });
        break;
    }

    // Acciones generales
    acciones.push(
      {
        id: 'agregar_observacion',
        label: 'Agregar Observación',
        icono: 'note_add',
        color: 'accent',
        disponible: true
      },
      {
        id: 'ver_historial',
        label: 'Ver Historial',
        icono: 'history',
        color: 'primary',
        disponible: true
      }
    );

    return acciones;
  }

  private puedeAprobarDocumentos(): boolean {
    // Verificar si el usuario tiene permisos y el estado permite aprobación
    const estadosPermitidos: EstadoSolicitud[] = [
      'evaluacion_documental', 'documentos_observados', 'evaluacion_garantes'
    ];
    return estadosPermitidos.includes(this.estado);
  }

  // Método público para el template
  public puedeAprobarDocumentosPublico(): boolean {
    return this.puedeAprobarDocumentos();
  }

  ejecutarAccion(documento: DocumentoProceso, accionId: string): void {
    switch (accionId) {
      case 'ver_documento':
        this.verDocumento(documento);
        break;
      case 'descargar':
        this.descargarDocumento(documento);
        break;
      case 'aprobar':
        this.aprobarDocumento(documento);
        break;
      case 'observar':
        this.observarDocumento(documento);
        break;
      case 'rechazar':
        this.rechazarDocumento(documento);
        break;
      case 'reemplazar':
        this.reemplazarDocumento(documento);
        break;
      case 'subir_nuevo':
        this.subirNuevoDocumento(documento.tipoDocumento);
        break;
      case 'aprobar_correccion':
        this.aprobarCorreccion(documento);
        break;
      case 'rever_aprobacion':
        this.revertirAprobacion(documento);
        break;
      case 'agregar_observacion':
        this.agregarObservacion(documento);
        break;
      case 'ver_historial':
        this.verHistorialDocumento(documento);
        break;
      default:
        this.mostrarInfo(`Acción ${accionId} en desarrollo`);
    }
  }

  // ======================================
  // IMPLEMENTACIÓN DE ACCIONES
  // ======================================

   verDocumento(documento: DocumentoProceso): void {
    this.documentoSeleccionado = documento;
    this.mostrarVisorDocumento = true;
  }

   descargarDocumento(documento: DocumentoProceso): void {
    if (documento.urlArchivo) {
      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = documento.urlArchivo;
      link.download = documento.nombreArchivo;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.mostrarExito(`Descargando ${documento.nombreArchivo}`);
    } else {
      this.mostrarError('URL del documento no disponible');
    }
  }

   aprobarDocumento(documento: DocumentoProceso): void {
    // TODO: Implementar aprobación real
    this.mostrarExito(`Documento ${documento.nombreArchivo} aprobado`);
  }

   observarDocumento(documento: DocumentoProceso): void {
    // TODO: Implementar observación con motivos
    this.mostrarInfo(`Agregando observaciones a ${documento.nombreArchivo}`);
  }

   rechazarDocumento(documento: DocumentoProceso): void {
    // TODO: Implementar rechazo con motivos
    this.mostrarInfo(`Rechazando documento ${documento.nombreArchivo}`);
  }

   reemplazarDocumento(documento: DocumentoProceso): void {
    // TODO: Implementar reemplazo de documento
    this.mostrarInfo(`Iniciando reemplazo de ${documento.nombreArchivo}`);
  }

   subirNuevoDocumento(tipo: TipoDocumento): void {
    // TODO: Implementar subida de nuevo documento
    this.mostrarInfo(`Subiendo nuevo documento de tipo ${this.obtenerNombreTipoDocumento(tipo)}`);
  }

   aprobarCorreccion(documento: DocumentoProceso): void {
    // TODO: Implementar aprobación de corrección
    this.mostrarExito(`Corrección aprobada para ${documento.nombreArchivo}`);
  }

   revertirAprobacion(documento: DocumentoProceso): void {
    // TODO: Implementar reversión de aprobación
    this.mostrarInfo(`Revirtiendo aprobación de ${documento.nombreArchivo}`);
  }

   agregarObservacion(documento: DocumentoProceso): void {
    // TODO: Implementar agregar observación
    this.mostrarInfo(`Agregando observación para ${documento.nombreArchivo}`);
  }

  private verHistorialDocumento(documento: DocumentoProceso): void {
    // TODO: Implementar vista de historial
    this.mostrarInfo(`Mostrando historial de ${documento.nombreArchivo}`);
  }

  // ======================================
  // ACCIONES GENERALES
  // ======================================

  subirDocumento(): void {
    // TODO: Implementar subida masiva de documentos
    this.mostrarInfo('Funcionalidad de subida de documentos en desarrollo');
  }

  validarTodosDocumentos(): void {
    if (this.estadisticas.pendientes === 0) {
      this.mostrarInfo('No hay documentos pendientes para validar');
      return;
    }

    // TODO: Implementar validación masiva
    this.mostrarInfo(`Iniciando validación de ${this.estadisticas.pendientes} documentos pendientes`);
  }

  exportarDocumentos(): void {
    // TODO: Implementar exportación de lista de documentos
    this.mostrarInfo('Exportación de documentos en desarrollo');
  }

  generarReporteDocumentos(): void {
    // TODO: Implementar generación de reporte
    this.mostrarInfo('Generación de reporte de documentos en desarrollo');
  }

  cerrarVisorDocumento(): void {
    this.mostrarVisorDocumento = false;
    this.documentoSeleccionado = null;
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

  get tieneDocumentos(): boolean {
    return this.documentos && this.documentos.length > 0;
  }

  get estadoValidacion() {
    return this.obtenerEstadoValidacion();
  }

  get documentosPendientes(): DocumentoProceso[] {
    return this.documentos.filter(d => d.estado === 'pendiente');
  }

  get documentosObservados(): DocumentoProceso[] {
    return this.documentos.filter(d => d.estado === 'observado');
  }

  get documentosRechazados(): DocumentoProceso[] {
    return this.documentos.filter(d => d.estado === 'rechazado');
  }

  get documentosProblematicos(): DocumentoProceso[] {
    return [...this.documentosObservados, ...this.documentosRechazados];
  }
}