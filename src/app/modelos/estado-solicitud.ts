// ======================================
// ENUMS Y TIPOS DE DOMINIO
// ======================================

export enum EstadoSolicitud {
  // Etapa 1: Captura inicial
  PENDIENTE = 'pendiente',
  
  // Etapa 2: Asignación y revisión preliminar
  EN_REVISION_INICIAL = 'en_revision_inicial',
  
  // Etapa 3: Evaluación documental
  EVALUACION_DOCUMENTAL = 'evaluacion_documental',
  DOCUMENTOS_OBSERVADOS = 'documentos_observados',
  
  // Etapa 4: Evaluación de garantes
  EVALUACION_GARANTES = 'evaluacion_garantes',
  GARANTE_RECHAZADO = 'garante_rechazado',
  
  // Etapa 5: Entrevista virtual
  ENTREVISTA_PROGRAMADA = 'entrevista_programada',
  EN_ENTREVISTA = 'en_entrevista',
  ENTREVISTA_COMPLETADA = 'entrevista_completada',
  
  // Etapa 6: Decisión final
  EN_DECISION = 'en_decision',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  CONDICIONAL = 'condicional',
  
  // Etapa 7: Generación de documentos
  CERTIFICADO_GENERADO = 'certificado_generado',
  
  // Etapa 8: Confirmación de inicial
  ESPERANDO_INICIAL = 'esperando_inicial',
  INICIAL_CONFIRMADA = 'inicial_confirmada',
  
  // Etapa 9: Firma de contrato
  CONTRATO_FIRMADO = 'contrato_firmado',
  
  // Etapa 10: Entrega
  ENTREGA_COMPLETADA = 'entrega_completada',
  
  // Estados especiales
  SUSPENDIDO = 'suspendido',
  CANCELADO = 'cancelado'
}

export enum EstadoDocumento {
  NO_SUBIDO = 'no_subido',
  SUBIDO = 'subido',
  EN_EVALUACION = 'en_evaluacion',
  APROBADO = 'aprobado',
  OBSERVADO = 'observado',
  RECHAZADO = 'rechazado'
}

export enum TipoDocumento {
  // Documentos básicos
  SELFIE = 'selfie',
  DNI_FRENTE = 'dni_frente',
  DNI_REVERSO = 'dni_reverso',
  
  // Documentos de evaluación
  RECIBO_SERVICIO = 'recibo_servicio',
  FACHADA_VIVIENDA = 'fachada_vivienda',
  LICENCIA_CONDUCIR = 'licencia_conducir',
  CONSTANCIA_TRABAJO = 'constancia_trabajo',
  RECIBOS_SUELDO = 'recibos_sueldo',
  
  // Documentos del proceso
  VOUCHER_INICIAL = 'voucher_inicial',
  CONTRATO_FIRMADO = 'contrato_firmado',
  ACTA_ENTREGA = 'acta_entrega',
  
  // Otros
  OTROS = 'otros'
}

export enum TipoPersona {
  TITULAR = 'titular',
  FIADOR = 'fiador'
}

export enum RolSistema {
  VENDEDOR = 'vendedor',
  ASESOR_ADMISION = 'asesor_admision',
  EVALUADOR_DOCUMENTAL = 'evaluador_documental',
  EVALUADOR_GARANTES = 'evaluador_garantes',
  ENTREVISTADOR = 'entrevistador',
  OFICIAL_CREDITO = 'oficial_credito',
  SUPERVISOR = 'supervisor',
  AREA_FINANCIERA = 'area_financiera',
  PERSONAL_TIENDA = 'personal_tienda'
}

export enum Prioridad {
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja'
}