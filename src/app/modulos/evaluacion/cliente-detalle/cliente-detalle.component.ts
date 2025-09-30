import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Cliente, EstadoDocumento, TipoDocumento } from '../../admin-clientes/modelos/modelos-solicitudes';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from "@angular/material/expansion";
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatChipsModule } from "@angular/material/chips";
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {  DocumentoEditorDialogComponent, DocumentoEvaluadorData, EvaluacionDocumento } from '../documento-editor-dialog/documento-editor-dialog.component';
import { Storage1Service } from '../services/storage1.service';

interface SeccionCliente {
  id: string;
  titulo: string;
  icono: string;
  completada: boolean;
  requerida: boolean;
  alerta?: string;
}


interface DocumentoCliente {
  tipo: TipoDocumento;
  nombre: string;
  requerido: boolean;
  url?: string;
  estado: EstadoDocumento;
  fechaSubida?: Date;
  observaciones?: string;
  icono: string;
}

interface ValidacionAutomatica {
  tipo: 'RENIEC' | 'MTC' | 'CENTRALES_RIESGO';
  estado: 'pendiente' | 'procesando' | 'exitoso' | 'error';
  resultado?: any;
  fecha?: Date;
  mensaje?: string;
}

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [
    MatIcon, MatDialogModule,
    MatExpansionModule,
    NgIf, NgFor,
    MatChipsModule, MatButtonModule,
    MatIconModule, MatOptionModule, MatDatepickerModule, MatTooltipModule,
    CommonModule, MatFormFieldModule, MatInputModule, MatSelectModule, // AGREGADOS MatInputModule y MatSelectModule
    FormsModule, ReactiveFormsModule, MatCardModule, MatProgressBarModule,
],
  templateUrl: './cliente-detalle.component.html',
  styleUrl: './cliente-detalle.component.css'
})
export class ClienteDetalleComponent implements OnInit, OnChanges {

  procesandoDocumento: TipoDocumento | null = null;

@Input() cliente!: Cliente;
  @Input() tipo!: 'titular' | 'fiador';
  @Input() solicitudId!: string;
  @Input() readonly = false;

  @Output() clienteActualizado = new EventEmitter<Cliente>();
  @Output() documentoSubido = new EventEmitter<{tipo: TipoDocumento, archivo: File}>();
  @Output() validacionSolicitada = new EventEmitter<{tipo: string, datos: any}>();

  // Formulario de edición
  clienteForm!: FormGroup;
  modoEdicion = false;
  guardando = false;

  storageService = inject(Storage1Service);

  // Secciones del cliente
  secciones: SeccionCliente[] = [];
  
  // Documentos del cliente
  documentos: DocumentoCliente[] = [];
  
  // Validaciones automáticas
  validaciones: ValidacionAutomatica[] = [];
  ejecutandoValidaciones = false;

  // Variable para evitar spam en logs
  private _ultimoProgresoLogeado: number = 0;

  // Estado de la UI
  seccionExpandida = 'informacion-personal';
  mostrarDocumentosCompletos = false;
  mostrarValidacionesDetalle = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    console.log('🏗️ ClienteDetalleComponent - Constructor ejecutado');
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit - Iniciando componente');
    console.log('📝 ngOnInit - Datos de entrada:', {
      cliente: this.cliente,
      tipo: this.tipo,
      solicitudId: this.solicitudId,
      readonly: this.readonly
    });

    // Validar datos críticos antes de inicializar
    if (!this.cliente) {
      console.error('❌ ngOnInit - ERROR: cliente es null o undefined');
      this.mostrarError('Error: Datos del cliente no disponibles');
      return;
    }

    if (!this.tipo) {
      console.error('❌ ngOnInit - ERROR: tipo es null o undefined');
      this.mostrarError('Error: Tipo de cliente no especificado');
      return;
    }

    // VERIFICAR PROPIEDADES CRÍTICAS DEL CLIENTE
    if (!this.cliente.hasOwnProperty('nombres')) {
      console.error('❌ ngOnInit - ERROR: cliente no tiene propiedad "nombres"');
      console.error('❌ ngOnInit - Propiedades del cliente:', Object.keys(this.cliente));
      this.mostrarError('Error: Estructura del cliente inválida');
      return;
    }

    console.log('✅ ngOnInit - Datos de entrada válidos, procediendo con inicialización');
    this.inicializarComponente();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 ngOnChanges - Cambios detectados:', changes);

    if (changes['cliente']) {
      console.log('👤 ngOnChanges - Cambio en cliente:', {
        firstChange: changes['cliente'].firstChange,
        previousValue: changes['cliente'].previousValue,
        currentValue: changes['cliente'].currentValue
      });

      // VERIFICAR QUE EL NUEVO CLIENTE NO SEA NULL
      if (!changes['cliente'].firstChange && changes['cliente'].currentValue) {
        console.log('🔄 ngOnChanges - Actualizando datos del cliente...');
        this.actualizarDatosCliente();
      }
    }

    if (changes['tipo']) {
      console.log('🏷️ ngOnChanges - Cambio en tipo:', {
        firstChange: changes['tipo'].firstChange,
        previousValue: changes['tipo'].previousValue,
        currentValue: changes['tipo'].currentValue
      });
    }

    if (changes['readonly']) {
      console.log('🔒 ngOnChanges - Cambio en readonly:', {
        firstChange: changes['readonly'].firstChange,
        previousValue: changes['readonly'].previousValue,
        currentValue: changes['readonly'].currentValue
      });
    }
  }
  // ======================================
  // UTILIDADES DE DEBUG
  // ======================================

  private obtenerErroresFormulario(): any {
    if (!this.clienteForm) return {};
    
    const errores: any = {};
    Object.keys(this.clienteForm.controls).forEach(key => {
      const control = this.clienteForm.get(key);
      if (control && control.errors) {
        errores[key] = control.errors;
      }
    });
    return errores;
  }

  // ======================================
  // INICIALIZACIÓN
  // ======================================

  private inicializarComponente(): void {
    console.log('⚙️ inicializarComponente - Comenzando inicialización completa');

    try {
      console.log('📋 inicializarComponente - Paso 1: Inicializando formulario...');
      this.inicializarFormulario();

      console.log('📂 inicializarComponente - Paso 2: Inicializando secciones...');
      this.inicializarSecciones();

      console.log('📄 inicializarComponente - Paso 3: Inicializando documentos...');
      this.inicializarDocumentos();

      console.log('✔️ inicializarComponente - Paso 4: Inicializando validaciones...');
      this.inicializarValidaciones();

      console.log('📊 inicializarComponente - Paso 5: Evaluando completitud...');
      this.evaluarCompletitud();

      console.log('✅ inicializarComponente - Inicialización completa exitosa');
    } catch (error) {
      console.error('❌ inicializarComponente - ERROR durante inicialización:', error);
      this.mostrarError('Error al inicializar el componente');
    }
  }

  private inicializarFormulario(): void {
    console.log('📋 inicializarFormulario - Iniciando...');

    // Verificar que cliente existe y tiene propiedades
    if (!this.cliente) {
      console.error('❌ inicializarFormulario - ERROR: cliente es null');
      throw new Error('Cliente no definido para inicializar formulario');
    }

    console.log('📋 inicializarFormulario - Cliente disponible:', {
      nombres: this.cliente.nombres,
      apellidoPaterno: this.cliente.apellidoPaterno,
      documentType: this.cliente.documentType,
      documentNumber: this.cliente.documentNumber,
      email: this.cliente.email
    });

    try {
      this.clienteForm = this.fb.group({
        // Información personal
        nombres: [this.cliente.nombres || '', [Validators.required, Validators.minLength(2)]],
        apellidoPaterno: [this.cliente.apellidoPaterno || '', [Validators.required, Validators.minLength(2)]],
        apellidoMaterno: [this.cliente.apellidoMaterno || '', [Validators.required, Validators.minLength(2)]],
        documentType: [this.cliente.documentType || '', [Validators.required]],
        documentNumber: [this.cliente.documentNumber || '', [Validators.required, Validators.minLength(8)]],
        fechaNacimiento: [this.cliente.fechaNacimiento || null, [Validators.required]],
        estadoCivil: [this.cliente.estadoCivil || '', [Validators.required]],
        
        // Información de contacto
        email: [this.cliente.email || '', [Validators.required, Validators.email]],
        telefono1: [this.cliente.telefono1 || '', [Validators.required, Validators.minLength(9)]],
        telefono2: [this.cliente.telefono2 || ''],
        
        // Información laboral
        ocupacion: [this.cliente.ocupacion || '', [Validators.required]],
        rangoIngresos: [this.cliente.rangoIngresos || '', [Validators.required]],
        
        // Información de residencia
        departamento: [this.cliente.departamento || '', [Validators.required]],
        provincia: [this.cliente.provincia || '', [Validators.required]],
        distrito: [this.cliente.distrito || '', [Validators.required]],
        direccion: [this.cliente.direccion || '', [Validators.required]],
        tipoVivienda: [this.cliente.tipoVivienda || '', [Validators.required]],
        
        // Información de licencia
        licenciaConducir: [this.cliente.licenciaConducir || ''],
        numeroLicencia: [this.cliente.numeroLicencia || '']
      });

      console.log('📋 inicializarFormulario - Formulario creado exitosamente');
      console.log('📋 inicializarFormulario - Estado del formulario:', {
        valid: this.clienteForm.valid,
        value: this.clienteForm.value,
        errors: this.obtenerErroresFormulario()
      });

      // Deshabilitar formulario si es readonly
      if (this.readonly) {
        console.log('🔒 inicializarFormulario - Deshabilitando formulario (readonly = true)');
        this.clienteForm.disable();
      }

    } catch (error) {
      console.error('❌ inicializarFormulario - ERROR al crear formulario:', error);
      throw error;
    }
  }

  private inicializarSecciones(): void {
    console.log('📂 inicializarSecciones - Iniciando...');

    try {
      this.secciones = [
        {
          id: 'informacion-personal',
          titulo: 'Información Personal',
          icono: 'person',
          completada: this.evaluarSeccionPersonal(),
          requerida: true
        },
        {
          id: 'informacion-contacto',
          titulo: 'Información de Contacto',
          icono: 'contact_phone',
          completada: this.evaluarSeccionContacto(),
          requerida: true
        },
        {
          id: 'informacion-laboral',
          titulo: 'Información Laboral',
          icono: 'work',
          completada: this.evaluarSeccionLaboral(),
          requerida: true
        },
        {
          id: 'informacion-residencia',
          titulo: 'Información de Residencia',
          icono: 'home',
          completada: this.evaluarSeccionResidencia(),
          requerida: true
        },
        {
          id: 'documentos',
          titulo: 'Documentos',
          icono: 'folder',
          completada: this.evaluarSeccionDocumentos(),
          requerida: true,
          alerta: this.cliente.estadoValidacionDocumentos === 'observado' ? 'Documentos observados' : undefined
        },
        {
          id: 'validaciones',
          titulo: 'Validaciones Automáticas',
          icono: 'verified_user',
          completada: this.evaluarSeccionValidaciones(),
          requerida: false
        }
      ];

      // Secciones específicas para fiador
      if (this.tipo === 'fiador') {
        console.log('📂 inicializarSecciones - Agregando sección específica para fiador');
        this.secciones.push({
          id: 'informacion-aval',
          titulo: 'Información como Fiador',
          icono: 'security',
          completada: this.evaluarSeccionAval(),
          requerida: true
        });
      }

      console.log('📂 inicializarSecciones - Secciones creadas:', this.secciones.map(s => ({
        id: s.id,
        titulo: s.titulo,
        completada: s.completada,
        requerida: s.requerida
      })));

    } catch (error) {
      console.error('❌ inicializarSecciones - ERROR:', error);
      throw error;
    }
  }

  private inicializarDocumentos(): void {
    console.log('📄 inicializarDocumentos - Iniciando...');

    try {
      const documentosBase: Omit<DocumentoCliente, 'url' | 'estado' | 'fechaSubida' | 'observaciones'>[] = [
        { tipo: 'dniFrente', nombre: 'DNI - Frente', requerido: true, icono: 'badge' },
        { tipo: 'dniReverso', nombre: 'DNI - Reverso', requerido: true, icono: 'badge' },
        { tipo: 'reciboServicio', nombre: 'Recibo de Servicios', requerido: this.tipo === 'titular', icono: 'receipt' },
        { tipo: 'fachada', nombre: 'Fachada de Vivienda', requerido: this.tipo === 'titular', icono: 'home' },
        { tipo: 'selfie', nombre: 'Selfie Laboral', requerido: this.tipo === 'titular', icono: 'photo_camera' },
        { tipo: 'licenciaConducir', nombre: 'Licencia de Conducir', requerido: false, icono: 'credit_card' },
        { tipo: 'constanciaTrabajo', nombre: 'Constancia de Trabajo', requerido: false, icono: 'work' },
        { tipo: 'recibosIngresos', nombre: 'Recibos de Ingresos', requerido: false, icono: 'attach_money' }
      ];

      console.log('📄 inicializarDocumentos - Documentos base definidos:', documentosBase.length);

      this.documentos = documentosBase.map(doc => {
        const url = this.obtenerUrlDocumento(doc.tipo);
        const estado = this.obtenerEstadoDocumento(doc.tipo);
        const fechaSubida = this.obtenerFechaDocumento(doc.tipo);
        const observaciones = this.obtenerObservacionesDocumento(doc.tipo);

        console.log(`📄 inicializarDocumentos - Procesando ${doc.tipo}:`, {
          url,
          estado,
          fechaSubida,
          observaciones
        });

        return {
          ...doc,
          url,
          estado,
          fechaSubida,
          observaciones
        };
      });

      console.log('📄 inicializarDocumentos - Documentos inicializados:', this.documentos.map(d => ({
        tipo: d.tipo,
        nombre: d.nombre,
        requerido: d.requerido,
        estado: d.estado,
        url: !!d.url
      })));

    } catch (error) {
      console.error('❌ inicializarDocumentos - ERROR:', error);
      throw error;
    }
  }

  private inicializarValidaciones(): void {
    console.log('✔️ inicializarValidaciones - Iniciando...');

    try {
      this.validaciones = [
        {
          tipo: 'RENIEC',
          estado: this.cliente.datosVerificados ? 'exitoso' : 'pendiente',
          fecha: this.cliente.fechaVerificacionDatos,
          mensaje: this.cliente.datosVerificados ? 'Datos verificados correctamente' : 'Pendiente de verificación'
        },
        {
          tipo: 'CENTRALES_RIESGO',
          estado: this.cliente.consultaCentralesRealizada ? 'exitoso' : 'pendiente',
          fecha: this.cliente.fechaConsultaCentrales,
          resultado: this.cliente.resultadoCentrales,
          mensaje: this.obtenerMensajeCentrales()
        }
      ];

      // Validación MTC solo si tiene licencia
      if (this.cliente.numeroLicencia) {
        console.log('✔️ inicializarValidaciones - Agregando validación MTC (tiene licencia)');
        this.validaciones.push({
          tipo: 'MTC',
          estado: this.cliente.licenciaConducir === 'vigente' ? 'exitoso' : 'pendiente',
          mensaje: this.cliente.licenciaConducir === 'vigente' ? 'Licencia vigente' : 'Verificar estado de licencia'
        });
      } else {
        console.log('✔️ inicializarValidaciones - No se agrega validación MTC (sin licencia)');
      }

      console.log('✔️ inicializarValidaciones - Validaciones inicializadas:', this.validaciones.map(v => ({
        tipo: v.tipo,
        estado: v.estado,
        mensaje: v.mensaje
      })));

    } catch (error) {
      console.error('❌ inicializarValidaciones - ERROR:', error);
      throw error;
    }
  }

  // ======================================
  // EVALUACIÓN DE COMPLETITUD
  // ======================================

  private evaluarCompletitud(): void {
    console.log('📊 evaluarCompletitud - Iniciando evaluación...');

    try {
      this.secciones.forEach(seccion => {
        const estadoAnterior = seccion.completada;
        
        switch (seccion.id) {
          case 'informacion-personal':
            seccion.completada = this.evaluarSeccionPersonal();
            break;
          case 'informacion-contacto':
            seccion.completada = this.evaluarSeccionContacto();
            break;
          case 'informacion-laboral':
            seccion.completada = this.evaluarSeccionLaboral();
            break;
          case 'informacion-residencia':
            seccion.completada = this.evaluarSeccionResidencia();
            break;
          case 'documentos':
            seccion.completada = this.evaluarSeccionDocumentos();
            break;
          case 'validaciones':
            seccion.completada = this.evaluarSeccionValidaciones();
            break;
          case 'informacion-aval':
            seccion.completada = this.evaluarSeccionAval();
            break;
        }

        if (estadoAnterior !== seccion.completada) {
          console.log(`📊 evaluarCompletitud - ${seccion.id}: ${estadoAnterior} → ${seccion.completada}`);
        }
      });

      const completitudGeneral = this.porcentajeCompletitudGeneral;
      console.log('📊 evaluarCompletitud - Completitud general:', `${completitudGeneral.toFixed(1)}%`);

    } catch (error) {
      console.error('❌ evaluarCompletitud - ERROR:', error);
    }
  }

  private evaluarSeccionPersonal(): boolean {
    const resultado = !!(this.cliente.nombres && 
             this.cliente.apellidoPaterno && 
             this.cliente.apellidoMaterno && 
             this.cliente.documentNumber && 
             this.cliente.fechaNacimiento &&
             this.cliente.estadoCivil);

    console.log('👤 evaluarSeccionPersonal - Campos:', {
      nombres: !!this.cliente.nombres,
      apellidoPaterno: !!this.cliente.apellidoPaterno,
      apellidoMaterno: !!this.cliente.apellidoMaterno,
      documentNumber: !!this.cliente.documentNumber,
      fechaNacimiento: !!this.cliente.fechaNacimiento,
      estadoCivil: !!this.cliente.estadoCivil,
      resultado
    });

    return resultado;
  }

  private evaluarSeccionContacto(): boolean {
    const resultado = !!(this.cliente.email && this.cliente.telefono1);
    
    console.log('📞 evaluarSeccionContacto - Campos:', {
      email: !!this.cliente.email,
      telefono1: !!this.cliente.telefono1,
      resultado
    });

    return resultado;
  }

  private evaluarSeccionLaboral(): boolean {
    const resultado = !!(this.cliente.ocupacion && this.cliente.rangoIngresos);
    
    console.log('💼 evaluarSeccionLaboral - Campos:', {
      ocupacion: !!this.cliente.ocupacion,
      rangoIngresos: !!this.cliente.rangoIngresos,
      resultado
    });

    return resultado;
  }

  private evaluarSeccionResidencia(): boolean {
    const resultado = !!(this.cliente.departamento && 
             this.cliente.provincia && 
             this.cliente.distrito && 
             this.cliente.direccion && 
             this.cliente.tipoVivienda);

    console.log('🏠 evaluarSeccionResidencia - Campos:', {
      departamento: !!this.cliente.departamento,
      provincia: !!this.cliente.provincia,
      distrito: !!this.cliente.distrito,
      direccion: !!this.cliente.direccion,
      tipoVivienda: !!this.cliente.tipoVivienda,
      resultado
    });

    return resultado;
  }

  private evaluarSeccionDocumentos(): boolean {
    const documentosRequeridos = this.documentos.filter(d => d.requerido);
    const documentosAprobados = documentosRequeridos.filter(d => d.estado === 'aprobado');
    const resultado = documentosAprobados.length === documentosRequeridos.length;

    console.log('📄 evaluarSeccionDocumentos - Estado:', {
      totalRequeridos: documentosRequeridos.length,
      aprobados: documentosAprobados.length,
      documentosRequeridos: documentosRequeridos.map(d => ({ tipo: d.tipo, estado: d.estado })),
      resultado
    });

    return resultado;
  }

  private evaluarSeccionValidaciones(): boolean {
    const validacionesEsenciales = this.validaciones.filter(v => v.tipo === 'RENIEC' || v.tipo === 'CENTRALES_RIESGO');
    const resultado = validacionesEsenciales.every(v => v.estado === 'exitoso');

    console.log('✔️ evaluarSeccionValidaciones - Estado:', {
      validacionesEsenciales: validacionesEsenciales.map(v => ({ tipo: v.tipo, estado: v.estado })),
      resultado
    });

    return resultado;
  }

  private evaluarSeccionAval(): boolean {
    if (this.tipo !== 'fiador') return true;
    
    const resultado = !!(this.cliente.relacionConTitular && 
             this.cliente.aceptaResponsabilidad && 
             this.cliente.capacidadAval);

    console.log('🛡️ evaluarSeccionAval - Campos:', {
      relacionConTitular: !!this.cliente.relacionConTitular,
      aceptaResponsabilidad: !!this.cliente.aceptaResponsabilidad,
      capacidadAval: !!this.cliente.capacidadAval,
      resultado
    });

    return resultado;
  }

  // ======================================
  // GESTIÓN DE DOCUMENTOS
  // ======================================

  private obtenerUrlDocumento(tipo: TipoDocumento): string | undefined {
    try {
      if (!this.cliente.archivos) {
        console.warn(`📄 obtenerUrlDocumento - archivos no definido para ${tipo}`);
        return undefined;
      }
      
      const url = this.cliente.archivos[tipo as keyof typeof this.cliente.archivos];
      console.log(`📄 obtenerUrlDocumento - ${tipo}:`, url ? 'URL encontrada' : 'Sin URL');
      return url;
    } catch (error) {
      console.error(`❌ obtenerUrlDocumento - ERROR para ${tipo}:`, error);
      return undefined;
    }
  }

  private obtenerEstadoDocumento(tipo: TipoDocumento): EstadoDocumento {
    try {
      const url = this.obtenerUrlDocumento(tipo);
      if (!url) {
        console.log(`📄 obtenerEstadoDocumento - ${tipo}: pendiente (sin URL)`);
        return 'pendiente';
      }
      
      if (this.cliente.documentosObservados?.includes(tipo)) {
        console.log(`📄 obtenerEstadoDocumento - ${tipo}: observado`);
        return 'observado';
      }
      
      const estado = this.cliente.estadoValidacionDocumentos === 'aprobado' ? 'aprobado' : 'pendiente';
      console.log(`📄 obtenerEstadoDocumento - ${tipo}: ${estado}`);
      return estado;
    } catch (error) {
      console.error(`❌ obtenerEstadoDocumento - ERROR para ${tipo}:`, error);
      return 'pendiente';
    }
  }

  private obtenerFechaDocumento(tipo: TipoDocumento): Date | undefined {
    // En un caso real, esto vendría de la base de datos
    const fecha = this.cliente.fechaValidacionDocumentos;
    console.log(`📄 obtenerFechaDocumento - ${tipo}:`, fecha || 'Sin fecha');
    return fecha;
  }

  private obtenerObservacionesDocumento(tipo: TipoDocumento): string | undefined {
    if (this.cliente.documentosObservados?.includes(tipo)) {
      const observacion = 'Documento requiere corrección o actualización';
      console.log(`📄 obtenerObservacionesDocumento - ${tipo}:`, observacion);
      return observacion;
    }
    return undefined;
  }

  private obtenerMensajeCentrales(): string {
    if (!this.cliente.consultaCentralesRealizada) {
      return 'Pendiente de consulta a centrales de riesgo';
    }

    const resultado = this.cliente.resultadoCentrales;
    if (!resultado) {
      return 'Consulta realizada sin resultados';
    }

    const alertas = [];
    if (resultado.equifax === 'alerta' || resultado.equifax === 'rechazo') alertas.push('Equifax');
    if (resultado.experian === 'alerta' || resultado.experian === 'rechazo') alertas.push('Experian');
    if (resultado.dataCredito === 'alerta' || resultado.dataCredito === 'rechazo') alertas.push('DataCrédito');

    if (alertas.length > 0) {
      return `Alertas en: ${alertas.join(', ')}`;
    }

    if (resultado.scoreSBS && resultado.scoreSBS < 500) {
      return `Score SBS bajo: ${resultado.scoreSBS}`;
    }

    return 'Sin observaciones en centrales de riesgo';
  }

  

  // ======================================
  // ACCIONES DEL USUARIO
  // ======================================

  alternarModoEdicion(): void {
    console.log('✏️ alternarModoEdicion - Estado actual:', {
      readonly: this.readonly,
      modoEdicion: this.modoEdicion
    });

    if (this.readonly) {
      console.warn('✏️ alternarModoEdicion - Cancelado: componente en modo readonly');
      return;
    }
    
    this.modoEdicion = !this.modoEdicion;
    console.log('✏️ alternarModoEdicion - Nuevo estado:', this.modoEdicion);

    if (this.modoEdicion) {
      console.log('✏️ alternarModoEdicion - Habilitando formulario para edición');
      this.clienteForm.enable();
    } else {
      console.log('✏️ alternarModoEdicion - Deshabilitando formulario y restaurando valores');
      this.clienteForm.disable();
      // Restaurar valores originales
      this.inicializarFormulario();
    }
  }

  async guardarCambios(): Promise<void> {
    console.log('💾 guardarCambios - Iniciando...');
    console.log('💾 guardarCambios - Estado del formulario:', {
      valid: this.clienteForm.valid,
      value: this.clienteForm.value,
      errors: this.obtenerErroresFormulario()
    });

    if (this.clienteForm.invalid) {
      console.warn('💾 guardarCambios - Formulario inválido, marcando campos');
      this.marcarCamposInvalidos();
      this.mostrarError('Por favor complete todos los campos requeridos');
      return;
    }

    this.guardando = true;

    try {
      const clienteActualizado: Cliente = {
        ...this.cliente,
        ...this.clienteForm.value
      };

      console.log('💾 guardarCambios - Cliente actualizado:', clienteActualizado);

      // Emitir evento de actualización
      this.clienteActualizado.emit(clienteActualizado);
      
      console.log('💾 guardarCambios - Evento clienteActualizado emitido');
      
      this.modoEdicion = false;
      this.clienteForm.disable();
      this.mostrarExito('Información actualizada correctamente');

    } catch (error) {
      console.error('❌ guardarCambios - ERROR:', error);
      this.mostrarError('Error al guardar los cambios');
    } finally {
      this.guardando = false;
      console.log('💾 guardarCambios - Finalizado');
    }
  }

  cancelarEdicion(): void {
    console.log('❌ cancelarEdicion - Cancelando edición');
    this.modoEdicion = false;
    this.clienteForm.disable();
    this.inicializarFormulario();
  }

  // ======================================
  // GESTIÓN DE DOCUMENTOS
  // ======================================

 
  

  eliminarDocumento(tipo: TipoDocumento): void {
    console.log('🗑️ eliminarDocumento - Eliminando:', tipo);
    
    // TODO: Implementar eliminación de documento
    const documento = this.documentos.find(d => d.tipo === tipo);
    if (documento) {
      console.log('🗑️ eliminarDocumento - Documento encontrado, limpiando datos');
      documento.url = undefined;
      documento.estado = 'pendiente';
      documento.fechaSubida = undefined;
      documento.observaciones = undefined;
    }
    
    this.evaluarCompletitud();
    this.mostrarInfo('Documento eliminado');
  }

  // ======================================
  // VALIDACIONES AUTOMÁTICAS
  // ======================================

  async ejecutarValidacionAutomatica(tipo: string): Promise<void> {
    console.log('✅ ejecutarValidacionAutomatica - Iniciando:', tipo);

    const validacion = this.validaciones.find(v => v.tipo === tipo);
    if (!validacion) {
      console.error('✅ ejecutarValidacionAutomatica - Validación no encontrada:', tipo);
      return;
    }

    console.log('✅ ejecutarValidacionAutomatica - Validación encontrada:', validacion);

    validacion.estado = 'procesando';
    this.ejecutandoValidaciones = true;

    try {
      // Preparar datos para validación
      const datos = this.prepararDatosValidacion(tipo);
      console.log('✅ ejecutarValidacionAutomatica - Datos preparados:', datos);
      
      // Emitir evento para ejecutar validación
      this.validacionSolicitada.emit({ tipo, datos });
      console.log('✅ ejecutarValidacionAutomatica - Evento validacionSolicitada emitido');
      
      // Simular procesamiento (en implementación real esto se maneja por eventos)
      console.log('✅ ejecutarValidacionAutomatica - Simulando procesamiento...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      validacion.estado = 'exitoso';
      validacion.fecha = new Date();
      
      console.log('✅ ejecutarValidacionAutomatica - Validación completada exitosamente');
      this.mostrarExito(`Validación ${tipo} completada`);

    } catch (error) {
      console.error('❌ ejecutarValidacionAutomatica - ERROR:', error);
      validacion.estado = 'error';
      validacion.mensaje = 'Error en la validación';
      this.mostrarError(`Error en validación ${tipo}`);
    } finally {
      this.ejecutandoValidaciones = false;
      this.evaluarCompletitud();
      console.log('✅ ejecutarValidacionAutomatica - Finalizado');
    }
  }

  async ejecutarTodasLasValidaciones(): Promise<void> {
    console.log('✅ ejecutarTodasLasValidaciones - Iniciando...');
    
    const validacionesPendientes = this.validaciones.filter(v => v.estado === 'pendiente');
    console.log('✅ ejecutarTodasLasValidaciones - Validaciones pendientes:', 
      validacionesPendientes.map(v => v.tipo));
    
    for (const validacion of validacionesPendientes) {
      console.log('✅ ejecutarTodasLasValidaciones - Ejecutando:', validacion.tipo);
      await this.ejecutarValidacionAutomatica(validacion.tipo);
    }

    console.log('✅ ejecutarTodasLasValidaciones - Todas las validaciones completadas');
  }

  private prepararDatosValidacion(tipo: string): any {
    console.log('📋 prepararDatosValidacion - Preparando datos para:', tipo);

    try {
      switch (tipo) {
        case 'RENIEC':
          const datosReniec = {
            documentType: this.cliente.documentType,
            documentNumber: this.cliente.documentNumber,
            nombres: this.cliente.nombres,
            apellidoPaterno: this.cliente.apellidoPaterno,
            apellidoMaterno: this.cliente.apellidoMaterno
          };
          console.log('📋 prepararDatosValidacion - RENIEC:', datosReniec);
          return datosReniec;
        
        case 'MTC':
          const datosMTC = {
            numeroLicencia: this.cliente.numeroLicencia,
            documentNumber: this.cliente.documentNumber
          };
          console.log('📋 prepararDatosValidacion - MTC:', datosMTC);
          return datosMTC;
        
        case 'CENTRALES_RIESGO':
          const datosCentrales = {
            documentType: this.cliente.documentType,
            documentNumber: this.cliente.documentNumber,
            nombres: this.cliente.nombreCompleto
          };
          console.log('📋 prepararDatosValidacion - CENTRALES_RIESGO:', datosCentrales);
          return datosCentrales;
        
        default:
          console.warn('📋 prepararDatosValidacion - Tipo no reconocido:', tipo);
          return {};
      }
    } catch (error) {
      console.error('❌ prepararDatosValidacion - ERROR:', error);
      return {};
    }
  }

  // ======================================
  // UTILIDADES Y VALIDACIONES
  // ======================================

  private validarTipoArchivo(archivo: File): boolean {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const esValido = tiposPermitidos.includes(archivo.type);
    console.log('🔍 validarTipoArchivo:', {
      tipo: archivo.type,
      esValido,
      tiposPermitidos
    });
    return esValido;
  }

  private validarTamañoArchivo(archivo: File): boolean {
    const tamañoMaximo = 5 * 1024 * 1024; // 5MB
    const esValido = archivo.size <= tamañoMaximo;
    console.log('🔍 validarTamañoArchivo:', {
      tamaño: `${(archivo.size / 1024 / 1024).toFixed(2)}MB`,
      tamañoMaximo: '5MB',
      esValido
    });
    return esValido;
  }

  private marcarCamposInvalidos(): void {
    console.log('⚠️ marcarCamposInvalidos - Marcando campos inválidos');
    
    Object.keys(this.clienteForm.controls).forEach(key => {
      const control = this.clienteForm.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
        console.log(`⚠️ marcarCamposInvalidos - Campo inválido: ${key}`, control.errors);
      }
    });
  }

  private actualizarDatosCliente(): void {
    console.log('🔄 actualizarDatosCliente - Actualizando datos...');
    
    try {
      this.inicializarFormulario();
      this.inicializarSecciones();
      this.inicializarDocumentos();
      this.inicializarValidaciones();
      this.evaluarCompletitud();
      console.log('🔄 actualizarDatosCliente - Actualización completada');
    } catch (error) {
      console.error('❌ actualizarDatosCliente - ERROR:', error);
    }
  }

  // ======================================
  // MÉTODOS PÚBLICOS PARA TEMPLATE
  // ======================================

  expandirSeccion(seccionId: string): void {
    console.log('📂 expandirSeccion:', seccionId);
    this.seccionExpandida = this.seccionExpandida === seccionId ? '' : seccionId;
    console.log('📂 expandirSeccion - Nueva sección expandida:', this.seccionExpandida);
  }

  estaSeccionExpandida(seccionId: string): boolean {
    return this.seccionExpandida === seccionId;
  }

  obtenerColorEstadoDocumento(estado: EstadoDocumento): 'primary' | 'accent' | 'warn' | 'success' {
    switch (estado) {
      case 'aprobado': return 'success';
      case 'observado': return 'warn';
      case 'rechazado': return 'warn';
      default: return 'accent';
    }
  }

  obtenerColorValidacion(estado: string): 'primary' | 'accent' | 'warn' | 'success' {
    switch (estado) {
      case 'exitoso': return 'success';
      case 'procesando': return 'primary';
      case 'error': return 'warn';
      default: return 'accent';
    }
  }

  obtenerIconoValidacion(estado: string): string {
    switch (estado) {
      case 'exitoso': return 'check_circle';
      case 'procesando': return 'sync';
      case 'error': return 'error';
      default: return 'schedule';
    }
  }

  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'No disponible';
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  obtenerProgresoValidaciones(): number {
    const validacionesCompletadas = this.validaciones.filter(v => v.estado === 'exitoso').length;
    const progreso = this.validaciones.length > 0 ? (validacionesCompletadas / this.validaciones.length) * 100 : 0;
    
    console.log('📊 obtenerProgresoValidaciones:', {
      completadas: validacionesCompletadas,
      total: this.validaciones.length,
      progreso: `${progreso.toFixed(1)}%`
    });
    
    return progreso;
  }

  obtenerProgresoDocumentos(): number {
    const documentosRequeridos = this.documentos.filter(d => d.requerido);
    const documentosCompletados = documentosRequeridos.filter(d => d.estado === 'aprobado');
    const progreso = documentosRequeridos.length > 0 ? (documentosCompletados.length / documentosRequeridos.length) * 100 : 0;
    
    console.log('📊 obtenerProgresoDocumentos:', {
      completados: documentosCompletados.length,
      requeridos: documentosRequeridos.length,
      progreso: `${progreso.toFixed(1)}%`
    });
    
    return progreso;
  }

  // ======================================
  // NOTIFICACIONES
  // ======================================

  private mostrarError(mensaje: string): void {
    console.error('🚨 mostrarError:', mensaje);
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarExito(mensaje: string): void {
    console.log('✅ mostrarExito:', mensaje);
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private mostrarInfo(mensaje: string): void {
    console.log('ℹ️ mostrarInfo:', mensaje);
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }

  // ======================================
  // GETTERS PARA TEMPLATE
  // ======================================

  get porcentajeCompletitudGeneral(): number {
    const seccionesCompletadas = this.secciones.filter(s => s.completada).length;
    const porcentaje = this.secciones.length > 0 ? (seccionesCompletadas / this.secciones.length) * 100 : 0;
    
    // Solo logear si hay cambios significativos (cada 10%)
    const porcentajeRedondeado = Math.floor(porcentaje / 10) * 10;
    if (porcentajeRedondeado !== Math.floor((this._ultimoProgresoLogeado || 0) / 10) * 10) {
      console.log('📊 porcentajeCompletitudGeneral:', `${porcentaje.toFixed(1)}%`, {
        completadas: seccionesCompletadas,
        total: this.secciones.length
      });
      this._ultimoProgresoLogeado = porcentaje;
    }
    
    return porcentaje;
  }

  

  get tieneAlertasDocumentos(): boolean {
    const tieneAlertas = this.documentos.some(d => d.estado === 'observado');
    console.log('📄 tieneAlertasDocumentos:', tieneAlertas);
    return tieneAlertas;
  }

  get documentosObservados(): DocumentoCliente[] {
    const observados = this.documentos.filter(d => d.estado === 'observado');
    if (observados.length > 0) {
      console.log('📄 documentosObservados:', observados.map(d => d.tipo));
    }
    return observados;
  }

  get puedeEditarCliente(): boolean {
    const puedeEditar = !this.readonly && this.cliente.estadoValidacionDocumentos !== 'aprobado';
    console.log('✏️ puedeEditarCliente:', {
      readonly: this.readonly,
      estadoValidacion: this.cliente.estadoValidacionDocumentos,
      puedeEditar
    });
    return puedeEditar;
  }

  // Reemplazar el método verDocumento existente



// NUEVO MÉTODO para abrir el modal de edición


private debugearDocumentos(): void {
  console.log('🔍 DEBUG: Estado actual de documentos:');
  this.documentos.forEach((doc, index) => {
    console.log(`📄 Documento ${index + 1}:`, {
      tipo: doc.tipo,
      nombre: doc.nombre,
      url: doc.url,
      estado: doc.estado,
      requerido: doc.requerido,
      tieneUrl: !!doc.url,
      longitudUrl: doc.url?.length || 0
    });
  });
  
  console.log('👤 Cliente archivos:', this.cliente.archivos);
}




verDocumentoEnNuevaTab(documento: DocumentoCliente): void {
  if (documento.url) {
    window.open(documento.url, '_blank');
  }
}


/**
 * Evaluar un documento existente
 */
evaluarDocumento(documento: DocumentoCliente): void {
  console.log('📋 Evaluando documento:', documento.tipo);
  
  if (!documento.url) {
    this.mostrarError('No hay documento para evaluar');
    return;
  }

  this.abrirEvaluadorDocumento(documento);
}

/**
 * Ver documento en modo solo lectura
 */
verDocumentoSoloLectura(documento: DocumentoCliente): void {
  console.log('👁️ Viendo documento:', documento.tipo);
  
  if (!documento.url) {
    this.mostrarError('No hay documento para visualizar');
    return;
  }

  this.abrirEvaluadorDocumento(documento, true);
}

/**
 * Abrir el evaluador de documentos
 */
private abrirEvaluadorDocumento(documento: DocumentoCliente, readonly: boolean = false): void {
  console.log('🎯 Abriendo evaluador de documento:', {
    tipo: documento.tipo,
    readonly,
    url: documento.url
  });

  const dialogData: DocumentoEvaluadorData = {
    tipoDocumento: documento.tipo,
    nombreDocumento: documento.nombre,
    urlDocumento: documento.url!,
    estadoActual: documento.estado,
    clienteId: this.cliente.id,
    solicitudId: this.solicitudId,
    clienteNombre: this.cliente.nombreCompleto,
    readonly
  };

  console.log('📦 Datos enviados al evaluador:', dialogData);

  const dialogRef = this.dialog.open(DocumentoEditorDialogComponent, {
    width: '1200px',
    height: '800px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    disableClose: false,
    data: dialogData
  });

  dialogRef.afterClosed().subscribe(async (evaluacion: EvaluacionDocumento) => {
    if (evaluacion && !readonly) {
      console.log('📄 Evaluación recibida:', evaluacion);
      await this.procesarEvaluacionDocumento(documento, evaluacion);
    } else {
      console.log('❌ Modal cerrado sin evaluación o en modo readonly');
    }
  });
}

/**
 * Procesar la evaluación del documento
 */
private async procesarEvaluacionDocumento(
  documento: DocumentoCliente,
  evaluacion: EvaluacionDocumento
): Promise<void> {
  console.log('⚙️ Procesando evaluación documento:', documento.tipo);

  try {
    this.guardando = true;

    // Actualizar documento localmente
    documento.estado = evaluacion.estado;
    documento.fechaSubida = new Date(); // Fecha de evaluación
    documento.observaciones = evaluacion.observaciones;

    // Actualizar cliente con nuevo estado del documento
    const clienteActualizado = { ...this.cliente };
    
    // Actualizar estado de validación general
    clienteActualizado.estadoValidacionDocumentos = this.calcularEstadoGeneralDocumentos();
    clienteActualizado.fechaValidacionDocumentos = new Date();
    
    // Manejar documentos observados
    if (evaluacion.estado === 'observado') {
      if (!clienteActualizado.documentosObservados) {
        clienteActualizado.documentosObservados = [];
      }
      if (!clienteActualizado.documentosObservados.includes(documento.tipo)) {
        clienteActualizado.documentosObservados.push(documento.tipo);
      }
    } else {
      // Remover de observados si ya no está observado
      if (clienteActualizado.documentosObservados) {
        clienteActualizado.documentosObservados = clienteActualizado.documentosObservados
          .filter(tipo => tipo !== documento.tipo);
      }
    }

    console.log('📡 Emitiendo cliente actualizado...');
    this.clienteActualizado.emit(clienteActualizado);

    // Re-evaluar completitud
    this.evaluarCompletitud();

    const mensaje = this.obtenerMensajeEvaluacion(evaluacion.estado);
    this.mostrarExito(mensaje);

  } catch (error) {
    console.error('❌ Error procesando evaluación:', error);
    this.mostrarError('Error al procesar la evaluación del documento');
  } finally {
    this.guardando = false;
  }
}

/**
 * Calcular estado general de documentos basado en evaluaciones
 */
private calcularEstadoGeneralDocumentos(): EstadoDocumento {
  const documentosRequeridos = this.documentos.filter(d => d.requerido);
  const documentosAprobados = documentosRequeridos.filter(d => d.estado === 'aprobado');
  const documentosObservados = documentosRequeridos.filter(d => d.estado === 'observado');
  const documentosRechazados = documentosRequeridos.filter(d => d.estado === 'rechazado');

  if (documentosRechazados.length > 0) return 'rechazado';
  if (documentosObservados.length > 0) return 'observado';
  if (documentosAprobados.length === documentosRequeridos.length) return 'aprobado';
  return 'pendiente';
}

/**
 * Obtener mensaje según el estado de evaluación
 */
private obtenerMensajeEvaluacion(estado: EstadoDocumento): string {
  const mensajes = {
    aprobado: 'Documento aprobado correctamente',
    observado: 'Documento marcado como observado',
    rechazado: 'Documento rechazado',
    pendiente: 'Estado del documento actualizado'
  };
  return mensajes[estado] || 'Evaluación procesada';
}


// Fin de la clase

obtenerDocumentosAprobados(): number {
  if (!this.documentos || !Array.isArray(this.documentos)) {
    return 0;
  }
  return this.documentos.filter(d => d.estado === 'aprobado').length;
}

obtenerDocumentosObservados(): number {
  if (!this.documentos || !Array.isArray(this.documentos)) {
    return 0;
  }
  return this.documentos.filter(d => d.estado === 'observado').length;
}

obtenerDocumentosRechazados(): number {
  if (!this.documentos || !Array.isArray(this.documentos)) {
    return 0;
  }
  return this.documentos.filter(d => d.estado === 'rechazado').length;
}

obtenerDocumentosPendientes(): number {
  if (!this.documentos || !Array.isArray(this.documentos)) {
    return 0;
  }
  return this.documentos.filter(d => d.estado === 'pendiente').length;
}

// Métodos ya existentes que debes verificar que estén presentes



}