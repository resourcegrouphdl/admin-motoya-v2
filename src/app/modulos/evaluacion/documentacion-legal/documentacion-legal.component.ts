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
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpedienteCompleto } from '../../admin-clientes/modelos/modelos-solicitudes';

interface DocumentoLegal {
  id: string;
  tipo: 'certificado_otoya' | 'contrato_credito' | 'pagare' | 'poliza_seguro' | 'cronograma_pagos' | 'acta_entrega';
  nombre: string;
  descripcion: string;
  estado: 'pendiente' | 'generando' | 'generado' | 'firmado' | 'archivado';
  fechaGeneracion?: Date;
  fechaVencimiento?: Date;
  urlDocumento?: string;
  requiereFirma: boolean;
  firmadoPor?: string[];
  observaciones?: string;
  version: number;
  esObligatorio: boolean;
  dependeDe?: string[];
}

interface ConfiguracionDocumento {
  incluirLogos: boolean;
  formatoPapel: 'A4' | 'Legal' | 'Carta';
  orientacion: 'portrait' | 'landscape';
  tipoFirma: 'digital' | 'manuscrita' | 'ambas';
  requiereNotarizacion: boolean;
  copias: number;
}

interface HistorialDocumento {
  fecha: Date;
  accion: string;
  usuario: string;
  observaciones?: string;
}



@Component({
  selector: 'app-documentacion-legal',
  standalone: true,
  imports: [CommonModule,
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
    MatStepperModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    ReactiveFormsModule],
  templateUrl: './documentacion-legal.component.html',
  styleUrl: './documentacion-legal.component.css'
})
export class DocumentacionLegalComponent implements OnInit, OnChanges{
@Input() expediente!: ExpedienteCompleto;

  // Formularios
  formularioConfiguracion!: FormGroup;
  formularioFirma!: FormGroup;

  // Datos procesados
  documentosLegales: DocumentoLegal[] = [];
  historialDocumentos: HistorialDocumento[] = [];
  configuracion: ConfiguracionDocumento = {
    incluirLogos: true,
    formatoPapel: 'A4',
    orientacion: 'portrait',
    tipoFirma: 'digital',
    requiereNotarizacion: false,
    copias: 3
  };

  // Estado de la UI
  seccionExpandida = 'documentos';
  documentoGenerando = '';
  mostrarConfiguracion = false;
  mostrarVistaPrevia = false;
  documentoSeleccionado: DocumentoLegal | null = null;

  // Progreso
  porcentajeCompletitud = 0;
  documentosGenerados = 0;
  documentosPendientes = 0;

  readonly TIPOS_DOCUMENTO = [
    {
      tipo: 'certificado_otoya',
      nombre: 'Certificado OTOYA',
      descripcion: 'Certificado de aprobación del crédito OTOYA',
      icono: 'verified',
      color: 'primary',
      prioridad: 1
    },
    {
      tipo: 'contrato_credito',
      nombre: 'Contrato de Crédito',
      descripcion: 'Contrato principal del financiamiento',
      icono: 'assignment',
      color: 'primary',
      prioridad: 2
    },
    {
      tipo: 'pagare',
      nombre: 'Pagaré',
      descripcion: 'Documento de garantía del pago',
      icono: 'receipt',
      color: 'accent',
      prioridad: 3
    },
    {
      tipo: 'cronograma_pagos',
      nombre: 'Cronograma de Pagos',
      descripcion: 'Detalle de cuotas y fechas de pago',
      icono: 'schedule',
      color: 'accent',
      prioridad: 4
    },
    {
      tipo: 'poliza_seguro',
      nombre: 'Póliza de Seguro',
      descripcion: 'Póliza de seguro del vehículo',
      icono: 'security',
      color: 'primary',
      prioridad: 5
    },
    {
      tipo: 'acta_entrega',
      nombre: 'Acta de Entrega',
      descripcion: 'Documento de entrega del vehículo',
      icono: 'handshake',
      color: 'accent',
      prioridad: 6
    }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.inicializarFormularios();
  }

  ngOnInit(): void {
    this.procesarDocumentacionLegal();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expediente'] && !changes['expediente'].firstChange) {
      this.procesarDocumentacionLegal();
    }
  }

  // ======================================
  // INICIALIZACIÓN
  // ======================================

  private inicializarFormularios(): void {
    this.formularioConfiguracion = this.formBuilder.group({
      incluirLogos: [true],
      formatoPapel: ['A4', [Validators.required]],
      orientacion: ['portrait', [Validators.required]],
      tipoFirma: ['digital', [Validators.required]],
      requiereNotarizacion: [false],
      copias: [3, [Validators.min(1), Validators.max(10)]]
    });

    this.formularioFirma = this.formBuilder.group({
      ubicacionFirma: ['', [Validators.required]],
      fechaFirma: [new Date(), [Validators.required]],
      testigos: [[]],
      observacionesFirma: ['']
    });
  }

  // ======================================
  // PROCESAMIENTO PRINCIPAL
  // ======================================

  private procesarDocumentacionLegal(): void {
    if (!this.expediente) return;

    this.inicializarDocumentosLegales();
    this.calcularProgreso();
    this.cargarHistorialDocumentos();
    this.verificarEstadoDocumentacion();
  }

  private inicializarDocumentosLegales(): void {
    const solicitud = this.expediente.solicitud;
    
    this.documentosLegales = this.TIPOS_DOCUMENTO.map(tipo => ({
      id: `${solicitud.id}_${tipo.tipo}`,
      tipo: tipo.tipo as any,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      estado: this.determinarEstadoInicial(tipo.tipo as any),
      requiereFirma: this.requiereFirmaDocumento(tipo.tipo as any),
      version: 1,
      esObligatorio: this.esDocumentoObligatorio(tipo.tipo as any),
      dependeDe: this.obtenerDependencias(tipo.tipo as any),
      fechaGeneracion: this.obtenerFechaGeneracion(tipo.tipo as any),
      urlDocumento: this.obtenerUrlExistente(tipo.tipo as any)
    }));

    // Ordenar por prioridad
    this.documentosLegales.sort((a, b) => {
      const prioridadA = this.TIPOS_DOCUMENTO.find(t => t.tipo === a.tipo)?.prioridad || 999;
      const prioridadB = this.TIPOS_DOCUMENTO.find(t => t.tipo === b.tipo)?.prioridad || 999;
      return prioridadA - prioridadB;
    });
  }

  private determinarEstadoInicial(tipo: string): 'pendiente' | 'generando' | 'generado' | 'firmado' | 'archivado' {
    const solicitud = this.expediente.solicitud;
    
    switch (tipo) {
      case 'certificado_otoya':
        return solicitud.certificadoGenerado ? 'generado' : 'pendiente';
      case 'contrato_credito':
        return solicitud.contratoGenerado ? 'firmado' : 'pendiente';
      default:
        return 'pendiente';
    }
  }

  private requiereFirmaDocumento(tipo: string): boolean {
    const documentosConFirma = ['contrato_credito', 'pagare', 'acta_entrega'];
    return documentosConFirma.includes(tipo);
  }

  private esDocumentoObligatorio(tipo: string): boolean {
    const obligatorios = ['certificado_otoya', 'contrato_credito', 'cronograma_pagos'];
    return obligatorios.includes(tipo);
  }

  private obtenerDependencias(tipo: string): string[] {
    const dependencias: { [key: string]: string[] } = {
      'contrato_credito': ['certificado_otoya'],
      'pagare': ['contrato_credito'],
      'cronograma_pagos': ['contrato_credito'],
      'poliza_seguro': ['contrato_credito'],
      'acta_entrega': ['contrato_credito', 'poliza_seguro']
    };
    
    return dependencias[tipo] || [];
  }

  private obtenerFechaGeneracion(tipo: string): Date | undefined {
    // Simular fechas existentes basadas en el estado de la solicitud
    if (tipo === 'certificado_otoya' && this.expediente.solicitud.certificadoGenerado) {
      return new Date(); // En producción, vendría de la base de datos
    }
    return undefined;
  }

  private obtenerUrlExistente(tipo: string): string | undefined {
    // En producción, estos URLs vendrían de la base de datos
    if (tipo === 'certificado_otoya' && this.expediente.solicitud.certificadoGenerado) {
      return this.expediente.solicitud.urlCertificado;
    }
    if (tipo === 'contrato_credito' && this.expediente.solicitud.contratoGenerado) {
      return this.expediente.solicitud.urlContrato;
    }
    return undefined;
  }

  private calcularProgreso(): void {
    const totalDocumentos = this.documentosLegales.filter(d => d.esObligatorio).length;
    this.documentosGenerados = this.documentosLegales.filter(
      d => d.esObligatorio && (d.estado === 'generado' || d.estado === 'firmado' || d.estado === 'archivado')
    ).length;
    this.documentosPendientes = totalDocumentos - this.documentosGenerados;
    this.porcentajeCompletitud = totalDocumentos > 0 ? Math.round((this.documentosGenerados / totalDocumentos) * 100) : 0;
  }

  private cargarHistorialDocumentos(): void {
    // En producción, esto vendría de la base de datos
    this.historialDocumentos = [
      {
        fecha: new Date(),
        accion: 'Módulo de documentación legal iniciado',
        usuario: 'Sistema'
      }
    ];

    if (this.expediente.solicitud.certificadoGenerado) {
      this.historialDocumentos.push({
        fecha: new Date(),
        accion: 'Certificado OTOYA generado',
        usuario: 'Sistema'
      });
    }
  }

  private verificarEstadoDocumentacion(): void {
    const solicitud = this.expediente.solicitud;
    
    // Verificar si puede generar documentos
    if (solicitud.estado !== 'aprobado' && solicitud.estado !== 'condicional' && solicitud.estado !== 'certificado_generado') {
      this.mostrarAdvertencia('La documentación legal solo está disponible para solicitudes aprobadas');
    }
  }

  // ======================================
  // GENERACIÓN DE DOCUMENTOS
  // ======================================

  async generarDocumento(documento: DocumentoLegal): Promise<void> {
    if (!this.puedeGenerarDocumento(documento)) {
      this.mostrarError(`No se puede generar ${documento.nombre}. Verifique las dependencias.`);
      return;
    }

    this.documentoGenerando = documento.id;
    documento.estado = 'generando';

    try {
      // Simular proceso de generación
      await this.procesarGeneracionDocumento(documento);
      
      documento.estado = 'generado';
      documento.fechaGeneracion = new Date();
      documento.urlDocumento = await this.generarUrlDocumento(documento);
      
      this.agregarHistorial(`${documento.nombre} generado exitosamente`);
      this.calcularProgreso();
      this.mostrarExito(`${documento.nombre} generado correctamente`);
      
    } catch (error) {
      documento.estado = 'pendiente';
      this.mostrarError(`Error al generar ${documento.nombre}`);
    } finally {
      this.documentoGenerando = '';
    }
  }

  private async procesarGeneracionDocumento(documento: DocumentoLegal): Promise<void> {
    // Simular tiempo de generación basado en complejidad del documento
    const tiempoGeneracion = this.obtenerTiempoGeneracion(documento.tipo);
    await new Promise(resolve => setTimeout(resolve, tiempoGeneracion));
    
    // Aquí iría la lógica real de generación del documento
    switch (documento.tipo) {
      case 'certificado_otoya':
        await this.generarCertificadoOtoya();
        break;
      case 'contrato_credito':
        await this.generarContratoCredito();
        break;
      case 'pagare':
        await this.generarPagare();
        break;
      case 'cronograma_pagos':
        await this.generarCronogramaPagos();
        break;
      case 'poliza_seguro':
        await this.generarPolizaSeguro();
        break;
      case 'acta_entrega':
        await this.generarActaEntrega();
        break;
    }
  }

  private obtenerTiempoGeneracion(tipo: string): number {
    const tiempos: { [key: string]: number } = {
      'certificado_otoya': 2000,
      'contrato_credito': 3000,
      'pagare': 1500,
      'cronograma_pagos': 1000,
      'poliza_seguro': 2500,
      'acta_entrega': 1500
    };
    return tiempos[tipo] || 2000;
  }

  private async generarUrlDocumento(documento: DocumentoLegal): Promise<string> {
    // En producción, esto generaría una URL real del documento
    return `https://documentos.otoya.com/${documento.tipo}/${this.expediente.solicitud.id}/${documento.version}`;
  }

  // ======================================
  // MÉTODOS DE GENERACIÓN ESPECÍFICOS
  // ======================================

  private async generarCertificadoOtoya(): Promise<void> {
    // Lógica específica para generar certificado OTOYA
    console.log('Generando Certificado OTOYA con datos:', {
      solicitudId: this.expediente.solicitud.id,
      cliente: this.expediente.titular.nombreCompleto,
      vehiculo: this.expediente.vehiculo.descripcionCompleta,
      monto: this.expediente.solicitud.montoAprobado || this.expediente.solicitud.precioCompraMoto
    });
  }

  private async generarContratoCredito(): Promise<void> {
    // Lógica específica para generar contrato de crédito
    console.log('Generando Contrato de Crédito con términos:', {
      monto: this.expediente.solicitud.montoAprobado || this.expediente.solicitud.precioCompraMoto,
      tasa: this.expediente.solicitud.tasaInteresAprobada || 18.5,
      plazo: this.expediente.solicitud.plazoQuincenas,
      condiciones: this.expediente.solicitud.condicionesEspeciales
    });
  }

  private async generarPagare(): Promise<void> {
    console.log('Generando Pagaré');
  }

  private async generarCronogramaPagos(): Promise<void> {
    console.log('Generando Cronograma de Pagos');
  }

  private async generarPolizaSeguro(): Promise<void> {
    console.log('Generando Póliza de Seguro');
  }

  private async generarActaEntrega(): Promise<void> {
    console.log('Generando Acta de Entrega');
  }

  // ======================================
  // VALIDACIONES
  // ======================================

  puedeGenerarDocumento(documento: DocumentoLegal): boolean {
    if (documento.estado !== 'pendiente') return false;
    if (!documento.dependeDe || documento.dependeDe.length === 0) return true;
    
    // Verificar que todas las dependencias estén cumplidas
    return documento.dependeDe.every(dep => {
      const docDependencia = this.documentosLegales.find(d => d.tipo === dep);
      return docDependencia && (docDependencia.estado === 'generado' || docDependencia.estado === 'firmado');
    });
  }

  requiereFirma(documento: DocumentoLegal): boolean {
    return documento.requiereFirma && documento.estado === 'generado';
  }

  // ======================================
  // ACCIONES DE DOCUMENTOS
  // ======================================

  descargarDocumento(documento: DocumentoLegal): void {
    if (!documento.urlDocumento) {
      this.mostrarError('El documento no está disponible para descarga');
      return;
    }

    // En producción, esto abriría el documento o iniciaría la descarga
    window.open(documento.urlDocumento, '_blank');
    this.agregarHistorial(`${documento.nombre} descargado`);
  }

  previsualizarDocumento(documento: DocumentoLegal): void {
    if (!documento.urlDocumento) {
      this.mostrarError('El documento no está disponible para previsualización');
      return;
    }

    this.documentoSeleccionado = documento;
    this.mostrarVistaPrevia = true;
  }

  enviarPorEmail(documento: DocumentoLegal): void {
    if (!documento.urlDocumento) {
      this.mostrarError('El documento no está disponible');
      return;
    }

    // En producción, esto abriría un diálogo para enviar por email
    this.mostrarInfo(`Preparando envío de ${documento.nombre} por email`);
    this.agregarHistorial(`${documento.nombre} enviado por email a ${this.expediente.titular.email}`);
  }

  regenerarDocumento(documento: DocumentoLegal): void {
    documento.version += 1;
    documento.estado = 'pendiente';
    documento.fechaGeneracion = undefined;
    documento.urlDocumento = undefined;
    
    this.agregarHistorial(`${documento.nombre} marcado para regeneración (v${documento.version})`);
    this.mostrarInfo(`${documento.nombre} listo para regenerar en versión ${documento.version}`);
  }

  // ======================================
  // PROCESO DE FIRMA
  // ======================================

  iniciarProcesoFirma(documento: DocumentoLegal): void {
    if (!this.requiereFirma(documento)) {
      this.mostrarError('Este documento no requiere firma');
      return;
    }

    // En producción, esto abriría un diálogo de firma digital
    this.documentoSeleccionado = documento;
    this.mostrarInfo(`Iniciando proceso de firma para ${documento.nombre}`);
  }

  confirmarFirma(documento: DocumentoLegal): void {
    documento.estado = 'firmado';
    documento.firmadoPor = [
      this.expediente.titular.nombreCompleto,
      'Representante OTOYA' // En producción, vendría del usuario actual
    ];
    
    this.agregarHistorial(`${documento.nombre} firmado exitosamente`);
    this.calcularProgreso();
    this.mostrarExito(`${documento.nombre} firmado correctamente`);
  }

  // ======================================
  // ACCIONES MASIVAS
  // ======================================

  generarTodosDocumentos(): void {
    const documentosPendientes = this.documentosLegales.filter(d => 
      d.esObligatorio && d.estado === 'pendiente' && this.puedeGenerarDocumento(d)
    );

    if (documentosPendientes.length === 0) {
      this.mostrarInfo('No hay documentos pendientes que se puedan generar');
      return;
    }

    // Generar documentos en secuencia
    this.generarDocumentosEnSecuencia(documentosPendientes);
  }

  private async generarDocumentosEnSecuencia(documentos: DocumentoLegal[]): Promise<void> {
    for (const documento of documentos) {
      await this.generarDocumento(documento);
      // Pausa entre generaciones para no sobrecargar el sistema
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.mostrarExito('Todos los documentos han sido generados');
  }

  exportarPaqueteCompleto(): void {
    const documentosGenerados = this.documentosLegales.filter(d => 
      d.estado === 'generado' || d.estado === 'firmado'
    );

    if (documentosGenerados.length === 0) {
      this.mostrarError('No hay documentos generados para exportar');
      return;
    }

    // En producción, esto crearía un ZIP con todos los documentos
    this.mostrarInfo(`Preparando paquete con ${documentosGenerados.length} documentos`);
    this.agregarHistorial('Paquete completo de documentos exportado');
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

  toggleConfiguracion(): void {
    this.mostrarConfiguracion = !this.mostrarConfiguracion;
  }

  cerrarVistaPrevia(): void {
    this.mostrarVistaPrevia = false;
    this.documentoSeleccionado = null;
  }

  // ======================================
  // MÉTODOS DE UTILIDAD
  // ======================================

  obtenerIconoDocumento(tipo: string): string {
    const tipoConfig = this.TIPOS_DOCUMENTO.find(t => t.tipo === tipo);
    return tipoConfig?.icono || 'description';
  }

  obtenerColorDocumento(tipo: string): string {
    const tipoConfig = this.TIPOS_DOCUMENTO.find(t => t.tipo === tipo);
    return tipoConfig?.color || 'primary';
  }

  obtenerColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'pendiente': 'accent',
      'generando': 'primary',
      'generado': 'primary',
      'firmado': 'primary',
      'archivado': 'primary'
    };
    return colores[estado] || 'accent';
  }

  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'No disponible';
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private agregarHistorial(accion: string, observaciones?: string): void {
    this.historialDocumentos.unshift({
      fecha: new Date(),
      accion,
      usuario: 'Usuario Actual', // En producción, vendría del servicio de autenticación
      observaciones
    });
  }

  // ======================================
  // CONTADORES PARA TEMPLATES
  // ======================================

  contarDocumentosPorEstado(estado: string): number {
    return this.documentosLegales.filter(documento => documento.estado === estado).length;
  }

  get totalDocumentosObligatorios(): number {
    return this.documentosLegales.filter(documento => documento.esObligatorio).length;
  }

  obtenerEstadoDependencia(dep: string): string {
    const documento = this.documentosLegales.find(d => d.tipo === dep);
    return documento?.estado || 'pendiente';
  }

  obtenerNombreDependencia(dep: string): string {
    const documento = this.documentosLegales.find(d => d.tipo === dep);
    return documento?.nombre || 'Documento no encontrado';
  }

  get fechaActual(): string {
    return new Date().toLocaleDateString('es-PE');
  }

  // ======================================
  // NOTIFICACIONES
  // ======================================

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

  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }

  private mostrarAdvertencia(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
  }
}