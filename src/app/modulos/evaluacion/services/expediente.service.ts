import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, forkJoin, map, tap, switchMap, of } from 'rxjs';
import { 
  Firestore, 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  getDocs 
} from '@angular/fire/firestore';
import { ACCIONES_POR_ESTADO, Cliente, ClienteFirebaseRaw, DocumentoProceso, ESTADOS_CONFIG, EstadoSolicitud, Evaluacion, ExpedienteCompleto, HistorialEstado, Referencia, ReferenciaFirebaseRaw, SolicitudCredito, SolicitudFirebaseRaw, TRANSICIONES_PERMITIDAS, Vehiculo, VehiculoFirebaseRaw } from '../../admin-clientes/modelos/modelos-solicitudes';


@Injectable({
  providedIn: 'root'
})
export class ExpedienteService {

  private expedienteActual = new BehaviorSubject<ExpedienteCompleto | null>(null);
  private cargando = new BehaviorSubject<boolean>(false);
  private error = new BehaviorSubject<string | null>(null);

  public expediente$ = this.expedienteActual.asObservable();
  public cargando$ = this.cargando.asObservable();
  public error$ = this.error.asObservable();

  constructor(private firestore: Firestore) {}

  // ======================================
  // MÉTODOS PRINCIPALES
  // ======================================

  obtenerExpedienteCompleto(solicitudId: string): Observable<ExpedienteCompleto> {
    this.cargando.next(true);
    this.error.next(null);

    return this.obtenerSolicitud(solicitudId).pipe(
      switchMap(solicitud => {
        if (!solicitud) {
          throw new Error('Solicitud no encontrada');
        }

        // Obtener todos los datos relacionados en paralelo
        return forkJoin({
          solicitud: of(solicitud),
          titular: this.obtenerCliente(solicitud.titularId),
          fiador: solicitud.fiadorId ? this.obtenerCliente(solicitud.fiadorId) : of(undefined),
          vehiculo: this.obtenerVehiculo(solicitud.vehiculoId),
          referencias: this.obtenerReferencias(solicitud.referenciasIds),
          historialEstados: this.obtenerHistorialEstados(solicitudId),
          evaluaciones: this.obtenerEvaluaciones(solicitudId),
          documentosProceso: this.obtenerDocumentosProceso(solicitudId)
        });
      }),
      map(datos => this.construirExpedienteCompleto(datos)),
      tap(expediente => {
        this.expedienteActual.next(expediente);
        this.cargando.next(false);
      })
    );
  }

  // ======================================
  // OBTENCIÓN DE DATOS INDIVIDUALES
  // ======================================

  private obtenerSolicitud(id: string): Observable<SolicitudCredito> {
    const solicitudRef = doc(this.firestore, `solicitudes/${id}`);
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(solicitudRef, 
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as SolicitudFirebaseRaw;
            const solicitud = this.mapearSolicitud(data, id);
            observer.next(solicitud);
            console.log('Solicitud encontrada:', solicitud);
          } else {
            observer.error('Solicitud no encontrada');
          }
        },
        (error) => observer.error(error)
      );
      return () => unsubscribe();
    });
  }

  private obtenerCliente(clienteId: string): Observable<Cliente> {
    const clienteRef = doc(this.firestore, `clientes_v1/${clienteId}`);
    
    return new Observable(observer => {
      getDoc(clienteRef).then(docSnapshot => {
        if (docSnapshot.exists()) {
          console.log('Cliente raw Firestore:', docSnapshot.data());
          const data = docSnapshot.data() as ClienteFirebaseRaw;
          const cliente = this.mapearCliente(data, clienteId);
          observer.next(cliente);
          observer.complete();
        } else {
          observer.error('Cliente no encontrado');
        }
      }).catch(error => observer.error(error));
    });
  }

  private obtenerVehiculo(vehiculoId: string): Observable<Vehiculo> {
    const vehiculoRef = doc(this.firestore, `vehiculos/${vehiculoId}`);
    
    return new Observable(observer => {
      getDoc(vehiculoRef).then(docSnapshot => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as VehiculoFirebaseRaw;
          const vehiculo = this.mapearVehiculo(data, vehiculoId);
          observer.next(vehiculo);
          observer.complete();
        } else {
          observer.error('Vehículo no encontrado');
        }
      }).catch(error => observer.error(error));
    });
  }

  private obtenerReferencias(referenciasIds: string[]): Observable<Referencia[]> {
    if (!referenciasIds || referenciasIds.length === 0) {
      return of([]);
    }

    const referenciasPromises = referenciasIds.map(id => {
      const referenciaRef = doc(this.firestore, `referencias/${id}`);
      return getDoc(referenciaRef);
    });

    return new Observable(observer => {
      Promise.all(referenciasPromises).then(snapshots => {
        const referencias = snapshots
          .filter(snapshot => snapshot.exists())
          .map(snapshot => {
            const data = snapshot.data() as ReferenciaFirebaseRaw;
            return this.mapearReferencia(data, snapshot.id);
          });
        
        observer.next(referencias);
        observer.complete();
      }).catch(error => observer.error(error));
    });
  }

  private obtenerHistorialEstados(solicitudId: string): Observable<HistorialEstado[]> {
    const historialQuery = query(
      collection(this.firestore, 'historial_estados'),
      where('solicitudId', '==', solicitudId)
    );

    return new Observable(observer => {
      getDocs(historialQuery).then(querySnapshot => {
        const historial = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            fechaCambio: data['fechaCambio']?.toDate() || new Date()
          } as HistorialEstado;
        });
        
        // Ordenar por fecha
        historial.sort((a, b) => a.fechaCambio.getTime() - b.fechaCambio.getTime());
        observer.next(historial);
        observer.complete();
      }).catch(error => observer.error(error));
    });
  }

  private obtenerEvaluaciones(solicitudId: string): Observable<Evaluacion[]> {
    const evaluacionesQuery = query(
      collection(this.firestore, 'evaluaciones'),
      where('solicitudId', '==', solicitudId)
    );

    return new Observable(observer => {
      getDocs(evaluacionesQuery).then(querySnapshot => {
        const evaluaciones = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            fechaInicio: data['fechaInicio']?.toDate() || new Date(),
            fechaFin: data['fechaFin']?.toDate(),
            fechaRevision: data['fechaRevision']?.toDate()
          } as Evaluacion;
        });
        
        observer.next(evaluaciones);
        observer.complete();
      }).catch(error => observer.error(error));
    });
  }

  private obtenerDocumentosProceso(solicitudId: string): Observable<DocumentoProceso[]> {
    const documentosQuery = query(
      collection(this.firestore, 'documentos_proceso'),
      where('solicitudId', '==', solicitudId)
    );

    return new Observable(observer => {
      getDocs(documentosQuery).then(querySnapshot => {
        const documentos = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            fechaSubida: data['fechaSubida']?.toDate() || new Date(),
            fechaValidacion: data['fechaValidacion']?.toDate()
          } as DocumentoProceso;
        });
        
        observer.next(documentos);
        observer.complete();
      }).catch(error => observer.error(error));
    });
  }

  // ======================================
  // MAPEO DE DATOS
  // ======================================

  private mapearSolicitud(data: SolicitudFirebaseRaw, id: string): SolicitudCredito {
    const ahora = new Date();
    const fechaCreacion = data.createdAt?.toDate() || ahora;
    const fechaActualizacion = data.updatedAt?.toDate() || ahora;

    return {
      id,
      numeroSolicitud: data.numeroSolicitud || `SOL-${id.substring(0, 8).toUpperCase()}`,
      estado: data.estado,
      prioridad: data.prioridad || 'Media',
      titularId: data.titularId,
      fiadorId: data.fiadorId,
      vehiculoId: data.vehiculoId,
      referenciasIds: data.referenciasIds || [],
      precioCompraMoto: data.precioCompraMoto,
      inicial: data.inicial,
      montoCuota: data.montoCuota,
      plazoQuincenas: parseInt(data.plazoQuincenas) || 0,
      vendedorId: data.vendedorId,
      vendedorNombre: data.vendedorNombre,
      vendedorTienda: data.vendedorTienda,
      vendedor: data.vendedor,
      mensajeOpcional: data.mensajeOpcional || '',
      fechaCreacion,
      fechaActualizacion,
      
      // Campos de evaluación
      asesorAsignadoId: data.asesorAsignadoId,
      evaluadorActualId: data.evaluadorActualId,
      fechaAsignacion: data.fechaAsignacion?.toDate(),
      fechaLimiteEvaluacion: data.fechaLimiteEvaluacion?.toDate(),
      tiempoEnEtapaActual: data.tiempoEnEtapaActual,
      tiempoTotalProceso: data.tiempoTotalProceso,
      
      // Scores
      scoreDocumental: data.scoreDocumental,
      scoreCentrales: data.scoreCentrales,
      scoreGarantes: data.scoreGarantes,
      scoreEntrevista: data.scoreEntrevista,
      scoreFinal: data.scoreFinal,
      
      // Decisión
      decisionFinal: data.decisionFinal,
      montoAprobado: data.montoAprobado,
      tasaInteresAprobada: data.tasaInteresAprobada,
      condicionesEspeciales: data.condicionesEspeciales,
      motivoRechazo: data.motivoRechazo,
      
      // Control
      nivelRiesgo: data.nivelRiesgo,
      requiereAprobacionSupervisor: data.requiereAprobacionSupervisor,
      aprobadoPorSupervisor: data.aprobadoPorSupervisor,
      supervisorId: data.supervisorId,
      
      // Comunicación
      notificacionesEnviadas: data.notificacionesEnviadas,
      ultimaNotificacionFecha: data.ultimaNotificacionFecha?.toDate(),
      clienteContactado: data.clienteContactado,
      fechaUltimoContacto: data.fechaUltimoContacto?.toDate(),
      
      // Documentos
      documentosValidados: data.documentosValidados,
      documentosPendientes: data.documentosPendientes,
      certificadoGenerado: data.certificadoGenerado,
      urlCertificado: data.urlCertificado,
      contratoGenerado: data.contratoGenerado,
      urlContrato: data.urlContrato,
      
      // Entrega
      fechaEntregaProgramada: data.fechaEntregaProgramada?.toDate(),
      lugarEntrega: data.lugarEntrega,
      responsableEntrega: data.responsableEntrega,
      entregaCompletada: data.entregaCompletada,
      fechaEntregaReal: data.fechaEntregaReal?.toDate(),
      
      // Observaciones
      observacionesGenerales: data.observacionesGenerales,
      comentariosInternos: data.comentariosInternos,
      requiereAtencionEspecial: data.requiereAtencionEspecial,
      motivoAtencionEspecial: data.motivoAtencionEspecial,
      
      // Auditoría
      creadoPor: data.creadoPor,
      ultimaModificacionPor: data.ultimaModificacionPor,
      ipCreacion: data.ipCreacion,
      ipUltimaModificacion: data.ipUltimaModificacion,
      
      // Campos calculados
      montoFinanciado: data.precioCompraMoto - data.inicial,
      totalAPagar: data.montoCuota * parseInt(data.plazoQuincenas),
      diasEnEstado: Math.floor((ahora.getTime() - fechaActualizacion.getTime()) / (1000 * 60 * 60 * 24)),
      porcentajeProgreso: this.calcularPorcentajeProgreso(data.estado),
      estaVencido: this.verificarVencimiento(data.fechaLimiteEvaluacion?.toDate(), ahora),
      requiereAccion: this.verificarRequiereAccion(data.estado, data.fechaLimiteEvaluacion?.toDate(), ahora)
    };
  }

  private mapearCliente(data: ClienteFirebaseRaw, id: string): Cliente {
    const fechaNacimiento = new Date(data.fechaNacimiento);
    const fechaCreacion = data.createdAt?.toDate() || new Date();
    const fechaActualizacion = data.updatedAt?.toDate() || new Date();

    return {
      id,
      nombres: data.nombres,
      apellidoPaterno: data.apellidoPaterno,
      apellidoMaterno: data.apellidoMaterno,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      email: data.email,
      telefono1: data.telefono1,
      telefono2: data.telefono2,
      fechaNacimiento,
      estadoCivil: data.estadoCivil,
      ocupacion: data.ocupacion  ?? '',
      rangoIngresos: data.rangoIngresos ?? '',
      departamento: data.departamento,
      provincia: data.provincia,
      distrito: data.distrito,
      direccion: data.direccion,
      tipoVivienda: data.tipoVivienda,
      licenciaConducir: data.licenciaConducir,
      numeroLicencia: data.numeroLicencia,
      archivos: {
      selfie: data.archivos?.selfie ?? '',
      dniFrente: data.archivos?.dniFrente ?? '',
      dniReverso: data.archivos?.dniReverso ?? '',
      reciboServicio: data.archivos?.reciboServicio ?? '',
      fachada: data.archivos?.fachada ?? '',
    },
      tipo: data.tipo,
      fechaCreacion,
      fechaActualizacion,
      
      // Campos de evaluación
      estadoValidacionDocumentos: data.estadoValidacionDocumentos,
      documentosObservados: data.documentosObservados,
      fechaValidacionDocumentos: data.fechaValidacionDocumentos?.toDate(),
      validadoPorId: data.validadoPorId,
      datosVerificados: data.datosVerificados,
      fechaVerificacionDatos: data.fechaVerificacionDatos?.toDate(),
      verificadoPorId: data.verificadoPorId,
      inconsistenciasEncontradas: data.inconsistenciasEncontradas,
      consultaCentralesRealizada: data.consultaCentralesRealizada,
      fechaConsultaCentrales: data.fechaConsultaCentrales?.toDate(),
      resultadoCentrales: data.resultadoCentrales,
      capacidadAval: data.capacidadAval,
      relacionConTitular: data.relacionConTitular,
      tiempoConoceTitular: data.tiempoConoceTitular,
      aceptaResponsabilidad: data.aceptaResponsabilidad,
      ingresosVerificados: data.ingresosVerificados,
      metodosVerificacionIngresos: data.metodosVerificacionIngresos,
      montoIngresosVerificado: data.montoIngresosVerificado,
      solicitudesAnteriores: data.solicitudesAnteriores,
      historialPagos: data.historialPagos,
      clienteFrecuente: data.clienteFrecuente,
      requiereValidacionAdicional: data.requiereValidacionAdicional,
      motivoValidacionAdicional: data.motivoValidacionAdicional,
      nivelConfianza: data.nivelConfianza,
      prefiereWhatsapp: data.prefiereWhatsapp,
      horariosContacto: data.horariosContacto,
      contactoAlternativo: data.contactoAlternativo,
      observacionesEvaluador: data.observacionesEvaluador,
      alertasEspeciales: data.alertasEspeciales,
      requiereAtencionPersonalizada: data.requiereAtencionPersonalizada,
      
      // Campos calculados
      nombreCompleto: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`,
      apellidosCompletos: `${data.apellidoPaterno} ${data.apellidoMaterno}`,
      edad: this.calcularEdad(fechaNacimiento),
      direccionCompleta: `${data.direccion}, ${data.distrito}, ${data.provincia}, ${data.departamento}`,
      tieneDocumentosCompletos: this.verificarDocumentosCompletos(data.archivos ?? {}),
      estadoLicencia: this.determinarEstadoLicencia(data.licenciaConducir),
      rangoIngresosNumerico: this.parsearRangoIngresos(data.rangoIngresos ?? ''),
      puntajeConfiabilidad: this.calcularPuntajeConfiabilidad(data),
      esAptoCrediticiamente: this.evaluarAptitudCrediticia(data)
    };
  }

  private mapearVehiculo(data: VehiculoFirebaseRaw, id: string): Vehiculo {
    const anio = parseInt(data.anio);
    const fechaCreacion = data.createdAt?.toDate() || new Date();
    const fechaActualizacion = data.updatedAt?.toDate() || new Date();

    return {
      id,
      marca: data.marca,
      modelo: data.modelo,
      anio,
      color: data.color,
      fechaCreacion,
      fechaActualizacion,
      categoria: data.categoria,
      cilindraje: data.cilindraje,
      precioReferencial: data.precioReferencial,
      disponibleStock: data.disponibleStock,
      tiempoEntregaEstimado: data.tiempoEntregaEstimado,
      requiereMantenimiento: data.requiereMantenimiento,
      garantiaMeses: data.garantiaMeses,
      accesoriosIncluidos: data.accesoriosIncluidos,
      condicion: data.condicion,
      kilometraje: data.kilometraje,
      numeroSerie: data.numeroSerie,
      numeroMotor: data.numeroMotor,
      placas: data.placas,
      seguroIncluido: data.seguroIncluido,
      tramiteDocumentario: data.tramiteDocumentario,
      
      // Campos calculados
      descripcionCompleta: `${data.marca} ${data.modelo} ${data.cilindraje || ''} ${anio} - ${data.color}`,
      esNuevo: data.condicion === 'nuevo',
      antiguedad: new Date().getFullYear() - anio,
      valorDepreciado: this.calcularValorDepreciado(data.precioReferencial || 0, anio),
      requiereInspeccion: data.condicion !== 'nuevo'
    };
  }

  private mapearReferencia(data: ReferenciaFirebaseRaw, id: string): Referencia {
    const fechaCreacion = data.createdAt?.toDate() || new Date();
    const fechaActualizacion = data.updatedAt?.toDate() || new Date();

    return {
      id,
      nombre: data.nombre,
      apellidos: data.apellidos,
      telefono: data.telefono,
      parentesco: data.parentesco,
      titularId: data.titularId,
      fechaCreacion,
      fechaActualizacion,
      estadoVerificacion: data.estadoVerificacion,
      fechaContacto: data.fechaContacto?.toDate(),
      verificadoPorId: data.verificadoPorId,
      intentosContacto: data.intentosContacto,
      horariosContacto: data.horariosContacto,
      resultadoVerificacion: data.resultadoVerificacion,
      telefonoAlternativo: data.telefonoAlternativo,
      email: data.email,
      direccion: data.direccion,
      ocupacion: data.ocupacion,
      esReferenciaLaboral: data.esReferenciaLaboral,
      empresaTrabaja: data.empresaTrabaja,
      cargoEmpresa: data.cargoEmpresa,
      confirmoDatos: data.confirmoDatos,
      proporcionoInformacionAdicional: data.proporcionoInformacionAdicional,
      nivelCooperacion: data.nivelCooperacion,
      requiereReverificacion: data.requiereReverificacion,
      
      // Campos calculados
      nombreCompleto: `${data.nombre} ${data.apellidos}`,
      esContactoValido: this.validarContacto(data.telefono),
      tipoParentesco: this.clasificarParentesco(data.parentesco),
      puntajeReferencia: this.calcularPuntajeReferencia(data),
      esReferenciaConfiable: this.evaluarConfiabilidadReferencia(data)
    };
  }

  // ======================================
  // CONSTRUCCIÓN DEL EXPEDIENTE COMPLETO
  // ======================================

  private construirExpedienteCompleto(datos: any): ExpedienteCompleto {
    const solicitud = datos.solicitud as SolicitudCredito;
    
    return {
      solicitud,
      titular: datos.titular,
      fiador: datos.fiador,
      vehiculo: datos.vehiculo,
      referencias: datos.referencias || [],
      historialEstados: datos.historialEstados || [],
      evaluaciones: datos.evaluaciones || [],
      documentosProceso: datos.documentosProceso || [],
      
      datosCompletos: true,
      cargandoDatos: false,
      
      resumenEvaluacion: this.calcularResumenEvaluacion(solicitud, datos.titular, datos.fiador, datos.referencias),
      alertas: this.calcularAlertas(solicitud, datos.titular, datos.fiador, datos.referencias),
      metricas: this.calcularMetricas(solicitud, datos.historialEstados, datos.evaluaciones)
    };
  }

  // ======================================
  // MÉTODOS DE ACTUALIZACIÓN
  // ======================================

  async actualizarEstado(solicitudId: string, nuevoEstado: EstadoSolicitud, observaciones?: string): Promise<void> {
    try {
      const solicitudRef = doc(this.firestore, `solicitudes_credito/${solicitudId}`);
      const expedienteActual = this.expedienteActual.value;
      
      if (!expedienteActual) {
        throw new Error('No hay expediente cargado');
      }

      // Verificar si la transición es válida
      if (!this.puedeTransicionarA(expedienteActual.solicitud.estado, nuevoEstado)) {
        throw new Error(`Transición no permitida de ${expedienteActual.solicitud.estado} a ${nuevoEstado}`);
      }

      const ahora = new Date();
      const configEstado = ESTADOS_CONFIG[nuevoEstado];
      
      const actualizacion: any = {
        estado: nuevoEstado,
        updatedAt: Timestamp.fromDate(ahora),
        ultimaModificacionPor: 'usuario_actual' // TODO: obtener del servicio de autenticación
      };

      // Calcular tiempo límite si aplica
      if (configEstado.tiempoLimite) {
        const tiempoLimite = new Date(ahora.getTime() + configEstado.tiempoLimite * 60 * 60 * 1000);
        actualizacion.fechaLimiteEvaluacion = Timestamp.fromDate(tiempoLimite);
      }

      // Agregar observaciones si se proporcionan
      if (observaciones) {
        actualizacion.observacionesGenerales = observaciones;
      }

      await updateDoc(solicitudRef, actualizacion);

      // Crear registro en historial de estados
      await this.crearRegistroHistorial(solicitudId, expedienteActual.solicitud.estado, nuevoEstado, observaciones);

    } catch (error) {
      console.error('Error al actualizar estado:', error);
      throw error;
    }
  }

  private async crearRegistroHistorial(
    solicitudId: string, 
    estadoAnterior: EstadoSolicitud, 
    estadoNuevo: EstadoSolicitud, 
    observaciones?: string
  ): Promise<void> {
    const historialRef = collection(this.firestore, 'historial_estados');
    
    const registro: Partial<HistorialEstado> = {
      solicitudId,
      estadoAnterior,
      estadoNuevo,
      fechaCambio: new Date(),
      usuarioId: 'usuario_actual', // TODO: obtener del servicio de autenticación
      usuarioNombre: 'Usuario Actual', // TODO: obtener del servicio de autenticación
      observaciones,
      motivo: 'Cambio manual desde expediente'
    };

    // TODO: Implementar addDoc cuando esté disponible
    // await addDoc(historialRef, registro);
  }

  // ======================================
  // MÉTODOS DE VALIDACIÓN Y CÁLCULO
  // ======================================

  puedeTransicionarA(estadoActual: EstadoSolicitud, nuevoEstado: EstadoSolicitud): boolean {
    return TRANSICIONES_PERMITIDAS[estadoActual]?.includes(nuevoEstado) || false;
  }

  obtenerAccionesDisponibles(estado: EstadoSolicitud): string[] {
    return ACCIONES_POR_ESTADO[estado] || [];
  }

  private calcularPorcentajeProgreso(estado: EstadoSolicitud): number {
    const estadosOrdenados = Object.keys(ESTADOS_CONFIG);
    const indiceActual = estadosOrdenados.indexOf(estado);
    return Math.round((indiceActual / (estadosOrdenados.length - 1)) * 100);
  }

  private verificarVencimiento(fechaLimite?: Date, ahora: Date = new Date()): boolean {
    return fechaLimite ? ahora > fechaLimite : false;
  }

  private verificarRequiereAccion(estado: EstadoSolicitud, fechaLimite?: Date, ahora: Date = new Date()): boolean {
    if (!fechaLimite) return false;
    
    const horasRestantes = (fechaLimite.getTime() - ahora.getTime()) / (1000 * 60 * 60);
    return horasRestantes < 4; // Requiere acción si quedan menos de 4 horas
  }

  private calcularEdad(fechaNacimiento: Date): number {
    const ahora = new Date();
    const edad = ahora.getFullYear() - fechaNacimiento.getFullYear();
    const mesActual = ahora.getMonth();
    const mesNacimiento = fechaNacimiento.getMonth();
    
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && ahora.getDate() < fechaNacimiento.getDate())) {
      return edad - 1;
    }
    
    return edad;
  }

  private verificarDocumentosCompletos(archivos: { [key: string]: string }): boolean {
  const documentosRequeridos = ['dniFrente', 'dniReverso'];
  return documentosRequeridos.every(doc => archivos[doc]?.trim() !== '');
}

  private determinarEstadoLicencia(licenciaConducir: string): 'vigente' | 'vencida' | 'sin_licencia' {
    switch (licenciaConducir?.toLowerCase()) {
      case 'vigente': return 'vigente';
      case 'vencido': return 'vencida';
      default: return 'sin_licencia';
    }
  }

  private parsearRangoIngresos(rangoIngresos: string): { min: number; max: number } {
    const match = rangoIngresos.match(/(\d+)-(\d+)/);
    if (match) {
      return { min: parseInt(match[1]), max: parseInt(match[2]) };
    }
    return { min: 0, max: 0 };
  }

  private calcularPuntajeConfiabilidad(cliente: ClienteFirebaseRaw): number {
    let puntaje = 0;
    
    // Documentos completos (30 puntos)
    if (this.verificarDocumentosCompletos(cliente.archivos?? {})) puntaje += 30;
    
    // Datos verificados (25 puntos)
    if (cliente.datosVerificados) puntaje += 25;
    
    // Centrales de riesgo (20 puntos)
    if (cliente.consultaCentralesRealizada && cliente.resultadoCentrales?.scoreSBS) {
      const scoreSBS = cliente.resultadoCentrales.scoreSBS;
      if (scoreSBS >= 700) puntaje += 20;
      else if (scoreSBS >= 500) puntaje += 15;
      else if (scoreSBS >= 300) puntaje += 10;
    }
    
    // Historial de pagos (15 puntos)
    switch (cliente.historialPagos) {
      case 'excelente': puntaje += 15; break;
      case 'bueno': puntaje += 12; break;
      case 'regular': puntaje += 8; break;
      case 'malo': puntaje += 0; break;
    }
    
    // Ingresos verificados (10 puntos)
    if (cliente.ingresosVerificados) puntaje += 10;
    
    return Math.min(puntaje, 100);
  }

  private evaluarAptitudCrediticia(cliente: ClienteFirebaseRaw): boolean {
    return this.calcularPuntajeConfiabilidad(cliente) >= 60 &&
           cliente.datosVerificados === true &&
           (!cliente.resultadoCentrales?.scoreSBS || cliente.resultadoCentrales.scoreSBS >= 300);
  }

  private calcularValorDepreciado(precioReferencial: number, anio: number): number {
    const antiguedad = new Date().getFullYear() - anio;
    const depreciacionAnual = 0.15; // 15% anual
    const factorDepreciacion = Math.pow(1 - depreciacionAnual, antiguedad);
    return Math.round(precioReferencial * factorDepreciacion);
  }

  private validarContacto(telefono: string): boolean {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    return telefonoLimpio.length >= 9;
  }

  private clasificarParentesco(parentesco: string): 'familiar' | 'amigo' | 'laboral' | 'otro' {
    const parentescoLower = parentesco.toLowerCase();
    
    if (['padre', 'madre', 'hermano', 'hermana', 'hijo', 'hija', 'esposo', 'esposa', 'primo', 'prima', 'tío', 'tía'].some(p => parentescoLower.includes(p))) {
      return 'familiar';
    }
    
    if (['jefe', 'supervisor', 'compañero', 'colega', 'empleador'].some(p => parentescoLower.includes(p))) {
      return 'laboral';
    }
    
    if (['amigo', 'amiga', 'conocido'].some(p => parentescoLower.includes(p))) {
      return 'amigo';
    }
    
    return 'otro';
  }

  private calcularPuntajeReferencia(referencia: ReferenciaFirebaseRaw): number {
    let puntaje = 0;
    
    // Estado de verificación (40 puntos)
    switch (referencia.estadoVerificacion) {
      case 'verificado': puntaje += 40; break;
      case 'contactado': puntaje += 25; break;
      case 'pendiente': puntaje += 0; break;
      case 'no_contactado': puntaje -= 10; break;
      case 'rechazado': puntaje -= 20; break;
    }
    
    // Resultado de verificación (40 puntos)
    if (referencia.resultadoVerificacion) {
      const resultado = referencia.resultadoVerificacion;
      
      if (resultado.conoceTitular) puntaje += 10;
      if (resultado.recomendaria) puntaje += 15;
      
      switch (resultado.relacion) {
        case 'muy_buena': puntaje += 15; break;
        case 'buena': puntaje += 10; break;
        case 'regular': puntaje += 5; break;
        case 'mala': puntaje -= 10; break;
      }
      
      // Confiabilidad (1-10 escala)
      puntaje += (resultado.confiabilidad || 0);
    }
    
    // Nivel de cooperación (20 puntos)
    switch (referencia.nivelCooperacion) {
      case 'alto': puntaje += 20; break;
      case 'medio': puntaje += 10; break;
      case 'bajo': puntaje += 0; break;
    }
    
    return Math.max(0, Math.min(puntaje, 100));
  }

  private evaluarConfiabilidadReferencia(referencia: ReferenciaFirebaseRaw): boolean {
    return this.calcularPuntajeReferencia(referencia) >= 60 &&
           referencia.estadoVerificacion === 'verificado' &&
           referencia.resultadoVerificacion?.recomendaria === true;
  }

  private calcularResumenEvaluacion(
    solicitud: SolicitudCredito,
    titular: Cliente,
    fiador?: Cliente,
    referencias: Referencia[] = []
  ): any {
    const documentosValidados = this.contarDocumentosValidados(titular, fiador);
    const totalDocumentos = this.contarTotalDocumentos(titular, fiador);
    const referenciasVerificadas = referencias.filter(r => r.estadoVerificacion === 'verificado').length;
    const scorePromedio = referencias.length > 0 
      ? referencias.reduce((sum, r) => sum + r.puntajeReferencia, 0) / referencias.length 
      : 0;

    const nivelRiesgo = this.calcularNivelRiesgo(solicitud, titular, fiador, referencias);
    const probabilidad = this.calcularProbabilidadAprobacion(solicitud, titular, fiador, referencias);

    return {
      porcentajeDocumentosValidados: Math.round((documentosValidados / Math.max(totalDocumentos, 1)) * 100),
      porcentajeReferenciasVerificadas: Math.round((referenciasVerificadas / Math.max(referencias.length, 1)) * 100),
      scorePromedioReferencias: Math.round(scorePromedio),
      nivelRiesgoCalculado: nivelRiesgo,
      probabilidadAprobacion: Math.round(probabilidad),
      recomendacionSistema: this.generarRecomendacion(probabilidad, nivelRiesgo)
    };
  }

  private calcularAlertas(
    solicitud: SolicitudCredito,
    titular: Cliente,
    fiador?: Cliente,
    referencias: Referencia[] = []
  ): any {
    const alertas = {
      documentosVencidos: [] as string[],
      tiemposExcedidos: [] as string[],
      inconsistenciasDetectadas: [] as string[],
      requiereAtencionUrgente: false
    };

    // Verificar documentos vencidos
    if (titular.estadoValidacionDocumentos === 'observado') {
      alertas.documentosVencidos.push('Documentos del titular observados');
    }
    if (fiador?.estadoValidacionDocumentos === 'observado') {
      alertas.documentosVencidos.push('Documentos del fiador observados');
    }

    // Verificar tiempos excedidos
    if (solicitud.estaVencido) {
      alertas.tiemposExcedidos.push('Solicitud vencida según SLA');
    }
    if (solicitud.requiereAccion) {
      alertas.tiemposExcedidos.push('Requiere acción inmediata');
    }

    // Verificar inconsistencias
    if (titular.inconsistenciasEncontradas?.length) {
      alertas.inconsistenciasDetectadas.push(...titular.inconsistenciasEncontradas);
    }
    if (fiador?.inconsistenciasEncontradas?.length) {
      alertas.inconsistenciasDetectadas.push(...fiador.inconsistenciasEncontradas);
    }

    // Determinar si requiere atención urgente
    alertas.requiereAtencionUrgente = 
      alertas.documentosVencidos.length > 0 ||
      alertas.tiemposExcedidos.length > 0 ||
      (solicitud.requiereAprobacionSupervisor || false) ||
      (solicitud.requiereAtencionEspecial || false);

    return alertas;
  }

  private calcularMetricas(
    solicitud: SolicitudCredito,
    historial: HistorialEstado[],
    evaluaciones: Evaluacion[]
  ): any {
    const tiempoTotal = solicitud.tiempoTotalProceso || 0;
    const numeroEvaluaciones = evaluaciones.length;
    
    return {
      tiempoPromedioRespuesta: numeroEvaluaciones > 0 
        ? Math.round(tiempoTotal / numeroEvaluaciones) 
        : 0,
      eficienciaProceso: this.calcularEficienciaProceso(solicitud, historial),
      satisfaccionCliente: undefined // Se calcularía con encuestas posteriores
    };
  }

  private contarDocumentosValidados(titular: Cliente, fiador?: Cliente): number {
    let validados = 0;
    
    if (titular.estadoValidacionDocumentos === 'aprobado') validados++;
    if (fiador?.estadoValidacionDocumentos === 'aprobado') validados++;
    
    return validados;
  }

  private contarTotalDocumentos(titular: Cliente, fiador?: Cliente): number {
    return fiador ? 2 : 1; // Documentos del titular + fiador (si existe)
  }

  private calcularNivelRiesgo(
    solicitud: SolicitudCredito,
    titular: Cliente,
    fiador?: Cliente,
    referencias: Referencia[] = []
  ): 'bajo' | 'medio' | 'alto' {
    let factoresRiesgo = 0;
    
    // Factores del titular
    if (titular.puntajeConfiabilidad < 60) factoresRiesgo++;
    if (!titular.datosVerificados) factoresRiesgo++;
    if (titular.resultadoCentrales?.scoreSBS && titular.resultadoCentrales.scoreSBS < 500) factoresRiesgo++;
    
    // Factores del fiador
    if (fiador) {
      if (fiador.puntajeConfiabilidad < 60) factoresRiesgo++;
      if (!fiador.aceptaResponsabilidad) factoresRiesgo++;
    } else {
      factoresRiesgo++; // No tener fiador es un factor de riesgo
    }
    
    // Factores de referencias
    const referenciasConfiables = referencias.filter(r => r.esReferenciaConfiable).length;
    if (referenciasConfiables < 2) factoresRiesgo++;
    
    // Factores financieros
    const porcentajeInicial = (solicitud.inicial / solicitud.precioCompraMoto) * 100;
    if (porcentajeInicial < 20) factoresRiesgo++;
    
    if (factoresRiesgo <= 2) return 'bajo';
    if (factoresRiesgo <= 4) return 'medio';
    return 'alto';
  }

  private calcularProbabilidadAprobacion(
    solicitud: SolicitudCredito,
    titular: Cliente,
    fiador?: Cliente,
    referencias: Referencia[] = []
  ): number {
    let probabilidad = 50; // Base del 50%
    
    // Factores positivos
    if (titular.esAptoCrediticiamente) probabilidad += 20;
    if (fiador?.esAptoCrediticiamente) probabilidad += 15;
    if (referencias.filter(r => r.esReferenciaConfiable).length >= 2) probabilidad += 15;
    
    const porcentajeInicial = (solicitud.inicial / solicitud.precioCompraMoto) * 100;
    if (porcentajeInicial >= 30) probabilidad += 10;
    else if (porcentajeInicial >= 20) probabilidad += 5;
    
    // Factores negativos
    if (!titular.datosVerificados) probabilidad -= 15;
    if (titular.inconsistenciasEncontradas?.length) probabilidad -= 10;
    if (!fiador) probabilidad -= 10;
    
    return Math.max(0, Math.min(probabilidad, 100));
  }

  private generarRecomendacion(probabilidad: number, nivelRiesgo: 'bajo' | 'medio' | 'alto'): 'aprobar' | 'rechazar' | 'revisar' {
    if (probabilidad >= 75 && nivelRiesgo === 'bajo') return 'aprobar';
    if (probabilidad <= 30 || nivelRiesgo === 'alto') return 'rechazar';
    return 'revisar';
  }

  private calcularEficienciaProceso(solicitud: SolicitudCredito, historial: HistorialEstado[]): number {
    if (historial.length < 2) return 100;
    
    const tiempoIdeal = this.obtenerTiempoIdealProceso(solicitud.estado);
    const tiempoReal = solicitud.tiempoTotalProceso || 0;
    
    if (tiempoReal === 0) return 100;
    
    const eficiencia = (tiempoIdeal / tiempoReal) * 100;
    return Math.min(eficiencia, 100);
  }

  private obtenerTiempoIdealProceso(estado: EstadoSolicitud): number {
    // Tiempo ideal en horas según el estado actual
    const tiemposIdeales: { [key in EstadoSolicitud]: number } = {
      pendiente: 1,
      en_revision_inicial: 5,
      evaluacion_documental: 29,
      documentos_observados: 77,
      evaluacion_garantes: 53,
      garante_rechazado: 77,
      entrevista_programada: 101,
      en_entrevista: 105,
      entrevista_completada: 113,
      en_decision: 125,
      aprobado: 149,
      rechazado: 125,
      condicional: 197,
      certificado_generado: 173,
      esperando_inicial: 245,
      inicial_confirmada: 269,
      contrato_firmado: 317,
      entrega_completada: 317,
      suspendido: 0,
      cancelado: 0
    };
    
    return tiemposIdeales[estado] || 0;
  }

  // ======================================
  // LIMPIEZA Y UTILIDADES
  // ======================================

  limpiarEstado(): void {
    this.expedienteActual.next(null);
    this.error.next(null);
    this.cargando.next(false);
  }

  obtenerConfiguracionEstado(estado: EstadoSolicitud) {
    return ESTADOS_CONFIG[estado];
  }

  calcularTiempoRestante(fechaLimite?: Date): number {
    if (!fechaLimite) return 0;
    
    const ahora = new Date();
    const tiempoRestante = fechaLimite.getTime() - ahora.getTime();
    return Math.max(0, Math.round(tiempoRestante / (1000 * 60 * 60))); // Horas restantes
  }

  formatearTiempo(horas: number): string {
    if (horas < 1) return 'Menos de 1 hora';
    if (horas < 24) return `${horas} hora${horas > 1 ? 's' : ''}`;
    
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    
    let resultado = `${dias} día${dias > 1 ? 's' : ''}`;
    if (horasRestantes > 0) {
      resultado += ` y ${horasRestantes} hora${horasRestantes > 1 ? 's' : ''}`;
    }
    
    return resultado;
  }
}
