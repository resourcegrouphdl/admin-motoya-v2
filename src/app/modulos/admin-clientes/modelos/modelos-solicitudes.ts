// ==================================================
// 1. TIPOS Y ENUMS PARA EL SISTEMA
// ==================================================

import { Timestamp } from '@angular/fire/firestore';
import { AsesorSeleccionado } from '../../evaluacion/selector-asesor-dialog/selector-asesor-dialog.component';

// Estados del proceso de evaluación
export type EstadoSolicitud = 
  | 'pendiente'                         // Recién creada
  | 'en_revision_inicial'              // Asignada a asesor
  | 'evaluacion_documental'            // Validando documentos
  | 'documentos_observados'            // Documentos con observaciones
  | 'evaluacion_garantes'              // Evaluando fiador/garantes
  | 'garante_rechazado'                // Fiador no cumple requisitos
  | 'entrevista_programada'            // Entrevista agendada
  | 'en_entrevista'                    // Entrevista en curso
  | 'entrevista_completada'            // Entrevista finalizada
  | 'en_decision'                      // Comité evaluando
  | 'aprobado'                         // Crédito aprobado
  | 'rechazado'                        // Crédito rechazado
  | 'condicional'                      // Aprobado con condiciones
  | 'certificado_generado'             // Certificado listo
  | 'esperando_inicial'                // Esperando pago inicial
  | 'inicial_confirmada'               // Inicial pagada
  | 'contrato_firmado'                 // Contrato firmado
  | 'entrega_completada'               // Proceso terminado
  | 'suspendido'                       // Proceso suspendido
  | 'cancelado';                       // Cancelado por cliente

// Prioridades del sistema
export type PrioridadSolicitud = 'Alta' | 'Media' | 'Baja';

// Tipos de documentos
export type TipoDocumento = 
  | 'selfie' | 'dniFrente' | 'dniReverso' | 'reciboServicio' | 'fachada'
  | 'licenciaConducir' | 'constanciaTrabajo' | 'recibosIngresos'
  | 'voucherInicial' | 'contratoFirmado' | 'actaEntrega';

// Tipos de evaluaciones
export type TipoEvaluacion = 
  | 'revision_inicial' | 'documental' | 'garantes' | 'entrevista' | 'decision_final';

// Roles del sistema
export type RolUsuario = 
  | 'admin' | 'supervisor' | 'asesor' | 'evaluador_documental'
  | 'evaluador_garantes' | 'entrevistador' | 'oficial_credito' | 'vendedor';

// Estados de documentos
export type EstadoDocumento = 'pendiente' | 'aprobado' | 'observado' | 'rechazado';

// Estados de evaluaciones
export type EstadoEvaluacion = 'pendiente' | 'en_proceso' | 'completada' | 'observada' | 'rechazada';

// ==================================================
// 2. INTERFACE TABLA SOLICITUDES (PRINCIPAL)
// ==================================================

export interface SolicitudFirebaseRaw {
id?: string;
  numeroSolicitud?: string;
  estado: EstadoSolicitud;
  prioridad?: PrioridadSolicitud;
  
  // Referencias
  titularId: string;
  fiadorId?: string;
  vehiculoId: string;
  referenciasIds: string[];
  
  // Información financiera
  precioCompraMoto: number;
  inicial: number;
  montoCuota: number;
  plazoQuincenas: string;
  
  // Vendedor
  vendedorId: string;
  vendedorNombre: string;
  vendedorTienda: string;
  vendedor: {
    id: string;
    nombre: string;
    tienda: string;
  };
  
  mensajeOpcional: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Campos de evaluación
  asesorAsignadoId?: string;
  evaluadorActualId?: string;
  fechaAsignacion?: Timestamp;
  fechaLimiteEvaluacion?: Timestamp;
  tiempoEnEtapaActual?: number;
  tiempoTotalProceso?: number;
  
  // Scores
  scoreDocumental?: number;
  scoreCentrales?: number;
  scoreGarantes?: number;
  scoreEntrevista?: number;
  scoreFinal?: number;
  
  // Decisión
  decisionFinal?: 'aprobado' | 'rechazado' | 'condicional';
  montoAprobado?: number;
  tasaInteresAprobada?: number;
  condicionesEspeciales?: string[];
  motivoRechazo?: string;
  
  // Control
  nivelRiesgo?: 'bajo' | 'medio' | 'alto';
  requiereAprobacionSupervisor?: boolean;
  aprobadoPorSupervisor?: boolean;
  supervisorId?: string;
  
  // Notificaciones
  notificacionesEnviadas?: string[];
  ultimaNotificacionFecha?: Timestamp;
  clienteContactado?: boolean;
  fechaUltimoContacto?: Timestamp;
  
  // Documentos
  documentosValidados?: number;
  documentosPendientes?: number;
  certificadoGenerado?: boolean;
  urlCertificado?: string;
  contratoGenerado?: boolean;
  urlContrato?: string;
  
  // Entrega
  fechaEntregaProgramada?: Timestamp;
  lugarEntrega?: string;
  responsableEntrega?: string;
  entregaCompletada?: boolean;
  fechaEntregaReal?: Timestamp;
  
  // Observaciones
  observacionesGenerales?: string;
  comentariosInternos?: string;
  requiereAtencionEspecial?: boolean;
  motivoAtencionEspecial?: string;
  
  // Auditoría
  creadoPor?: string;
  ultimaModificacionPor?: string;
  ipCreacion?: string;
  ipUltimaModificacion?: string;
}


// Interface parseada para uso en componentes
export interface SolicitudCredito {
  id: string;
  
  // Información básica
  numeroSolicitud: string;
  estado: EstadoSolicitud;
  prioridad: PrioridadSolicitud;
  
  // Referencias
  titularId: string;
  fiadorId?: string;
  vehiculoId: string;
  referenciasIds: string[];
  
  // Información financiera
  precioCompraMoto: number;
  inicial: number;
  montoCuota: number;
  plazoQuincenas: number;               // Convertido a number
  
  // Vendedor
  vendedorId: string;
  vendedorNombre: string;
  vendedorTienda: string;
  vendedor: {
    id: string;
    nombre: string;
    tienda: string;
  };
  
  mensajeOpcional: string;
  
  // Fechas (convertidas de Timestamp)
  fechaCreacion: Date;
  fechaActualizacion: Date;
  
  // Campos de trazabilidad
  asesorAsignadoId?: string;
  evaluadorActualId?: string;
  fechaAsignacion?: Date;
  fechaLimiteEvaluacion?: Date;
  tiempoEnEtapaActual?: number;
  tiempoTotalProceso?: number;
  
  // Scores
  scoreDocumental?: number;
  scoreCentrales?: number;
  scoreGarantes?: number;
  scoreEntrevista?: number;
  scoreFinal?: number;
  
  // Decisión
  decisionFinal?: 'aprobado' | 'rechazado' | 'condicional';
  montoAprobado?: number;
  tasaInteresAprobada?: number;
  condicionesEspeciales?: string[];
  motivoRechazo?: string;
  
  // Control
  nivelRiesgo?: 'bajo' | 'medio' | 'alto';
  requiereAprobacionSupervisor?: boolean;
  aprobadoPorSupervisor?: boolean;
  supervisorId?: string;
  
  // Comunicación
  notificacionesEnviadas?: string[];
  ultimaNotificacionFecha?: Date;
  clienteContactado?: boolean;
  fechaUltimoContacto?: Date;
  
  // Documentos
  documentosValidados?: number;
  documentosPendientes?: number;
  certificadoGenerado?: boolean;
  urlCertificado?: string;
  contratoGenerado?: boolean;
  urlContrato?: string;
  
  // Entrega
  fechaEntregaProgramada?: Date;
  lugarEntrega?: string;
  responsableEntrega?: string;
  entregaCompletada?: boolean;
  fechaEntregaReal?: Date;
  
  // Observaciones
  observacionesGenerales?: string;
  comentariosInternos?: string;
  requiereAtencionEspecial?: boolean;
  motivoAtencionEspecial?: string;
  
  // Auditoría
  creadoPor?: string;
  ultimaModificacionPor?: string;
  ipCreacion?: string;
  ipUltimaModificacion?: string;
  
  // === CAMPOS CALCULADOS (NO EN FIREBASE) ===
  montoFinanciado: number;              // precioCompraMoto - inicial
  totalAPagar: number;                  // montoCuota * plazoQuincenas
  diasEnEstado: number;                 // Días en estado actual
  porcentajeProgreso: number;           // % de avance del proceso
  estaVencido: boolean;                 // Si excedió tiempo límite
  requiereAccion: boolean;              // Si necesita acción inmediata
}

// ==================================================
// 3. INTERFACE TABLA CLIENTES_V1 (TITULARES Y FIADORES)
// ==================================================

export interface ClienteFirebaseRaw {
id?: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  documentType: string;
  documentNumber: string;
  email: string;
  telefono1: string;
  telefono2: string;
  fechaNacimiento: string;
  estadoCivil: string;
  ocupacion?: string;
  rangoIngresos?: string;
  
  // Ubicación
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  tipoVivienda: string;
  
  // Licencia
  licenciaConducir: string;
  numeroLicencia: string;
  
  // Archivos
  archivos?: {
    selfie?: string;
    dniFrente?: string;
    dniReverso?: string;
    reciboServicio?: string;
    fachada?: string;
  };
  
  tipo: 'titular' | 'fiador';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Campos de evaluación
  estadoValidacionDocumentos?: EstadoDocumento;
  documentosObservados?: string[];
  fechaValidacionDocumentos?: Timestamp;
  validadoPorId?: string;
  datosVerificados?: boolean;
  fechaVerificacionDatos?: Timestamp;
  verificadoPorId?: string;
  inconsistenciasEncontradas?: string[];
  consultaCentralesRealizada?: boolean;
  fechaConsultaCentrales?: Timestamp;
  resultadoCentrales?: {
    equifax?: 'normal' | 'alerta' | 'rechazo';
    experian?: 'normal' | 'alerta' | 'rechazo';
    dataCredito?: 'normal' | 'alerta' | 'rechazo';
    scoreSBS?: number;
  };
  capacidadAval?: number;
  relacionConTitular?: string;
  tiempoConoceTitular?: string;
  aceptaResponsabilidad?: boolean;
  ingresosVerificados?: boolean;
  metodosVerificacionIngresos?: string[];
  montoIngresosVerificado?: number;
  solicitudesAnteriores?: number;
  historialPagos?: 'excelente' | 'bueno' | 'regular' | 'malo';
  clienteFrecuente?: boolean;
  requiereValidacionAdicional?: boolean;
  motivoValidacionAdicional?: string;
  nivelConfianza?: 'alto' | 'medio' | 'bajo';
  prefiereWhatsapp?: boolean;
  horariosContacto?: string;
  contactoAlternativo?: string;
  observacionesEvaluador?: string;
  alertasEspeciales?: string[];
  requiereAtencionPersonalizada?: boolean;
  ultimaModificacionPor: 'usuario_actual' // TODO: obtener del servicio de auth
}

// Interface parseada
export interface Cliente {
  id: string;
  
  // Información personal
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  documentType: string;
  documentNumber: string;
  email: string;
  telefono1: string;
  telefono2: string;
  fechaNacimiento: Date;                // Convertido a Date
  estadoCivil: string;
  ocupacion?: string;
  rangoIngresos?: string;
  
  // Ubicación
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  tipoVivienda: string;
  
  // Licencia
  licenciaConducir: string;
  numeroLicencia: string;
  
  // Archivos
  archivos: {
    selfie: string;
    dniFrente: string;
    dniReverso: string;
    reciboServicio: string;
    fachada: string;
  };
  
  tipo: 'titular' | 'fiador';
  
  // Fechas
  fechaCreacion: Date;
  fechaActualizacion: Date;
  
  // Campos de evaluación (convertidos)
  estadoValidacionDocumentos?: EstadoDocumento;
  documentosObservados?: string[];
  fechaValidacionDocumentos?: Date;
  validadoPorId?: string;
  datosVerificados?: boolean;
  fechaVerificacionDatos?: Date;
  verificadoPorId?: string;
  inconsistenciasEncontradas?: string[];
  consultaCentralesRealizada?: boolean;
  fechaConsultaCentrales?: Date;
  resultadoCentrales?: {
    equifax?: 'normal' | 'alerta' | 'rechazo';
    experian?: 'normal' | 'alerta' | 'rechazo';
    dataCredito?: 'normal' | 'alerta' | 'rechazo';
    scoreSBS?: number;
  };
  capacidadAval?: number;
  relacionConTitular?: string;
  tiempoConoceTitular?: string;
  aceptaResponsabilidad?: boolean;
  ingresosVerificados?: boolean;
  metodosVerificacionIngresos?: string[];
  montoIngresosVerificado?: number;
  solicitudesAnteriores?: number;
  historialPagos?: 'excelente' | 'bueno' | 'regular' | 'malo';
  clienteFrecuente?: boolean;
  requiereValidacionAdicional?: boolean;
  motivoValidacionAdicional?: string;
  nivelConfianza?: 'alto' | 'medio' | 'bajo';
  prefiereWhatsapp?: boolean;
  horariosContacto?: string;
  contactoAlternativo?: string;
  observacionesEvaluador?: string;
  alertasEspeciales?: string[];
  requiereAtencionPersonalizada?: boolean;
  
  // === CAMPOS CALCULADOS ===
  nombreCompleto: string;               // Nombres + apellidos
  apellidosCompletos: string;
  edad: number;
  direccionCompleta: string;
  tieneDocumentosCompletos: boolean;
  estadoLicencia: 'vigente' | 'vencida' | 'sin_licencia';
  rangoIngresosNumerico: { min: number; max: number };
  puntajeConfiabilidad: number;         // 0-100 basado en validaciones
  esAptoCrediticiamente: boolean;       // Evaluación general
}

// ==================================================
// 4. INTERFACE TABLA VEHICULOS
// ==================================================

export interface VehiculoFirebaseRaw {
   id?: string;
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  categoria?: 'motoneta' | 'motocicleta' | 'trimoto';
  cilindraje?: string;
  precioReferencial?: number;
  disponibleStock?: boolean;
  tiempoEntregaEstimado?: number;
  requiereMantenimiento?: boolean;
  garantiaMeses?: number;
  accesoriosIncluidos?: string[];
  condicion?: 'nuevo' | 'seminuevo' | 'usado';
  kilometraje?: number;
  numeroSerie?: string;
  numeroMotor?: string;
  placas?: string;
  seguroIncluido?: boolean;
  tramiteDocumentario?: boolean;
}

export interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  anio: number;                         // Convertido a number
  color: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  categoria?: 'motoneta' | 'motocicleta' | 'trimoto';
  cilindraje?: string;
  precioReferencial?: number;
  disponibleStock?: boolean;
  tiempoEntregaEstimado?: number;
  requiereMantenimiento?: boolean;
  garantiaMeses?: number;
  accesoriosIncluidos?: string[];
  condicion?: 'nuevo' | 'seminuevo' | 'usado';
  kilometraje?: number;
  numeroSerie?: string;
  numeroMotor?: string;
  placas?: string;
  seguroIncluido?: boolean;
  tramiteDocumentario?: boolean;
  
  // === CAMPOS CALCULADOS ===
  descripcionCompleta: string;          // "Honda Wave 110cc 2024 - Verde"
  esNuevo: boolean;
  antiguedad: number;
  valorDepreciado: number;              // Valor actual considerando depreciación
  requiereInspeccion: boolean;
}

// ==================================================
// 5. INTERFACE TABLA REFERENCIAS
// ==================================================

export interface ReferenciaFirebaseRaw {
  id?: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  parentesco: string;
  titularId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  estadoVerificacion?: 'pendiente' | 'contactado' | 'verificado' | 'no_contactado' | 'rechazado';
  fechaContacto?: Timestamp;
  verificadoPorId?: string;
  intentosContacto?: number;
  horariosContacto?: string;
  resultadoVerificacion?: {
    conoceTitular: boolean;
    tiempoConocimiento: string;
    relacion: 'muy_buena' | 'buena' | 'regular' | 'mala';
    recomendaria: boolean;
    observaciones: string;
    confiabilidad: number;
  };
  telefonoAlternativo?: string;
  email?: string;
  direccion?: string;
  ocupacion?: string;
  esReferenciaLaboral?: boolean;
  empresaTrabaja?: string;
  cargoEmpresa?: string;
  confirmoDatos?: boolean;
  proporcionoInformacionAdicional?: string;
  nivelCooperacion?: 'alto' | 'medio' | 'bajo';
  requiereReverificacion?: boolean;
}

export interface Referencia {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  parentesco: string;
  titularId: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  estadoVerificacion?: 'pendiente' | 'contactado' | 'verificado' | 'no_contactado' | 'rechazado';
  fechaContacto?: Date;
  verificadoPorId?: string;
  intentosContacto?: number;
  horariosContacto?: string;
  resultadoVerificacion?: {
    conoceTitular: boolean;
    tiempoConocimiento: string;
    relacion: 'muy_buena' | 'buena' | 'regular' | 'mala';
    recomendaria: boolean;
    observaciones: string;
    confiabilidad: number;
  };
  telefonoAlternativo?: string;
  email?: string;
  direccion?: string;
  ocupacion?: string;
  esReferenciaLaboral?: boolean;
  empresaTrabaja?: string;
  cargoEmpresa?: string;
  confirmoDatos?: boolean;
  proporcionoInformacionAdicional?: string;
  nivelCooperacion?: 'alto' | 'medio' | 'bajo';
  requiereReverificacion?: boolean;
  
  // === CAMPOS CALCULADOS ===
  nombreCompleto: string;
  esContactoValido: boolean;
  tipoParentesco: 'familiar' | 'amigo' | 'laboral' | 'otro';
  puntajeReferencia: number;            // 0-100 basado en verificación
  esReferenciaConfiable: boolean;
}

// ==================================================
// 6. INTERFACES ADICIONALES PARA TRAZABILIDAD
// ==================================================

// Historial de cambios de estado
export interface HistorialEstado {
  id?: string;
  solicitudId: string;
  estadoAnterior?: EstadoSolicitud;
  estadoNuevo: EstadoSolicitud;
  fechaCambio: Date;
  usuarioId: string;
  usuarioNombre: string;
  motivo?: string;
  observaciones?: string;
  ip?: string;
  tiempoEnEstadoAnterior?: number;      // Minutos en el estado anterior
}

// Evaluaciones por etapa
export interface Evaluacion {
  id?: string;
  solicitudId: string;
  tipoEvaluacion: TipoEvaluacion;
  evaluadorId: string;
  evaluadorNombre: string;
  fechaInicio: Date;
  fechaFin?: Date;
  estado: EstadoEvaluacion;
  score?: number;                       // 0-100
  observaciones?: string;
  recomendacion?: string;
  archivosAdjuntos?: string[];
  tiempoEmpleado?: number;              // Minutos empleados
  requiereRevision?: boolean;
  revisadoPorId?: string;
  fechaRevision?: Date;
}

// Notificaciones enviadas
export interface Notificacion {
  id?: string;
  solicitudId: string;
  destinatario: string;                 // Email o teléfono
  tipoNotificacion: string;             // "email", "sms", "whatsapp"
  plantillaUsada: string;
  asunto?: string;
  mensaje: string;
  fechaEnvio: Date;
  estadoEntrega: 'enviado' | 'entregado' | 'fallido';
  intentosEnvio: number;
  creadoPorId: string;
}

// Documentos del proceso
export interface DocumentoProceso {
  id?: string;
  solicitudId: string;
  tipoDocumento: TipoDocumento;
  nombreArchivo: string;
  urlArchivo: string;
  tamaño: number;                       // Bytes
  fechaSubida: Date;
  subidoPorId: string;
  estado: EstadoDocumento;
  observaciones?: string;
  fechaValidacion?: Date;
  validadoPorId?: string;
  version: number;                      // Para control de versiones
  esVersionFinal: boolean;
}

// ==================================================
// 7. INTERFACE SOLICITUD COMPLETA (CON TODAS LAS RELACIONES)
// ==================================================

export interface SolicitudCreditoCompleta extends SolicitudCredito {
  // Datos relacionados cargados (opcionales)
  titular?: Cliente;
  fiador?: Cliente;
  vehiculo?: Vehiculo;
  referencias?: Referencia[];
  
  // Historial y evaluaciones (opcionales)
  historialEstados?: HistorialEstado[];
  evaluaciones?: Evaluacion[];
  notificaciones?: Notificacion[];
  documentosProceso?: DocumentoProceso[];
  
  // Estado de carga (obligatorios)
  datosCompletos: boolean;
  cargandoDatos: boolean;
  errorCarga?: string;
  
  // Información del asesor/evaluador actual (opcionales)
  asesorAsignado?: {
    id: string;
    nombre: string;
    email: string;
    rol: RolUsuario;
  };

  evaluadorActual?: AsesorSeleccionado[];

  // === CAMPOS CALCULADOS AVANZADOS (OBLIGATORIOS) ===
  resumenEvaluacion: {
    porcentajeDocumentosValidados: number;
    porcentajeReferenciasVerificadas: number;
    scorePromedioReferencias: number;
    nivelRiesgoCalculado: 'bajo' | 'medio' | 'alto';
    probabilidadAprobacion: number;
    recomendacionSistema: 'aprobar' | 'rechazar' | 'revisar';
  };
  
  alertas: {
    documentosVencidos: string[];
    tiemposExcedidos: string[];
    inconsistenciasDetectadas: string[];
    requiereAtencionUrgente: boolean;
  };
  
  metricas: {
    tiempoPromedioRespuesta: number;
    eficienciaProces: number;
    satisfaccionCliente?: number;
  };
}




// ======================================
// EXPEDIENTE COMPLETO (PARA EL MÓDULO)
// ======================================

export interface ExpedienteCompleto {
  // Datos principales
  solicitud: SolicitudCredito;
  titular: Cliente;
  fiador?: Cliente;
  vehiculo: Vehiculo;
  referencias: Referencia[];
  
  // Trazabilidad
  historialEstados: HistorialEstado[];
  evaluaciones: Evaluacion[];
  documentosProceso?: DocumentoProceso[];
  
  // Estado de carga
  datosCompletos: boolean;
  cargandoDatos: boolean;
  errorCarga?: string;
  
  // Información de usuarios
  asesorAsignado?: {
    id: string;
    nombre: string;
    email: string;
    rol: RolUsuario;
  };

  evaluadorActual?: AsesorSeleccionado[];

  // Resumen de evaluación
  resumenEvaluacion: {
    porcentajeDocumentosValidados: number;
    porcentajeReferenciasVerificadas: number;
    scorePromedioReferencias: number;
    nivelRiesgoCalculado: 'bajo' | 'medio' | 'alto';
    probabilidadAprobacion: number;
    recomendacionSistema: 'aprobar' | 'rechazar' | 'revisar';
  };
  
  // Alertas del sistema
  alertas: {
    documentosVencidos: string[];
    tiemposExcedidos: string[];
    inconsistenciasDetectadas: string[];
    requiereAtencionUrgente: boolean;
  };
  
  // Métricas del proceso
  metricas: {
    tiempoPromedioRespuesta: number;
    eficienciaProceso: number;
    satisfaccionCliente?: number;
  };
}

// ======================================
// CONFIGURACIÓN DE ESTADOS
// ======================================

export const ESTADOS_CONFIG = {
  pendiente: { 
    label: 'Pendiente', 
    color: 'grey', 
    icon: 'schedule',
    tiempoLimite: 4,
    fase: 'inicial'
  },
  en_revision_inicial: { 
    label: 'En Revisión Inicial', 
    color: 'blue', 
    icon: 'search',
    tiempoLimite: 8,
    fase: 'evaluacion'
  },
  evaluacion_documental: { 
    label: 'Evaluación Documental', 
    color: 'orange', 
    icon: 'fact_check',
    tiempoLimite: 24,
    fase: 'evaluacion'
  },
  documentos_observados: { 
    label: 'Documentos Observados', 
    color: 'red', 
    icon: 'error',
    tiempoLimite: 48,
    fase: 'evaluacion'
  },
  evaluacion_garantes: { 
    label: 'Evaluación Garantes', 
    color: 'purple', 
    icon: 'people',
    tiempoLimite: 24,
    fase: 'evaluacion'
  },
  garante_rechazado: { 
    label: 'Garante Rechazado', 
    color: 'red', 
    icon: 'person_off',
    tiempoLimite: 24,
    fase: 'evaluacion'
  },
  entrevista_programada: { 
    label: 'Entrevista Programada', 
    color: 'indigo', 
    icon: 'event',
    tiempoLimite: 48,
    fase: 'entrevista'
  },
  en_entrevista: { 
    label: 'En Entrevista', 
    color: 'indigo', 
    icon: 'record_voice_over',
    tiempoLimite: 4,
    fase: 'entrevista'
  },
  entrevista_completada: { 
    label: 'Entrevista Completada', 
    color: 'green', 
    icon: 'task_alt',
    tiempoLimite: 8,
    fase: 'entrevista'
  },
  en_decision: { 
    label: 'En Decisión', 
    color: 'amber', 
    icon: 'gavel',
    tiempoLimite: 12,
    fase: 'decision'
  },
  aprobado: { 
    label: 'Aprobado', 
    color: 'green', 
    icon: 'check_circle',
    tiempoLimite: 24,
    fase: 'aprobacion'
  },
  rechazado: { 
    label: 'Rechazado', 
    color: 'red', 
    icon: 'cancel',
    tiempoLimite: null,
    fase: 'final'
  },
  condicional: { 
    label: 'Aprobado Condicional', 
    color: 'orange', 
    icon: 'help',
    tiempoLimite: 48,
    fase: 'aprobacion'
  },
  certificado_generado: { 
    label: 'Certificado Generado', 
    color: 'green', 
    icon: 'verified',
    tiempoLimite: 24,
    fase: 'documentacion'
  },
  esperando_inicial: { 
    label: 'Esperando Pago Inicial', 
    color: 'orange', 
    icon: 'payment',
    tiempoLimite: 72,
    fase: 'pagos'
  },
  inicial_confirmada: { 
    label: 'Inicial Confirmada', 
    color: 'green', 
    icon: 'paid',
    tiempoLimite: 24,
    fase: 'pagos'
  },
  contrato_firmado: { 
    label: 'Contrato Firmado', 
    color: 'green', 
    icon: 'assignment_turned_in',
    tiempoLimite: 48,
    fase: 'documentacion'
  },
  entrega_completada: { 
    label: 'Entrega Completada', 
    color: 'green', 
    icon: 'done_all',
    tiempoLimite: null,
    fase: 'final'
  },
  suspendido: { 
    label: 'Suspendido', 
    color: 'grey', 
    icon: 'pause',
    tiempoLimite: null,
    fase: 'suspendido'
  },
  cancelado: { 
    label: 'Cancelado', 
    color: 'red', 
    icon: 'block',
    tiempoLimite: null,
    fase: 'final'
  }
};

// ======================================
// UTILITARIOS
// ======================================

export const FASES_PROCESO = [
  { id: 'inicial', label: 'Inicio', orden: 1 },
  { id: 'evaluacion', label: 'Evaluación', orden: 2 },
  { id: 'entrevista', label: 'Entrevista', orden: 3 },
  { id: 'decision', label: 'Decisión', orden: 4 },
  { id: 'aprobacion', label: 'Aprobación', orden: 5 },
  { id: 'documentacion', label: 'Documentación', orden: 6 },
  { id: 'pagos', label: 'Pagos', orden: 7 },
  { id: 'final', label: 'Finalización', orden: 8 }
];

export const TRANSICIONES_PERMITIDAS: { [key in EstadoSolicitud]: EstadoSolicitud[] } = {
  pendiente: ['en_revision_inicial', 'cancelado'],
  en_revision_inicial: ['evaluacion_documental', 'rechazado', 'suspendido'],
  evaluacion_documental: ['documentos_observados', 'evaluacion_garantes', 'rechazado'],
  documentos_observados: ['evaluacion_documental', 'rechazado', 'cancelado'],
  evaluacion_garantes: ['garante_rechazado', 'entrevista_programada', 'rechazado'],
  garante_rechazado: ['evaluacion_garantes', 'rechazado'],
  entrevista_programada: ['en_entrevista', 'rechazado', 'suspendido'],
  en_entrevista: ['entrevista_completada', 'rechazado'],
  entrevista_completada: ['en_decision'],
  en_decision: ['aprobado', 'rechazado', 'condicional'],
  aprobado: ['certificado_generado'],
  rechazado: [],
  condicional: ['aprobado', 'rechazado'],
  certificado_generado: ['esperando_inicial'],
  esperando_inicial: ['inicial_confirmada', 'cancelado'],
  inicial_confirmada: ['contrato_firmado'],
  contrato_firmado: ['entrega_completada'],
  entrega_completada: [],
  suspendido: ['en_revision_inicial', 'cancelado'],
  cancelado: []
};

export const ACCIONES_POR_ESTADO: { [key in EstadoSolicitud]: string[] } = {
  pendiente: ['Asignar Asesor', 'Cancelar'],
  en_revision_inicial: ['Iniciar Evaluación Documental', 'Rechazar', 'Suspender'],
  evaluacion_documental: ['Aprobar Documentos', 'Observar Documentos', 'Evaluar Garantes', 'Rechazar'],
  documentos_observados: ['Revisar Correcciones', 'Rechazar', 'Cancelar'],
  evaluacion_garantes: ['Aprobar Garante', 'Rechazar Garante', 'Programar Entrevista', 'Rechazar'],
  garante_rechazado: ['Cambiar Garante', 'Rechazar Solicitud'],
  entrevista_programada: ['Realizar Entrevista', 'Rechazar', 'Suspender'],
  en_entrevista: ['Completar Entrevista', 'Rechazar'],
  entrevista_completada: ['Enviar a Decisión'],
  en_decision: ['Aprobar', 'Rechazar', 'Aprobar Condicional'],
  aprobado: ['Generar Certificado'],
  rechazado: [],
  condicional: ['Aprobar Definitivamente', 'Rechazar'],
  certificado_generado: ['Notificar Cliente'],
  esperando_inicial: ['Confirmar Pago', 'Cancelar'],
  inicial_confirmada: ['Generar Contrato'],
  contrato_firmado: ['Programar Entrega'],
  entrega_completada: [],
  suspendido: ['Reactivar', 'Cancelar'],
  cancelado: []
};

