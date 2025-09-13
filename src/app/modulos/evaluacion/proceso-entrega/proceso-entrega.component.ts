import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
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

interface ProgramacionEntrega {
  fechaEntrega: Date;
  horaEntrega: string;
  lugarEntrega: string;
  tipoEntrega: 'tienda' | 'domicilio' | 'punto_encuentro';
  responsableEntrega: string;
  contactoResponsable: string;
  instruccionesEspeciales?: string;
  requiereTransporte: boolean;
  costoTransporte?: number;
}

interface ChecklistEntrega {
  id: string;
  categoria: 'documentos' | 'vehiculo' | 'accesorios' | 'seguridad' | 'entrega';
  item: string;
  descripcion: string;
  esObligatorio: boolean;
  completado: boolean;
  fechaVerificacion?: Date;
  verificadoPor?: string;
  observaciones?: string;
}

interface PersonaEntrega {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  parentesco: string;
  telefono: string;
  autorizadoPor: string;
  fechaAutorizacion: Date;
}

interface HistorialEntrega {
  fecha: Date;
  evento: string;
  usuario: string;
  observaciones?: string;
  ubicacion?: string;
}

interface DocumentoEntrega {
  tipo: 'acta_entrega' | 'lista_verificacion' | 'autorizacion_tercero' | 'comprobante_entrega';
  nombre: string;
  generado: boolean;
  fechaGeneracion?: Date;
  urlDocumento?: string;
}
@Component({
  selector: 'app-proceso-entrega',
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
    MatStepperModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    NgFor
  ],
  templateUrl: './proceso-entrega.component.html',
  styleUrl: './proceso-entrega.component.css'
})
export class ProcesoEntregaComponent implements OnInit, OnChanges {

  @Input() expediente!: ExpedienteCompleto;

  // Formularios
  formularioProgramacion!: FormGroup;
  formularioEntrega!: FormGroup;
  formularioPersonaEntrega!: FormGroup;

  // Datos procesados
  programacionEntrega: ProgramacionEntrega | null = null;
  checklistEntrega: ChecklistEntrega[] = [];
  personaEntrega: PersonaEntrega | null = null;
  historialEntrega: HistorialEntrega[] = [];
  documentosEntrega: DocumentoEntrega[] = [];

  // Estado de la UI
  seccionExpandida = 'programacion';
  procesoCompletado = false;
  entregaEnProceso = false;
  mostrarFormularioEntrega = false;

  // Progreso
  porcentajeCompletitud = 0;
  itemsCompletados = 0;
  itemsPendientes = 0;

  // Configuración
  readonly LUGARES_ENTREGA = [
    { value: 'tienda_principal', label: 'Tienda Principal - Jr. Lima 123', tipo: 'tienda' },
    { value: 'tienda_secundaria', label: 'Tienda Secundaria - Av. Tacna 456', tipo: 'tienda' },
    { value: 'domicilio_cliente', label: 'Domicilio del Cliente', tipo: 'domicilio' },
    { value: 'punto_encuentro', label: 'Punto de Encuentro', tipo: 'punto_encuentro' }
  ];

  readonly RESPONSABLES_ENTREGA = [
    { id: 'resp001', nombre: 'Carlos Mendoza', cargo: 'Supervisor de Entregas', telefono: '987654321' },
    { id: 'resp002', nombre: 'Ana Rodriguez', cargo: 'Coordinadora de Logística', telefono: '987654322' },
    { id: 'resp003', nombre: 'Luis Vargas', cargo: 'Encargado de Tienda', telefono: '987654323' }
  ];

  readonly HORARIOS_ENTREGA = [
    '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.inicializarFormularios();
  }

  ngOnInit(): void {
    this.procesarEntrega();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expediente'] && !changes['expediente'].firstChange) {
      this.procesarEntrega();
    }
  }

  // ======================================
  // INICIALIZACIÓN
  // ======================================

  private inicializarFormularios(): void {
    this.formularioProgramacion = this.formBuilder.group({
      fechaEntrega: ['', [Validators.required]],
      horaEntrega: ['', [Validators.required]],
      lugarEntrega: ['', [Validators.required]],
      responsableEntrega: ['', [Validators.required]],
      instruccionesEspeciales: [''],
      requiereTransporte: [false],
      costoTransporte: [0]
    });

    this.formularioEntrega = this.formBuilder.group({
      kilometraje: ['', [Validators.required, Validators.min(0)]],
      nivelCombustible: ['', [Validators.required]],
      estadoGeneral: ['', [Validators.required]],
      accesoriosEntregados: [[]],
      documentosEntregados: [[]],
      observacionesEntrega: [''],
      clienteSatisfecho: [false, [Validators.requiredTrue]],
      firmaCliente: ['', [Validators.required]]
    });

    this.formularioPersonaEntrega = this.formBuilder.group({
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      tipoDocumento: ['DNI', [Validators.required]],
      numeroDocumento: ['', [Validators.required]],
      parentesco: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      autorizadoPor: [''],
      fechaAutorizacion: [new Date()]
    });

    // Suscribirse a cambios
    this.formularioProgramacion.get('requiereTransporte')?.valueChanges.subscribe(requiere => {
      const costoControl = this.formularioProgramacion.get('costoTransporte');
      if (requiere) {
        costoControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        costoControl?.clearValidators();
        costoControl?.setValue(0);
      }
      costoControl?.updateValueAndValidity();
    });
  }

  // ======================================
  // PROCESAMIENTO PRINCIPAL
  // ======================================

  private procesarEntrega(): void {
    if (!this.expediente) return;

    this.verificarEstadoProceso();
    this.cargarDatosExistentes();
    this.inicializarChecklist();
    this.calcularProgreso();
    this.cargarHistorial();
    this.inicializarDocumentosEntrega();
  }

  private verificarEstadoProceso(): void {
    const solicitud = this.expediente.solicitud;
    
    // Verificar si puede proceder con la entrega
    const estadosPermitidos = ['contrato_firmado', 'entrega_completada'];
    
    if (!estadosPermitidos.includes(solicitud.estado)) {
      this.mostrarAdvertencia('El proceso de entrega solo está disponible después de firmar el contrato');
      return;
    }

    this.procesoCompletado = solicitud.estado === 'entrega_completada';
    this.entregaEnProceso = solicitud.estado === 'contrato_firmado';
  }

  private cargarDatosExistentes(): void {
    const solicitud = this.expediente.solicitud;
    
    // Cargar programación existente
    if (solicitud.fechaEntregaProgramada) {
      this.programacionEntrega = {
        fechaEntrega: solicitud.fechaEntregaProgramada,
        horaEntrega: solicitud.fechaEntregaProgramada.toTimeString().slice(0, 5),
        lugarEntrega: solicitud.lugarEntrega || '',
        tipoEntrega: this.determinarTipoEntrega(solicitud.lugarEntrega),
        responsableEntrega: solicitud.responsableEntrega || '',
        contactoResponsable: '',
        requiereTransporte: false
      };

      // Cargar datos en el formulario
      this.formularioProgramacion.patchValue({
        fechaEntrega: solicitud.fechaEntregaProgramada,
        horaEntrega: this.programacionEntrega.horaEntrega,
        lugarEntrega: solicitud.lugarEntrega,
        responsableEntrega: solicitud.responsableEntrega
      });
    }

    // Verificar si ya fue entregado
    if (solicitud.entregaCompletada && solicitud.fechaEntregaReal) {
      this.procesoCompletado = true;
    }
  }

  private determinarTipoEntrega(lugar?: string): 'tienda' | 'domicilio' | 'punto_encuentro' {
    if (!lugar) return 'tienda';
    if (lugar.includes('domicilio')) return 'domicilio';
    if (lugar.includes('punto')) return 'punto_encuentro';
    return 'tienda';
  }

  private inicializarChecklist(): void {
    this.checklistEntrega = [
      // Documentos
      {
        id: 'doc_contrato',
        categoria: 'documentos',
        item: 'Contrato de Crédito Original',
        descripcion: 'Entrega del contrato firmado al cliente',
        esObligatorio: true,
        completado: false
      },
      {
        id: 'doc_pagare',
        categoria: 'documentos',
        item: 'Pagaré Firmado',
        descripcion: 'Documento de garantía del crédito',
        esObligatorio: true,
        completado: false
      },
      {
        id: 'doc_cronograma',
        categoria: 'documentos',
        item: 'Cronograma de Pagos',
        descripcion: 'Calendario detallado de cuotas',
        esObligatorio: true,
        completado: false
      },
      {
        id: 'doc_poliza',
        categoria: 'documentos',
        item: 'Póliza de Seguro',
        descripcion: 'Documento del seguro vehicular',
        esObligatorio: true,
        completado: false
      },

      // Vehículo
      {
        id: 'veh_inspeccion',
        categoria: 'vehiculo',
        item: 'Inspección General del Vehículo',
        descripcion: 'Verificación de estado general y funcionamiento',
        esObligatorio: true,
        completado: false
      },
      {
        id: 'veh_combustible',
        categoria: 'vehiculo',
        item: 'Nivel de Combustible',
        descripcion: 'Entregar con tanque lleno',
        esObligatorio: true,
        completado: false
      },
      {
        id: 'veh_limpieza',
        categoria: 'vehiculo',
        item: 'Limpieza del Vehículo',
        descripcion: 'Vehículo limpio y presentable',
        esObligatorio: true,
        completado: false
      },

      // Accesorios
      {
        id: 'acc_llaves',
        categoria: 'accesorios',
        item: 'Juego de Llaves',
        descripcion: 'Entrega de llaves principales y repuesto',
        esObligatorio: true,
        completado: false
      },
      {
        id: 'acc_manual',
        categoria: 'accesorios',
        item: 'Manual del Usuario',
        descripcion: 'Manual de operación y mantenimiento',
        esObligatorio: true,
        completado: false
      },
      {
        id: 'acc_herramientas',
        categoria: 'accesorios',
        item: 'Kit de Herramientas',
        descripcion: 'Herramientas básicas de emergencia',
        esObligatorio: false,
        completado: false
      },

      // Seguridad
      {
        id: 'seg_casco',
        categoria: 'seguridad',
        item: 'Casco de Seguridad',
        descripcion: 'Casco homologado incluido',
        esObligatorio: true,
        completado: false
      },
      {
        id: 'seg_chaleco',
        categoria: 'seguridad',
        item: 'Chaleco Reflectivo',
        descripcion: 'Chaleco de seguridad vial',
        esObligatorio: false,
        completado: false
      },

      // Entrega
      {
        id: 'ent_explicacion',
        categoria: 'entrega',
        item: 'Explicación de Funcionamiento',
        descripcion: 'Instruir al cliente sobre el uso del vehículo',
        esObligatorio: true,
        completado: false
      },
      {
        id: 'ent_contacto',
        categoria: 'entrega',
        item: 'Información de Contacto',
        descripcion: 'Proporcionar datos de soporte post-venta',
        esObligatorio: true,
        completado: false
      },
      {
        id: 'ent_satisfaccion',
        categoria: 'entrega',
        item: 'Confirmación de Satisfacción',
        descripcion: 'Cliente confirma satisfacción con la entrega',
        esObligatorio: true,
        completado: false
      }
    ];

    // Cargar estado si ya existe información
    this.cargarEstadoChecklist();
  }

  private cargarEstadoChecklist(): void {
    // En producción, esto cargaría el estado real desde la base de datos
    if (this.procesoCompletado) {
      this.checklistEntrega.forEach(item => {
        item.completado = true;
        item.fechaVerificacion = new Date();
        item.verificadoPor = 'Sistema';
      });
    }
  }

  private calcularProgreso(): void {
    this.itemsCompletados = this.checklistEntrega.filter(item => item.completado).length;
    this.itemsPendientes = this.checklistEntrega.filter(item => !item.completado).length;
    this.porcentajeCompletitud = this.checklistEntrega.length > 0 
      ? Math.round((this.itemsCompletados / this.checklistEntrega.length) * 100) 
      : 0;
  }

  private cargarHistorial(): void {
    this.historialEntrega = [
      {
        fecha: new Date(),
        evento: 'Módulo de entrega iniciado',
        usuario: 'Sistema'
      }
    ];

    if (this.programacionEntrega) {
      this.historialEntrega.push({
        fecha: new Date(),
        evento: `Entrega programada para ${this.formatearFecha(this.programacionEntrega.fechaEntrega)}`,
        usuario: 'Sistema',
        ubicacion: this.programacionEntrega.lugarEntrega
      });
    }

    if (this.procesoCompletado) {
      this.historialEntrega.push({
        fecha: this.expediente.solicitud.fechaEntregaReal || new Date(),
        evento: 'Entrega completada exitosamente',
        usuario: 'Sistema'
      });
    }
  }

  private inicializarDocumentosEntrega(): void {
    this.documentosEntrega = [
      {
        tipo: 'acta_entrega',
        nombre: 'Acta de Entrega',
        generado: false
      },
      {
        tipo: 'lista_verificacion',
        nombre: 'Lista de Verificación',
        generado: false
      },
      {
        tipo: 'comprobante_entrega',
        nombre: 'Comprobante de Entrega',
        generado: false
      }
    ];
  }

  // ======================================
  // PROGRAMACIÓN DE ENTREGA
  // ======================================

  async programarEntrega(): Promise<void> {
    if (this.formularioProgramacion.invalid) {
      this.marcarCamposInvalidos(this.formularioProgramacion);
      this.mostrarError('Complete todos los campos requeridos para programar la entrega');
      return;
    }

    const formData = this.formularioProgramacion.value;
    
    try {
      const responsable = this.RESPONSABLES_ENTREGA.find(r => r.id === formData.responsableEntrega);
      
      this.programacionEntrega = {
        fechaEntrega: formData.fechaEntrega,
        horaEntrega: formData.horaEntrega,
        lugarEntrega: formData.lugarEntrega,
        tipoEntrega: this.determinarTipoEntrega(formData.lugarEntrega),
        responsableEntrega: responsable?.nombre || '',
        contactoResponsable: responsable?.telefono || '',
        instruccionesEspeciales: formData.instruccionesEspeciales,
        requiereTransporte: formData.requiereTransporte,
        costoTransporte: formData.costoTransporte
      };

      // TODO: Guardar en base de datos
      await this.guardarProgramacion();
      
      this.agregarHistorial('Entrega programada exitosamente');
      this.mostrarExito('Entrega programada correctamente');
      
      // Enviar notificaciones
      await this.enviarNotificacionesProgramacion();
      
    } catch (error) {
      this.mostrarError('Error al programar la entrega');
    }
  }

  private async guardarProgramacion(): Promise<void> {
    // TODO: Implementar guardado en Firebase
    console.log('Guardando programación:', this.programacionEntrega);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async enviarNotificacionesProgramacion(): Promise<void> {
    if (!this.programacionEntrega) return;
    
    // Notificar al cliente
    await this.enviarNotificacionCliente();
    
    // Notificar al responsable de entrega
    await this.enviarNotificacionResponsable();
    
    this.agregarHistorial('Notificaciones de programación enviadas');
  }

  private async enviarNotificacionCliente(): Promise<void> {
    // TODO: Implementar envío real de notificación
    console.log('Enviando notificación al cliente:', this.expediente.titular.email);
  }

  private async enviarNotificacionResponsable(): Promise<void> {
    // TODO: Implementar envío real de notificación
    console.log('Enviando notificación al responsable');
  }

  // ======================================
  // PROCESO DE ENTREGA
  // ======================================

  iniciarProcesEntrega(): void {
    this.mostrarFormularioEntrega = true;
    this.entregaEnProceso = true;
    this.agregarHistorial('Proceso de entrega iniciado');
  }

  completarItemChecklist(item: ChecklistEntrega): void {
    item.completado = !item.completado;
    item.fechaVerificacion = item.completado ? new Date() : undefined;
    item.verificadoPor = item.completado ? 'Usuario Actual' : undefined; // TODO: obtener usuario real
    
    this.calcularProgreso();
    
    const accion = item.completado ? 'completado' : 'marcado como pendiente';
    this.agregarHistorial(`Item "${item.item}" ${accion}`);
  }

  async confirmarEntrega(): Promise<void> {
    if (!this.validarEntregaCompleta()) {
      this.mostrarError('Complete todos los items obligatorios antes de confirmar la entrega');
      return;
    }

    if (this.formularioEntrega.invalid) {
      this.marcarCamposInvalidos(this.formularioEntrega);
      this.mostrarError('Complete toda la información de entrega requerida');
      return;
    }

    try {
      // Generar documentos de entrega
      await this.generarDocumentosEntrega();
      
      // Confirmar entrega en el sistema
      await this.confirmarEntregaEnSistema();
      
      this.procesoCompletado = true;
      this.entregaEnProceso = false;
      this.mostrarFormularioEntrega = false;
      
      this.agregarHistorial('Entrega completada y confirmada');
      this.mostrarExito('¡Entrega completada exitosamente!');
      
    } catch (error) {
      this.mostrarError('Error al confirmar la entrega');
    }
  }

  validarEntregaCompleta(): boolean {
    const obligatoriosPendientes = this.checklistEntrega.filter(
      item => item.esObligatorio && !item.completado
    );
    return obligatoriosPendientes.length === 0;
  }

  private async generarDocumentosEntrega(): Promise<void> {
    for (const documento of this.documentosEntrega) {
      if (!documento.generado) {
        documento.generado = true;
        documento.fechaGeneracion = new Date();
        documento.urlDocumento = await this.generarUrlDocumento(documento.tipo);
      }
    }
  }

  private async generarUrlDocumento(tipo: string): Promise<string> {
    // TODO: Implementar generación real de documentos
    return `https://documentos.otoya.com/entrega/${tipo}/${this.expediente.solicitud.id}`;
  }

  private async confirmarEntregaEnSistema(): Promise<void> {
    // TODO: Actualizar estado en Firebase
    console.log('Confirmando entrega en sistema');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // ======================================
  // GESTIÓN DE PERSONA ENTREGA
  // ======================================

  registrarPersonaEntrega(): void {
    if (this.formularioPersonaEntrega.invalid) {
      this.marcarCamposInvalidos(this.formularioPersonaEntrega);
      this.mostrarError('Complete todos los datos de la persona que recibirá el vehículo');
      return;
    }

    const formData = this.formularioPersonaEntrega.value;
    
    this.personaEntrega = {
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      parentesco: formData.parentesco,
      telefono: formData.telefono,
      autorizadoPor: this.expediente.titular.nombreCompleto,
      fechaAutorizacion: new Date()
    };

    this.agregarHistorial(`Persona de entrega registrada: ${this.personaEntrega.nombres} ${this.personaEntrega.apellidos}`);
    this.mostrarExito('Persona de entrega registrada correctamente');
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

  cancelarEntrega(): void {
    this.mostrarFormularioEntrega = false;
    this.entregaEnProceso = false;
    this.agregarHistorial('Proceso de entrega cancelado');
  }

  // ======================================
  // MÉTODOS DE UTILIDAD
  // ======================================

  obtenerColorCategoria(categoria: string): string {
    const colores: { [key: string]: string } = {
      'documentos': 'primary',
      'vehiculo': 'accent',
      'accesorios': 'primary',
      'seguridad': 'warn',
      'entrega': 'accent'
    };
    return colores[categoria] || 'primary';
  }

  obtenerIconoCategoria(categoria: string): string {
    const iconos: { [key: string]: string } = {
      'documentos': 'description',
      'vehiculo': 'two_wheeler',
      'accesorios': 'build',
      'seguridad': 'security',
      'entrega': 'handshake'
    };
    return iconos[categoria] || 'check_circle';
  }

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatearFechaCorta(fecha: Date): string {
    return fecha.toLocaleDateString('es-PE');
  }

  private marcarCamposInvalidos(formulario: FormGroup): void {
    Object.keys(formulario.controls).forEach(key => {
      const control = formulario.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
      }
    });
  }

  private agregarHistorial(evento: string, observaciones?: string, ubicacion?: string): void {
    this.historialEntrega.unshift({
      fecha: new Date(),
      evento,
      usuario: 'Usuario Actual', // TODO: obtener del servicio de autenticación
      observaciones,
      ubicacion
    });
  }

  // ======================================
  // CONTADORES PARA TEMPLATES
  // ======================================

  contarItemsPorCategoria(categoria: string): number {
    return this.checklistEntrega.filter(item => item.categoria === categoria).length;
  }

  contarItemsCompletadosPorCategoria(categoria: string): number {
    return this.checklistEntrega.filter(item => item.categoria === categoria && item.completado).length;
  }

  get fechaActual(): string {
    return new Date().toLocaleDateString('es-PE');
  }

  get horaActual(): string {
    return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }
   // ======================================
  // CONTADORES PARA TEMPLATES
  // ======================================

  
  obtenerItemsPorCategoria(categoria: string): ChecklistEntrega[] {
    return this.checklistEntrega.filter(item => item.categoria === categoria);
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