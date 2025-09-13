import { inject, Injectable, signal} from '@angular/core';

import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  QueryConstraint,
  collectionData,
  docData
} from '@angular/fire/firestore';
import { 
  Storage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  percentage
} from '@angular/fire/storage';
import { Observable, BehaviorSubject, map, from, combineLatest, of, forkJoin, tap } from 'rxjs';
import { 
  SolicitudCredito, 
  SolicitudFirebaseRaw, 
  SolicitudCreditoCompleta,
  Cliente, 
  ClienteFirebaseRaw,
  Vehiculo, 
  VehiculoFirebaseRaw,
  Referencia, 
  ReferenciaFirebaseRaw,
  EstadoSolicitud,
  HistorialEstado,
  Evaluacion,
  DocumentoProceso,
  Notificacion,
  TipoDocumento,
  TipoEvaluacion,
  RolUsuario,
  EstadoEvaluacion
} from '../modelos/modelos-solicitudes';





@Injectable({
  providedIn: 'root'
})
export class EvaluacionCreditosService {

  private firestore = inject(Firestore);
  private storage = inject(Storage);

  // Referencias a las colecciones
  private solicitudesCollection = collection(this.firestore, 'solicitudes');
  private clientesCollection = collection(this.firestore, 'clientes_v1');
  private vehiculosCollection = collection(this.firestore, 'vehiculos');
  private referenciasCollection = collection(this.firestore, 'referencias');
  private historialCollection = collection(this.firestore, 'historial_estados');
  private evaluacionesCollection = collection(this.firestore, 'evaluaciones');
  private notificacionesCollection = collection(this.firestore, 'notificaciones');
  private documentosCollection = collection(this.firestore, 'documentos_proceso');

  // Signals para cache y estado
  private solicitudesCache = signal<SolicitudCredito[]>([]);
  private cargandoSolicitudes = signal<boolean>(false);
  private errorSolicitudes = signal<string | null>(null);

  // BehaviorSubjects para filtros reactivos
  private filtrosSubject = new BehaviorSubject<{
    estado?: EstadoSolicitud[];
    vendedorId?: string;
    evaluadorId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    prioridad?: string[];
  }>({});

  public filtros$ = this.filtrosSubject.asObservable();

  // ==================================================
  // 2. MÉTODOS CRUD PARA SOLICITUDES
  // ==================================================

  /**
   * Crear nueva solicitud de crédito
   */
  async crearSolicitud(solicitudData: Omit<SolicitudFirebaseRaw, 'id'>): Promise<string> {
    try {
      const batch = writeBatch(this.firestore);
      
      // Generar número de solicitud único
      const numeroSolicitud = await this.generarNumeroSolicitud();
      
      // Preparar datos de la solicitud
      const solicitud: Omit<SolicitudFirebaseRaw, 'id'> = {
        ...solicitudData,
        numeroSolicitud,
        estado: 'pendiente',
        prioridad: this.calcularPrioridad(solicitudData.precioCompraMoto),
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        tiempoEnEtapaActual: 0,
        tiempoTotalProceso: 0,
        documentosValidados: 0,
        documentosPendientes: 0,
        creadoPor: 'system', // TODO: obtener del usuario actual
      };

      // Crear solicitud
      const solicitudRef = doc(this.solicitudesCollection);
      batch.set(solicitudRef, solicitud);

      // Crear entrada en historial
      const historialRef = doc(this.historialCollection);
      const historialData: Omit<HistorialEstado, 'id'> = {
        solicitudId: solicitudRef.id,
        estadoNuevo: 'pendiente',
        fechaCambio: new Date(),
        usuarioId: 'system',
        usuarioNombre: 'Sistema',
        motivo: 'Solicitud creada',
        observaciones: 'Solicitud recibida desde formulario web'
      };
      batch.set(historialRef, this.convertirDatesToTimestamps(historialData));

      // Ejecutar transacción
      await batch.commit();
      
      console.log('Solicitud creada con ID:', solicitudRef.id);
      return solicitudRef.id;
      
    } catch (error) {
      console.error('Error creando solicitud:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitud por ID
   */
  async obtenerSolicitudPorId(id: string): Promise<SolicitudCredito | null> {
    try {
      const docRef = doc(this.firestore, 'solicitudes', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const raw = { id: docSnap.id, ...docSnap.data() } as SolicitudFirebaseRaw;
        return this.parsearSolicitud(raw);
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo solicitud:', error);
      throw error;
    }
  }

  /**
   * Actualizar solicitud
   */
  async actualizarSolicitud(
    id: string, 
    datos: Partial<SolicitudFirebaseRaw>, 
    usuarioId: string, 
    usuarioNombre: string,
    motivo?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(this.firestore);
      const solicitudRef = doc(this.firestore, 'solicitudes', id);
      
      // Obtener solicitud actual para historial
      const solicitudActual = await this.obtenerSolicitudPorId(id);
      
      // Preparar datos de actualización
      const datosActualizacion = {
        ...datos,
        updatedAt: serverTimestamp(),
        ultimaModificacionPor: usuarioId
      };

      // Actualizar solicitud
      batch.update(solicitudRef, datosActualizacion);

      // Si hay cambio de estado, crear entrada en historial
      if (datos.estado && solicitudActual && solicitudActual.estado !== datos.estado) {
        const historialRef = doc(this.historialCollection);
        const tiempoEnEstadoAnterior = solicitudActual.tiempoEnEtapaActual || 0;
        
        const historialData: Omit<HistorialEstado, 'id'> = {
          solicitudId: id,
          estadoAnterior: solicitudActual.estado,
          estadoNuevo: datos.estado,
          fechaCambio: new Date(),
          usuarioId,
          usuarioNombre,
          motivo: motivo || `Cambio de estado: ${solicitudActual.estado} → ${datos.estado}`,
          observaciones: datos.observacionesGenerales,
          tiempoEnEstadoAnterior
        };
        
        batch.set(historialRef, this.convertirDatesToTimestamps(historialData));

        // Actualizar tiempo en etapa actual
        datosActualizacion.tiempoEnEtapaActual = 0;
      }

      await batch.commit();
      console.log('Solicitud actualizada:', id);
      
    } catch (error) {
      console.error('Error actualizando solicitud:', error);
      throw error;
    }
  }

  // ==================================================
  // 3. MÉTODOS REACTIVOS PARA SOLICITUDES
  // ==================================================

  /**
   * Obtener solicitudes en tiempo real
   */
  getSolicitudesReactivo(): Observable<SolicitudCredito[]> {
    const queryRef = query(
      this.solicitudesCollection,
      orderBy('updatedAt', 'desc')
    );

    return collectionData(queryRef, { idField: 'id' }).pipe(
      map((solicitudesRaw: any[]) => {
        const solicitudes = solicitudesRaw.map(raw => this.parsearSolicitud(raw as SolicitudFirebaseRaw));
        this.solicitudesCache.set(solicitudes);
        return solicitudes;
      })
    );
  }

  /**
   * Obtener solicitudes con filtros
   */
  getSolicitudesConFiltros(): Observable<SolicitudCredito[]> {
    return combineLatest([
      this.getSolicitudesReactivo(),
      this.filtros$
    ]).pipe(
      map(([solicitudes, filtros]) => this.aplicarFiltros(solicitudes, filtros))
    );
  }

  /**
   * Obtener solicitudes por estado
   */
  /**
 * Obtener solicitudes por estado - VERSIÓN CON LOGS DETALLADOS
 */

/**
 * Obtener solicitudes por estado - VERSIÓN SIMPLIFICADA
 * Busca TODOS los estados si no se especifican o si la lista está vacía
 */
getSolicitudesPorEstado(estados?: EstadoSolicitud[]): Observable<SolicitudCredito[]> {
  console.log('Iniciando consulta de solicitudes...');
  
  let queryRef;
  
  // Si no se proporcionan estados o está vacío, buscar TODAS las solicitudes
  if (!estados || estados.length === 0) {
    console.log('No se especificaron estados - buscando TODAS las solicitudes');
    queryRef = query(this.solicitudesCollection);
  } else {
    console.log('Buscando solicitudes con estados:', estados);
    queryRef = query(
      this.solicitudesCollection,
      where('estado', 'in', estados)
    );
  }

  return collectionData(queryRef, { idField: 'id' }).pipe(
    map((solicitudesRaw: any[]) => {
      console.log(`Documentos encontrados: ${solicitudesRaw.length}`);
      
      if (solicitudesRaw.length === 0) {
        console.log('No se encontraron solicitudes');
        return [];
      }

      // Mapear a objetos tipados
      const solicitudes = solicitudesRaw.map(raw => 
        this.parsearSolicitud(raw as SolicitudFirebaseRaw)
      );

      // Ordenar por prioridad y fecha
      solicitudes.sort((a, b) => {
        // Vencidas primero
        if (a.estaVencido !== b.estaVencido) {
          return a.estaVencido ? -1 : 1;
        }
        
        // Luego por prioridad (Alta, Media, Baja)
        const prioridades = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
        const prioridadA = prioridades[a.prioridad] || 0;
        const prioridadB = prioridades[b.prioridad] || 0;
        
        if (prioridadA !== prioridadB) {
          return prioridadB - prioridadA;
        }
        
        // Finalmente por fecha de actualización (más recientes primero)
        return b.fechaActualizacion.getTime() - a.fechaActualizacion.getTime();
      });

      console.log(`Solicitudes procesadas: ${solicitudes.length}`);
      
      // Mostrar distribución por estado
      const estadosCount = solicitudes.reduce((acc, s) => {
        acc[s.estado] = (acc[s.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('Distribución por estado:', estadosCount);
      
      this.solicitudesCache.set(solicitudes);
      return solicitudes;
    })
  );
}

/**
 * Método específico para cola de trabajo - obtiene solicitudes pendientes de evaluación
 */
getSolicitudesColaTrabajoSimple(): Observable<SolicitudCredito[]> {
  console.log('Cargando solicitudes para cola de trabajo...');
  
  // Estados que requieren evaluación o acción
  const estadosEvaluacion: EstadoSolicitud[] = [
    'pendiente',
    'en_revision_inicial',
    'evaluacion_documental', 
    'documentos_observados',
    'evaluacion_garantes',
    'garante_rechazado',
    'entrevista_programada',
    'en_entrevista',
    'en_decision'
  ];
  
  return this.getSolicitudesPorEstado(estadosEvaluacion);
}

/**
 * Método para obtener TODAS las solicitudes (sin filtros)
 */
getTodasLasSolicitudes(): Observable<SolicitudCredito[]> {
  console.log('Cargando TODAS las solicitudes...');
  return this.getSolicitudesPorEstado(); // Sin parámetros = todas
}

/**
 * Método de prueba para verificar conectividad básica
 */
async probarConexion(): Promise<void> {
  try {
    console.log('Probando conexión con Firestore...');
    
    // Obtener primeros 5 documentos para verificar
    const queryRef = query(this.solicitudesCollection, limit(5));
    const snapshot = await getDocs(queryRef);
    
    console.log(`Conexión exitosa. Documentos de prueba: ${snapshot.size}`);
    
    if (snapshot.size > 0) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      console.log('Ejemplo de documento:', {
        id: doc.id,
        estado: data['estado'],
        numeroSolicitud: data['numeroSolicitud']
      });
    }
    
  } catch (error) {
    console.error('Error de conexión:', error);
    throw error;
  }
}
  /**
   * Obtener solicitudes por evaluador
   */
  getSolicitudesPorEvaluador(evaluadorId: string): Observable<SolicitudCredito[]> {
    const queryRef = query(
      this.solicitudesCollection,
      where('evaluadorActualId', '==', evaluadorId),
      orderBy('fechaLimiteEvaluacion', 'asc')
    );

    return collectionData(queryRef, { idField: 'id' }).pipe(
      map((solicitudesRaw: any[]) => 
        solicitudesRaw.map(raw => this.parsearSolicitud(raw as SolicitudFirebaseRaw))
      )
    );
  }

  // ==================================================
  // 4. MÉTODOS PARA DATOS RELACIONADOS
  // ==================================================

  /**
   * Obtener cliente (titular o fiador) por ID
   */
  async obtenerCliente(clienteId: string): Promise<Cliente | null> {
    try {
      const docRef = doc(this.firestore, 'clientes_v1', clienteId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const raw = { id: docSnap.id, ...docSnap.data() } as ClienteFirebaseRaw;
        return this.parsearCliente(raw);
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener vehículo por ID
   */
  async obtenerVehiculo(vehiculoId: string): Promise<Vehiculo | null> {
    try {
      const docRef = doc(this.firestore, 'vehiculos', vehiculoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const raw = { id: docSnap.id, ...docSnap.data() } as VehiculoFirebaseRaw;
        return this.parsearVehiculo(raw);
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo vehículo:', error);
      throw error;
    }
  }

  /**
   * Obtener referencias por array de IDs
   */
  async obtenerReferencias(referenciasIds: string[]): Promise<Referencia[]> {
    try {
      if (referenciasIds.length === 0) return [];
      
      const promesasReferencias = referenciasIds.map(async (id) => {
        const docRef = doc(this.firestore, 'referencias', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const raw = { id: docSnap.id, ...docSnap.data() } as ReferenciaFirebaseRaw;
          return this.parsearReferencia(raw);
        }
        return null;
      });
      
      const resultados = await Promise.all(promesasReferencias);
      return resultados.filter(ref => ref !== null) as Referencia[];
      
    } catch (error) {
      console.error('Error obteniendo referencias:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitud completa con todos los datos relacionados
   */
  async obtenerSolicitudCompleta(solicitudId: string): Promise<SolicitudCreditoCompleta | null> {
  try {
    const solicitud = await this.obtenerSolicitudPorId(solicitudId);
    if (!solicitud) return null;

    // SOLUCIÓN: Inicializar TODOS los campos obligatorios desde el principio
    const solicitudCompleta: SolicitudCreditoCompleta = {
      ...solicitud,                              // Spread de SolicitudCredito
      datosCompletos: false,                     // Estado de carga
      cargandoDatos: true,
      
      // Inicializar campos obligatorios con valores por defecto
      resumenEvaluacion: {
        porcentajeDocumentosValidados: 0,
        porcentajeReferenciasVerificadas: 0,
        scorePromedioReferencias: 0,
        nivelRiesgoCalculado: 'medio',
        probabilidadAprobacion: 0,
        recomendacionSistema: 'revisar'
      },
      
      alertas: {
        documentosVencidos: [],
        tiemposExcedidos: [],
        inconsistenciasDetectadas: [],
        requiereAtencionUrgente: false
      },
      
      metricas: {
        tiempoPromedioRespuesta: 0,
        eficienciaProces: 0
      }
    };

    // Cargar datos relacionados en paralelo
    const [titular, fiador, vehiculo, referencias, historial, evaluaciones] = await Promise.all([
      this.obtenerCliente(solicitud.titularId),
      solicitud.fiadorId ? this.obtenerCliente(solicitud.fiadorId) : null,
      this.obtenerVehiculo(solicitud.vehiculoId),
      this.obtenerReferencias(solicitud.referenciasIds),
      this.obtenerHistorialSolicitud(solicitudId),
      this.obtenerEvaluacionesSolicitud(solicitudId)
    ]);

    // Asignar datos cargados
    solicitudCompleta.titular = titular?.tipo === 'titular' ? titular : undefined;
    solicitudCompleta.fiador = fiador?.tipo === 'fiador' ? fiador : undefined;
    solicitudCompleta.vehiculo = vehiculo || undefined;
    solicitudCompleta.referencias = referencias;
    solicitudCompleta.historialEstados = historial;
    solicitudCompleta.evaluaciones = evaluaciones;
    
    // Recalcular campos con datos reales
    solicitudCompleta.resumenEvaluacion = this.calcularResumenEvaluacion(solicitudCompleta);
    solicitudCompleta.alertas = this.generarAlertas(solicitudCompleta);
    solicitudCompleta.metricas = this.calcularMetricas(solicitudCompleta);

    // Marcar como completado
    solicitudCompleta.datosCompletos = true;
    solicitudCompleta.cargandoDatos = false;

    return solicitudCompleta;
    
  } catch (error) {
    console.error('Error obteniendo solicitud completa:', error);
    
    // SOLUCIÓN: También en el catch, obtener la solicitud base correctamente
    const solicitudBase = await this.obtenerSolicitudPorId(solicitudId);
    if (!solicitudBase) return null;
    
    return {
      ...solicitudBase,                          // Spread completo de SolicitudCredito
      datosCompletos: false,
      cargandoDatos: false,
      errorCarga: 'Error al cargar datos relacionados',
      
      // Valores por defecto para campos obligatorios
      resumenEvaluacion: {
        porcentajeDocumentosValidados: 0,
        porcentajeReferenciasVerificadas: 0,
        scorePromedioReferencias: 0,
        nivelRiesgoCalculado: 'alto',
        probabilidadAprobacion: 0,
        recomendacionSistema: 'revisar'
      },
      
      alertas: {
        documentosVencidos: [],
        tiemposExcedidos: [],
        inconsistenciasDetectadas: ['Error al cargar datos'],
        requiereAtencionUrgente: true
      },
      
      metricas: {
        tiempoPromedioRespuesta: 0,
        eficienciaProces: 0
      }
    };
  }
}


  // ==================================================
  // 5. MÉTODOS DE GESTIÓN DE ARCHIVOS
  // ==================================================

  /**
   * Subir documento a Firebase Storage
   */
  async subirDocumento(
    solicitudId: string,
    tipoDocumento: TipoDocumento,
    archivo: File,
    usuarioId: string
  ): Promise<string> {
    try {
      const fileName = `${solicitudId}/${tipoDocumento}_${Date.now()}_${archivo.name}`;
      const storageRef = ref(this.storage, `documentos/${fileName}`);
      
      // Subir archivo
      const uploadTask = uploadBytesResumable(storageRef, archivo);
      
      // Esperar a que termine la subida
      await uploadTask;
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      
      // Registrar documento en Firestore
      const documentoData: Omit<DocumentoProceso, 'id'> = {
        solicitudId,
        tipoDocumento,
        nombreArchivo: archivo.name,
        urlArchivo: downloadURL,
        tamaño: archivo.size,
        fechaSubida: new Date(),
        subidoPorId: usuarioId,
        estado: 'pendiente',
        version: 1,
        esVersionFinal: true
      };
      
      await addDoc(this.documentosCollection, this.convertirDatesToTimestamps(documentoData));
      
      // Actualizar contador de documentos en solicitud
      await this.actualizarContadorDocumentos(solicitudId);
      
      return downloadURL;
      
    } catch (error) {
      console.error('Error subiendo documento:', error);
      throw error;
    }
  }

  /**
   * Obtener progreso de subida de archivo
   */
  subirDocumentoConProgreso(
    solicitudId: string,
    tipoDocumento: TipoDocumento,
    archivo: File
  ): Observable<{ progreso: number; url?: string }> {
    const fileName = `${solicitudId}/${tipoDocumento}_${Date.now()}_${archivo.name}`;
    const storageRef = ref(this.storage, `documentos/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, archivo);

    return new Observable(observer => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progreso = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next({ progreso });
        },
        (error) => {
          console.error('Error en subida:', error);
          observer.error(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            observer.next({ progreso: 100, url });
            observer.complete();
          } catch (error) {
            observer.error(error);
          }
        }
      );
    });
  }

  // ==================================================
  // 6. MÉTODOS DE WORKFLOW Y EVALUACIÓN
  // ==================================================

  /**
   * Cambiar estado de solicitud
   */
  async cambiarEstado(
    solicitudId: string,
    nuevoEstado: EstadoSolicitud,
    usuarioId: string,
    usuarioNombre: string,
    motivo?: string,
    observaciones?: string
  ): Promise<void> {
    try {
      const solicitud = await this.obtenerSolicitudPorId(solicitudId);
      if (!solicitud) throw new Error('Solicitud no encontrada');

      // Validar transición de estado
      if (!this.esTransicionValida(solicitud.estado, nuevoEstado)) {
        throw new Error(`Transición no válida: ${solicitud.estado} → ${nuevoEstado}`);
      }

      // Preparar datos de actualización
      const updates: Partial<SolicitudFirebaseRaw> = {
        estado: nuevoEstado,
        observacionesGenerales: observaciones
      };

      // Configurar fecha límite según el nuevo estado
      if (this.requiereFechaLimite(nuevoEstado)) {
        updates.fechaLimiteEvaluacion = this.calcularFechaLimite(nuevoEstado);
      }

      await this.actualizarSolicitud(solicitudId, updates, usuarioId, usuarioNombre, motivo);

      // Ejecutar acciones automáticas del nuevo estado
      await this.ejecutarAccionesPostCambioEstado(solicitudId, nuevoEstado);

    } catch (error) {
      console.error('Error cambiando estado:', error);
      throw error;
    }
  }

  /**
   * Asignar evaluador a solicitud
   */
  async asignarEvaluador(
    solicitudId: string,
    evaluadorId: string,
    evaluadorNombre: string,
    asignadoPorId: string,
    asignadoPorNombre: string
  ): Promise<void> {
    try {
      const updates: Partial<SolicitudFirebaseRaw> = {
        evaluadorActualId: evaluadorId,
        fechaAsignacion: serverTimestamp() as Timestamp,
        estado: 'en_revision_inicial'
      };

      await this.actualizarSolicitud(
        solicitudId, 
        updates, 
        asignadoPorId, 
        asignadoPorNombre,
        `Asignado a evaluador: ${evaluadorNombre}`
      );

    } catch (error) {
      console.error('Error asignando evaluador:', error);
      throw error;
    }
  }

  /**
   * Crear evaluación para una etapa específica
   */
  async crearEvaluacion(
    solicitudId: string,
    tipoEvaluacion: TipoEvaluacion,
    evaluadorId: string,
    evaluadorNombre: string,
    datos: {
      score?: number;
      observaciones?: string;
      recomendacion?: string;
    }
  ): Promise<string> {
    try {
      const evaluacionData: Omit<Evaluacion, 'id'> = {
        solicitudId,
        tipoEvaluacion,
        evaluadorId,
        evaluadorNombre,
        fechaInicio: new Date(),
        estado: 'en_proceso',
        ...datos
      };

      const docRef = await addDoc(
        this.evaluacionesCollection, 
        this.convertirDatesToTimestamps(evaluacionData)
      );

      return docRef.id;

    } catch (error) {
      console.error('Error creando evaluación:', error);
      throw error;
    }
  }

  /**
   * Completar evaluación
   */
  async completarEvaluacion(
    evaluacionId: string,
    datos: {
      score: number;
      observaciones?: string;
      recomendacion?: string;
    }
  ): Promise<void> {
    try {
      const evaluacionRef = doc(this.firestore, 'evaluaciones', evaluacionId);
      
      const updates = {
        ...datos,
        fechaFin: serverTimestamp(),
        estado: 'completada' as EstadoEvaluacion
      };

      await updateDoc(evaluacionRef, updates);

    } catch (error) {
      console.error('Error completando evaluación:', error);
      throw error;
    }
  }

  // ==================================================
  // 7. MÉTODOS DE CONSULTA Y ESTADÍSTICAS
  // ==================================================

  /**
   * Obtener estadísticas del dashboard
   */
  async obtenerEstadisticasDashboard(): Promise<{
    totalSolicitudes: number;
    solicitudesActivas: number;
    aprobadas: number;
    rechazadas: number;
    porEtapa: { [key: string]: number };
    porPrioridad: { [key: string]: number };
    tiempoPromedioEvaluacion: number;
    tasaAprobacion: number;
  }> {
    try {
      const snapshot = await getDocs(this.solicitudesCollection);
      const solicitudes = snapshot.docs.map(doc => 
        this.parsearSolicitud({ id: doc.id, ...doc.data() } as SolicitudFirebaseRaw)
      );

      return {
        totalSolicitudes: solicitudes.length,
        solicitudesActivas: solicitudes.filter(s => 
          !['entrega_completada', 'rechazado', 'cancelado'].includes(s.estado)
        ).length,
        aprobadas: solicitudes.filter(s => 
          ['aprobado', 'certificado_generado', 'entrega_completada'].includes(s.estado)
        ).length,
        rechazadas: solicitudes.filter(s => s.estado === 'rechazado').length,
        porEtapa: this.contarPorCampo(solicitudes, 'estado'),
        porPrioridad: this.contarPorCampo(solicitudes, 'prioridad'),
        tiempoPromedioEvaluacion: this.calcularTiempoPromedioEvaluacion(solicitudes),
        tasaAprobacion: solicitudes.length > 0 
          ? (solicitudes.filter(s => ['aprobado', 'entrega_completada'].includes(s.estado)).length / solicitudes.length) * 100 
          : 0
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Buscar solicitudes por texto
   */
  buscarSolicitudes(texto: string): Observable<SolicitudCredito[]> {
    return this.getSolicitudesReactivo().pipe(
      map(solicitudes => 
        solicitudes.filter(s => 
          s.numeroSolicitud.toLowerCase().includes(texto.toLowerCase()) ||
          s.vendedorNombre.toLowerCase().includes(texto.toLowerCase()) ||
          s.vendedorTienda.toLowerCase().includes(texto.toLowerCase()) ||
          s.mensajeOpcional.toLowerCase().includes(texto.toLowerCase()) ||
          s.id.toLowerCase().includes(texto.toLowerCase())
        )
      )
    );
  }

  // ==================================================
  // 8. MÉTODOS AUXILIARES Y PRIVADOS
  // ==================================================

  /**
   * Parsear solicitud raw a objeto tipado
   */
  private parsearSolicitud(raw: SolicitudFirebaseRaw): SolicitudCredito {
    // Convertir Timestamps a Date
    const fechaCreacion = this.convertirTimestampToDate(raw.createdAt);
    const fechaActualizacion = this.convertirTimestampToDate(raw.updatedAt);
    const fechaAsignacion = raw.fechaAsignacion ? this.convertirTimestampToDate(raw.fechaAsignacion) : undefined;
    const fechaLimiteEvaluacion = raw.fechaLimiteEvaluacion ? this.convertirTimestampToDate(raw.fechaLimiteEvaluacion) : undefined;

    // Convertir plazoQuincenas a number
    const plazoQuincenas = Number(raw.plazoQuincenas) || 0;

    // Calcular campos derivados
    const montoFinanciado = raw.precioCompraMoto - raw.inicial;
    const totalAPagar = raw.montoCuota * plazoQuincenas;
    const diasEnEstado = Math.floor((Date.now() - fechaActualizacion.getTime()) / (1000 * 60 * 60 * 24));
    const porcentajeProgreso = this.calcularPorcentajeProgreso(raw.estado);
    const estaVencido = fechaLimiteEvaluacion ? new Date() > fechaLimiteEvaluacion : false;
    const requiereAccion = this.solicitudRequiereAccion(raw);

    return {
      id: raw.id || '',
      numeroSolicitud: raw.numeroSolicitud || '',
      estado: raw.estado,
      prioridad: raw.prioridad || this.calcularPrioridad(raw.precioCompraMoto),
      titularId: raw.titularId,
      fiadorId: raw.fiadorId,
      vehiculoId: raw.vehiculoId,
      referenciasIds: raw.referenciasIds,
      precioCompraMoto: raw.precioCompraMoto,
      inicial: raw.inicial,
      montoCuota: raw.montoCuota,
      plazoQuincenas,
      vendedorId: raw.vendedorId,
      vendedorNombre: raw.vendedorNombre,
      vendedorTienda: raw.vendedorTienda,
      vendedor: raw.vendedor,
      mensajeOpcional: raw.mensajeOpcional,
      fechaCreacion,
      fechaActualizacion,
      asesorAsignadoId: raw.asesorAsignadoId,
      evaluadorActualId: raw.evaluadorActualId,
      fechaAsignacion,
      fechaLimiteEvaluacion,
      tiempoEnEtapaActual: raw.tiempoEnEtapaActual,
      tiempoTotalProceso: raw.tiempoTotalProceso,
      scoreDocumental: raw.scoreDocumental,
      scoreCentrales: raw.scoreCentrales,
      scoreGarantes: raw.scoreGarantes,
      scoreEntrevista: raw.scoreEntrevista,
      scoreFinal: raw.scoreFinal,
      decisionFinal: raw.decisionFinal,
      montoAprobado: raw.montoAprobado,
      tasaInteresAprobada: raw.tasaInteresAprobada,
      condicionesEspeciales: raw.condicionesEspeciales,
      motivoRechazo: raw.motivoRechazo,
      nivelRiesgo: raw.nivelRiesgo,
      requiereAprobacionSupervisor: raw.requiereAprobacionSupervisor,
      aprobadoPorSupervisor: raw.aprobadoPorSupervisor,
      supervisorId: raw.supervisorId,
      notificacionesEnviadas: raw.notificacionesEnviadas,
      ultimaNotificacionFecha: raw.ultimaNotificacionFecha ? this.convertirTimestampToDate(raw.ultimaNotificacionFecha) : undefined,
      clienteContactado: raw.clienteContactado,
      fechaUltimoContacto: raw.fechaUltimoContacto ? this.convertirTimestampToDate(raw.fechaUltimoContacto) : undefined,
      documentosValidados: raw.documentosValidados,
      documentosPendientes: raw.documentosPendientes,
      certificadoGenerado: raw.certificadoGenerado,
      urlCertificado: raw.urlCertificado,
      contratoGenerado: raw.contratoGenerado,
      urlContrato: raw.urlContrato,
      fechaEntregaProgramada: raw.fechaEntregaProgramada ? this.convertirTimestampToDate(raw.fechaEntregaProgramada) : undefined,
      lugarEntrega: raw.lugarEntrega,
      responsableEntrega: raw.responsableEntrega,
      entregaCompletada: raw.entregaCompletada,
      fechaEntregaReal: raw.fechaEntregaReal ? this.convertirTimestampToDate(raw.fechaEntregaReal) : undefined,
      observacionesGenerales: raw.observacionesGenerales,
      comentariosInternos: raw.comentariosInternos,
      requiereAtencionEspecial: raw.requiereAtencionEspecial,
      motivoAtencionEspecial: raw.motivoAtencionEspecial,
      creadoPor: raw.creadoPor,
      ultimaModificacionPor: raw.ultimaModificacionPor,
      ipCreacion: raw.ipCreacion,
      ipUltimaModificacion: raw.ipUltimaModificacion,

      // Campos calculados
      montoFinanciado,
      totalAPagar,
      diasEnEstado,
      porcentajeProgreso,
      estaVencido,
      requiereAccion
    };
  }

  /**
   * Parsear cliente raw a objeto tipado
   */
  private parsearCliente(raw: ClienteFirebaseRaw): Cliente {
    const fechaCreacion = this.convertirTimestampToDate(raw.createdAt);
    const fechaActualizacion = this.convertirTimestampToDate(raw.updatedAt);
    const fechaNacimiento = new Date(raw.fechaNacimiento);

    // Calcular edad
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNacimiento.getFullYear() - 
      (hoy.getMonth() < fechaNacimiento.getMonth() || 
       (hoy.getMonth() === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate()) ? 1 : 0);

    // Parsear rango de ingresos
    const rangoIngresosNumerico = this.parsearRangoIngresos(raw.rangoIngresos ?? '');

    // Verificar documentos completos
    const tieneDocumentosCompletos = Object.values(raw.archivos?? {}).every(url => url && url.trim() !== '');

    // Estado de licencia
    let estadoLicencia: 'vigente' | 'vencida' | 'sin_licencia' = 'sin_licencia';
    if (raw.numeroLicencia && raw.numeroLicencia.trim() !== '') {
      estadoLicencia = raw.licenciaConducir === 'vigente' ? 'vigente' : 'vencida';
    }

    // Calcular puntaje de confiabilidad
    const puntajeConfiabilidad = this.calcularPuntajeConfiabilidad(raw);

    return {
      id: raw.id || '',
      nombres: raw.nombres,
      apellidoPaterno: raw.apellidoPaterno,
      apellidoMaterno: raw.apellidoMaterno,
      documentType: raw.documentType,
      documentNumber: raw.documentNumber,
      email: raw.email,
      telefono1: raw.telefono1,
      telefono2: raw.telefono2,
      fechaNacimiento,
      estadoCivil: raw.estadoCivil,
      ocupacion: raw.ocupacion,
      rangoIngresos: raw.rangoIngresos,
      departamento: raw.departamento,
      provincia: raw.provincia,
      distrito: raw.distrito,
      direccion: raw.direccion,
      tipoVivienda: raw.tipoVivienda,
      licenciaConducir: raw.licenciaConducir,
      numeroLicencia: raw.numeroLicencia,
      archivos: {
  selfie: raw.archivos?.selfie ?? '',
  dniFrente: raw.archivos?.dniFrente ?? '',
  dniReverso: raw.archivos?.dniReverso ?? '',
  reciboServicio: raw.archivos?.reciboServicio ?? '',
  fachada: raw.archivos?.fachada ?? '',
},
      tipo: raw.tipo,
      fechaCreacion,
      fechaActualizacion,

      // Campos de evaluación
      estadoValidacionDocumentos: raw.estadoValidacionDocumentos,
      documentosObservados: raw.documentosObservados,
      fechaValidacionDocumentos: raw.fechaValidacionDocumentos ? this.convertirTimestampToDate(raw.fechaValidacionDocumentos) : undefined,
      validadoPorId: raw.validadoPorId,
      datosVerificados: raw.datosVerificados,
      fechaVerificacionDatos: raw.fechaVerificacionDatos ? this.convertirTimestampToDate(raw.fechaVerificacionDatos) : undefined,
      verificadoPorId: raw.verificadoPorId,
      inconsistenciasEncontradas: raw.inconsistenciasEncontradas,
      consultaCentralesRealizada: raw.consultaCentralesRealizada,
      fechaConsultaCentrales: raw.fechaConsultaCentrales ? this.convertirTimestampToDate(raw.fechaConsultaCentrales) : undefined,
      resultadoCentrales: raw.resultadoCentrales,
      capacidadAval: raw.capacidadAval,
      relacionConTitular: raw.relacionConTitular,
      tiempoConoceTitular: raw.tiempoConoceTitular,
      aceptaResponsabilidad: raw.aceptaResponsabilidad,
      ingresosVerificados: raw.ingresosVerificados,
      metodosVerificacionIngresos: raw.metodosVerificacionIngresos,
      montoIngresosVerificado: raw.montoIngresosVerificado,
      solicitudesAnteriores: raw.solicitudesAnteriores,
      historialPagos: raw.historialPagos,
      clienteFrecuente: raw.clienteFrecuente,
      requiereValidacionAdicional: raw.requiereValidacionAdicional,
      motivoValidacionAdicional: raw.motivoValidacionAdicional,
      nivelConfianza: raw.nivelConfianza,
      prefiereWhatsapp: raw.prefiereWhatsapp,
      horariosContacto: raw.horariosContacto,
      contactoAlternativo: raw.contactoAlternativo,
      observacionesEvaluador: raw.observacionesEvaluador,
      alertasEspeciales: raw.alertasEspeciales,
      requiereAtencionPersonalizada: raw.requiereAtencionPersonalizada,

      // Campos calculados
      nombreCompleto: `${raw.nombres} ${raw.apellidoPaterno} ${raw.apellidoMaterno}`,
      apellidosCompletos: `${raw.apellidoPaterno} ${raw.apellidoMaterno}`,
      edad,
      direccionCompleta: `${raw.direccion}, ${raw.distrito}, ${raw.provincia}, ${raw.departamento}`,
      tieneDocumentosCompletos,
      estadoLicencia,
      rangoIngresosNumerico,
      puntajeConfiabilidad,
      esAptoCrediticiamente: this.evaluarAptitudCrediticia(raw, puntajeConfiabilidad)
    };
  }

  /**
   * Parsear vehículo raw a objeto tipado
   */
  private parsearVehiculo(raw: VehiculoFirebaseRaw): Vehiculo {
    const fechaCreacion = this.convertirTimestampToDate(raw.createdAt);
    const fechaActualizacion = this.convertirTimestampToDate(raw.updatedAt);
    const anio = Number(raw.anio) || new Date().getFullYear();
    const anioActual = new Date().getFullYear();

    return {
      id: raw.id || '',
      marca: raw.marca,
      modelo: raw.modelo,
      anio,
      color: raw.color,
      fechaCreacion,
      fechaActualizacion,
      categoria: raw.categoria,
      cilindraje: raw.cilindraje,
      precioReferencial: raw.precioReferencial,
      disponibleStock: raw.disponibleStock,
      tiempoEntregaEstimado: raw.tiempoEntregaEstimado,
      requiereMantenimiento: raw.requiereMantenimiento,
      garantiaMeses: raw.garantiaMeses,
      accesoriosIncluidos: raw.accesoriosIncluidos,
      condicion: raw.condicion,
      kilometraje: raw.kilometraje,
      numeroSerie: raw.numeroSerie,
      numeroMotor: raw.numeroMotor,
      placas: raw.placas,
      seguroIncluido: raw.seguroIncluido,
      tramiteDocumentario: raw.tramiteDocumentario,

      // Campos calculados
      descripcionCompleta: `${raw.marca} ${raw.modelo} ${anio} - ${raw.color}`,
      esNuevo: anio === anioActual,
      antiguedad: anioActual - anio,
      valorDepreciado: this.calcularValorDepreciado(raw.precioReferencial || 0, anioActual - anio),
      requiereInspeccion: (raw.condicion === 'usado' && (raw.kilometraje || 0) > 10000)
    };
  }

  /**
   * Parsear referencia raw a objeto tipado
   */
  private parsearReferencia(raw: ReferenciaFirebaseRaw): Referencia {
    const fechaCreacion = this.convertirTimestampToDate(raw.createdAt);
    const fechaActualizacion = this.convertirTimestampToDate(raw.updatedAt);
    const fechaContacto = raw.fechaContacto ? this.convertirTimestampToDate(raw.fechaContacto) : undefined;

    // Validar contacto
    const esContactoValido = /^\d{9,11}$/.test(raw.telefono.replace(/\s+/g, ''));
    const tipoParentesco = this.categorizarParentesco(raw.parentesco);
    const puntajeReferencia = this.calcularPuntajeReferencia(raw);

    return {
      id: raw.id || '',
      nombre: raw.nombre,
      apellidos: raw.apellidos,
      telefono: raw.telefono,
      parentesco: raw.parentesco,
      titularId: raw.titularId,
      fechaCreacion,
      fechaActualizacion,
      estadoVerificacion: raw.estadoVerificacion,
      fechaContacto,
      verificadoPorId: raw.verificadoPorId,
      intentosContacto: raw.intentosContacto,
      horariosContacto: raw.horariosContacto,
      resultadoVerificacion: raw.resultadoVerificacion,
      telefonoAlternativo: raw.telefonoAlternativo,
      email: raw.email,
      direccion: raw.direccion,
      ocupacion: raw.ocupacion,
      esReferenciaLaboral: raw.esReferenciaLaboral,
      empresaTrabaja: raw.empresaTrabaja,
      cargoEmpresa: raw.cargoEmpresa,
      confirmoDatos: raw.confirmoDatos,
      proporcionoInformacionAdicional: raw.proporcionoInformacionAdicional,
      nivelCooperacion: raw.nivelCooperacion,
      requiereReverificacion: raw.requiereReverificacion,

      // Campos calculados
      nombreCompleto: `${raw.nombre} ${raw.apellidos}`,
      esContactoValido,
      tipoParentesco,
      puntajeReferencia,
      esReferenciaConfiable: puntajeReferencia >= 70
    };
  }

  // ==================================================
  // 9. MÉTODOS DE APOYO PARA HISTORIAL Y EVALUACIONES
  // ==================================================

  /**
   * Obtener historial de estados de una solicitud
   */
  private async obtenerHistorialSolicitud(solicitudId: string): Promise<HistorialEstado[]> {
    try {
      const queryRef = query(
        this.historialCollection,
        where('solicitudId', '==', solicitudId),
        orderBy('fechaCambio', 'desc')
      );

      const snapshot = await getDocs(queryRef);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fechaCambio: this.convertirTimestampToDate(data['fechaCambio'])
        } as HistorialEstado;
      });

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }

  /**
   * Obtener evaluaciones de una solicitud
   */
  private async obtenerEvaluacionesSolicitud(solicitudId: string): Promise<Evaluacion[]> {
    try {
      const queryRef = query(
        this.evaluacionesCollection,
        where('solicitudId', '==', solicitudId),
        orderBy('fechaInicio', 'desc')
      );

      const snapshot = await getDocs(queryRef);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fechaInicio: this.convertirTimestampToDate(data['fechaInicio']),
          fechaFin: data['fechaFin'] ? this.convertirTimestampToDate(data['fechaFin']) : undefined
        } as Evaluacion;
      });

    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      return [];
    }
  }

  // ==================================================
  // 10. MÉTODOS DE CÁLCULO Y VALIDACIÓN
  // ==================================================

  /**
   * Calcular resumen de evaluación
   */
  private calcularResumenEvaluacion(solicitud: SolicitudCreditoCompleta): any {
    const totalDocumentos = 5; // selfie, dni frente/reverso, recibo, fachada
    const documentosValidados = solicitud.documentosValidados || 0;
    const porcentajeDocumentosValidados = (documentosValidados / totalDocumentos) * 100;

    const totalReferencias = solicitud.referencias?.length || 0;
    const referenciasVerificadas = solicitud.referencias?.filter(r => r.estadoVerificacion === 'verificado').length || 0;
    const porcentajeReferenciasVerificadas = totalReferencias > 0 ? (referenciasVerificadas / totalReferencias) * 100 : 0;

    const scorePromedioReferencias = solicitud.referencias?.length ? 
      solicitud.referencias.reduce((sum, ref) => sum + ref.puntajeReferencia, 0) / solicitud.referencias.length : 0;

    // Calcular nivel de riesgo
    let nivelRiesgoCalculado: 'bajo' | 'medio' | 'alto' = 'medio';
    const scoreFinal = solicitud.scoreFinal || 0;
    if (scoreFinal >= 80) nivelRiesgoCalculado = 'bajo';
    else if (scoreFinal < 60) nivelRiesgoCalculado = 'alto';

    // Calcular probabilidad de aprobación
    const factores = [
      porcentajeDocumentosValidados,
      porcentajeReferenciasVerificadas,
      scoreFinal,
      scorePromedioReferencias
    ].filter(f => f > 0);
    
    const probabilidadAprobacion = factores.length > 0 ? 
      factores.reduce((sum, f) => sum + f, 0) / factores.length : 0;

    // Recomendación del sistema
    let recomendacionSistema: 'aprobar' | 'rechazar' | 'revisar' = 'revisar';
    if (probabilidadAprobacion >= 75) recomendacionSistema = 'aprobar';
    else if (probabilidadAprobacion < 50) recomendacionSistema = 'rechazar';

    return {
      porcentajeDocumentosValidados,
      porcentajeReferenciasVerificadas,
      scorePromedioReferencias,
      nivelRiesgoCalculado,
      probabilidadAprobacion,
      recomendacionSistema
    };
  }

  /**
   * Generar alertas para una solicitud
   */
  private generarAlertas(solicitud: SolicitudCreditoCompleta): any {
    const alertas = {
      documentosVencidos: [] as string[],
      tiemposExcedidos: [] as string[],
      inconsistenciasDetectadas: [] as string[],
      requiereAtencionUrgente: false
    };

    // Verificar documentos vencidos
    if (solicitud.estaVencido) {
      alertas.tiemposExcedidos.push(`Solicitud vencida: ${solicitud.diasEnEstado} días en ${solicitud.estado}`);
    }

    // Verificar inconsistencias en datos
    if (solicitud.titular?.inconsistenciasEncontradas?.length) {
      alertas.inconsistenciasDetectadas.push(...solicitud.titular.inconsistenciasEncontradas);
    }

    if (solicitud.fiador?.inconsistenciasEncontradas?.length) {
      alertas.inconsistenciasDetectadas.push(...solicitud.fiador.inconsistenciasEncontradas);
    }

    // Determinar si requiere atención urgente
    alertas.requiereAtencionUrgente = 
      alertas.tiemposExcedidos.length > 0 || 
      alertas.inconsistenciasDetectadas.length > 2 ||
      solicitud.requiereAtencionEspecial === true;

    return alertas;
  }

  /**
   * Calcular métricas de una solicitud
   */
  private calcularMetricas(solicitud: SolicitudCreditoCompleta): any {
    const tiempoPromedioRespuesta = solicitud.tiempoTotalProceso || 0;
    
    // Calcular eficiencia basada en tiempo vs. complejidad
    const tiempoEsperado = this.calcularTiempoEsperadoPorEstado(solicitud.estado);
    const eficienciaProces = tiempoEsperado > 0 ? 
      Math.max(0, 100 - ((tiempoPromedioRespuesta - tiempoEsperado) / tiempoEsperado * 100)) : 0;

    return {
      tiempoPromedioRespuesta,
      eficienciaProces: Math.round(eficienciaProces)
    };
  }

  /**
   * Métodos auxiliares de cálculo
   */
  private calcularPrioridad(monto: number): 'Alta' | 'Media' | 'Baja' {
    if (monto >= 8000) return 'Alta';
    if (monto >= 4000) return 'Media';
    return 'Baja';
  }

  private calcularPorcentajeProgreso(estado: EstadoSolicitud): number {
    const estados: { [key in EstadoSolicitud]: number } = {
      'pendiente': 10,
      'en_revision_inicial': 20,
      'evaluacion_documental': 30,
      'documentos_observados': 25,
      'evaluacion_garantes': 40,
      'garante_rechazado': 35,
      'entrevista_programada': 50,
      'en_entrevista': 60,
      'entrevista_completada': 70,
      'en_decision': 80,
      'aprobado': 90,
      'rechazado': 100,
      'condicional': 85,
      'certificado_generado': 95,
      'esperando_inicial': 96,
      'inicial_confirmada': 97,
      'contrato_firmado': 98,
      'entrega_completada': 100,
      'suspendido': 0,
      'cancelado': 100
    };
    return estados[estado] || 0;
  }

  private solicitudRequiereAccion(raw: SolicitudFirebaseRaw): boolean {
    const estadosQuRequierenAccion: EstadoSolicitud[] = [
      'documentos_observados',
      'garante_rechazado',
      'en_decision'
    ];
    return estadosQuRequierenAccion.includes(raw.estado);
  }

  private parsearRangoIngresos(rangoString: string): { min: number; max: number } {
    const rangos: { [key: string]: { min: number; max: number } } = {
      '0-500': { min: 0, max: 500 },
      '500-1000': { min: 500, max: 1000 },
      '1000-1500': { min: 1000, max: 1500 },
      '1500-2000': { min: 1500, max: 2000 },
      '2000-2500': { min: 2000, max: 2500 },
      '2500-3000': { min: 2500, max: 3000 },
      '3000+': { min: 3000, max: Number.MAX_SAFE_INTEGER }
    };
    return rangos[rangoString] || { min: 0, max: 0 };
  }

  private categorizarParentesco(parentesco: string): 'familiar' | 'amigo' | 'laboral' | 'otro' {
    const parentescoLower = parentesco.toLowerCase();
    const familiares = ['padre', 'madre', 'hermano', 'hermana', 'hijo', 'hija', 'esposo', 'esposa', 'primo', 'prima', 'tio', 'tia', 'abuelo', 'abuela'];
    const laborales = ['jefe', 'compañero', 'colega', 'supervisor', 'empleador'];
    const amigos = ['amigo', 'amiga', 'vecino', 'vecina', 'conocido', 'conocida'];

    if (familiares.some(f => parentescoLower.includes(f))) return 'familiar';
    if (laborales.some(l => parentescoLower.includes(l))) return 'laboral';
    if (amigos.some(a => parentescoLower.includes(a))) return 'amigo';
    return 'otro';
  }

  // ==================================================
  // 11. MÉTODOS DE UTILIDAD Y CONVERSIÓN
  // ==================================================

  private convertirTimestampToDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp?._seconds) {
      return new Date(timestamp._seconds * 1000);
    }
    return new Date(timestamp);
  }

  private convertirDatesToTimestamps(obj: any): any {
    const converted = { ...obj };
    Object.keys(converted).forEach(key => {
      if (converted[key] instanceof Date) {
        converted[key] = Timestamp.fromDate(converted[key]);
      } else if (Array.isArray(converted[key])) {
        converted[key] = converted[key].map((item: any) => 
          typeof item === 'object' ? this.convertirDatesToTimestamps(item) : item
        );
      } else if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = this.convertirDatesToTimestamps(converted[key]);
      }
    });
    return converted;
  }

  private async generarNumeroSolicitud(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    return `SOL-${year}-${timestamp.toString().slice(-6)}`;
  }

  private aplicarFiltros(solicitudes: SolicitudCredito[], filtros: any): SolicitudCredito[] {
    let resultado = [...solicitudes];
    
    if (filtros.estado && filtros.estado.length > 0) {
      resultado = resultado.filter(s => filtros.estado.includes(s.estado));
    }
    
    if (filtros.vendedorId) {
      resultado = resultado.filter(s => s.vendedorId === filtros.vendedorId);
    }
    
    if (filtros.evaluadorId) {
      resultado = resultado.filter(s => s.evaluadorActualId === filtros.evaluadorId);
    }
    
    if (filtros.fechaDesde) {
      resultado = resultado.filter(s => s.fechaCreacion >= filtros.fechaDesde);
    }
    
    if (filtros.fechaHasta) {
      resultado = resultado.filter(s => s.fechaCreacion <= filtros.fechaHasta);
    }
    
    if (filtros.prioridad && filtros.prioridad.length > 0) {
      resultado = resultado.filter(s => filtros.prioridad.includes(s.prioridad));
    }
    
    return resultado;
  }

  private contarPorCampo(items: any[], campo: string): { [key: string]: number } {
    return items.reduce((acc, item) => {
      const valor = item[campo];
      acc[valor] = (acc[valor] || 0) + 1;
      return acc;
    }, {});
  }

  private calcularTiempoPromedioEvaluacion(solicitudes: SolicitudCredito[]): number {
    const completadas = solicitudes.filter(s => 
      ['aprobado', 'rechazado', 'entrega_completada'].includes(s.estado)
    );
    
    if (completadas.length === 0) return 0;
    
    const tiempos = completadas.map(s => s.tiempoTotalProceso || 0);
    return tiempos.reduce((sum, tiempo) => sum + tiempo, 0) / tiempos.length / (1000 * 60); // convertir a minutos
  }

  // Métodos adicionales de cálculo específicos
  private calcularPuntajeConfiabilidad(cliente: ClienteFirebaseRaw): number {
    let puntaje = 50; // Base
    
    if (cliente.datosVerificados) puntaje += 20;
    if (cliente.consultaCentralesRealizada) puntaje += 15;
    if (cliente.ingresosVerificados) puntaje += 10;
    if (cliente.clienteFrecuente) puntaje += 5;
    
    return Math.min(100, puntaje);
  }

  private evaluarAptitudCrediticia(cliente: ClienteFirebaseRaw, puntaje: number): boolean {
    return puntaje >= 70 && 
           !cliente.requiereValidacionAdicional &&
           cliente.resultadoCentrales?.equifax !== 'rechazo';
  }

  private calcularValorDepreciado(precio: number, antiguedad: number): number {
    const depreciacionAnual = 0.15; // 15% anual
    return precio * Math.pow(1 - depreciacionAnual, antiguedad);
  }

  private calcularPuntajeReferencia(referencia: ReferenciaFirebaseRaw): number {
    let puntaje = 0;
    
    if (referencia.estadoVerificacion === 'verificado') puntaje += 40;
    if (referencia.resultadoVerificacion?.conoceTitular) puntaje += 20;
    if (referencia.resultadoVerificacion?.recomendaria) puntaje += 25;
    if (referencia.resultadoVerificacion?.confiabilidad) {
      puntaje += (referencia.resultadoVerificacion.confiabilidad / 10) * 15;
    }
    
    return Math.round(puntaje);
  }

  private esTransicionValida(estadoActual: EstadoSolicitud, nuevoEstado: EstadoSolicitud): boolean {
    // Implementar lógica de validación de transiciones
    const transicionesValidas: { [key in EstadoSolicitud]: EstadoSolicitud[] } = {
      'pendiente': ['en_revision_inicial', 'cancelado'],
      'en_revision_inicial': ['evaluacion_documental', 'rechazado'],
      'evaluacion_documental': ['evaluacion_garantes', 'documentos_observados', 'rechazado'],
      'documentos_observados': ['evaluacion_documental', 'rechazado'],
      'evaluacion_garantes': ['entrevista_programada', 'garante_rechazado', 'rechazado'],
      'garante_rechazado': ['evaluacion_garantes', 'rechazado'],
      'entrevista_programada': ['en_entrevista', 'rechazado'],
      'en_entrevista': ['entrevista_completada', 'rechazado'],
      'entrevista_completada': ['en_decision'],
      'en_decision': ['aprobado', 'rechazado', 'condicional'],
      'aprobado': ['certificado_generado'],
      'condicional': ['certificado_generado', 'rechazado'],
      'certificado_generado': ['esperando_inicial'],
      'esperando_inicial': ['inicial_confirmada'],
      'inicial_confirmada': ['contrato_firmado'],
      'contrato_firmado': ['entrega_completada'],
      'entrega_completada': [],
      'rechazado': [],
      'suspendido': ['en_revision_inicial'],
      'cancelado': []
    };
    
    return transicionesValidas[estadoActual]?.includes(nuevoEstado) || false;
  }

  private requiereFechaLimite(estado: EstadoSolicitud): boolean {
    const estadosConLimite: EstadoSolicitud[] = [
      'evaluacion_documental', 'evaluacion_garantes', 'en_entrevista', 'en_decision'
    ];
    return estadosConLimite.includes(estado);
  }

  private calcularFechaLimite(estado: EstadoSolicitud): Timestamp {
    const horasLimite: { [key in EstadoSolicitud]?: number } = {
      'evaluacion_documental': 24,
      'evaluacion_garantes': 48,
      'en_entrevista': 24,
      'en_decision': 72
    };
    
    const horas = horasLimite[estado] || 24;
    const fechaLimite = new Date();
    fechaLimite.setHours(fechaLimite.getHours() + horas);
    
    return Timestamp.fromDate(fechaLimite);
  }

  private calcularTiempoEsperadoPorEstado(estado: EstadoSolicitud): number {
    const tiemposEsperados: { [key in EstadoSolicitud]: number } = {
      'pendiente': 60, // 1 hora
      'en_revision_inicial': 120, // 2 horas
      'evaluacion_documental': 480, // 8 horas
      'documentos_observados': 240, // 4 horas
      'evaluacion_garantes': 720, // 12 horas
      'garante_rechazado': 480, // 8 horas
      'entrevista_programada': 1440, // 24 horas
      'en_entrevista': 60, // 1 hora
      'entrevista_completada': 120, // 2 horas
      'en_decision': 2880, // 48 horas
      'aprobado': 240, // 4 horas
      'rechazado': 0,
      'condicional': 480, // 8 horas
      'certificado_generado': 480, // 8 horas
      'esperando_inicial': 4320, // 72 horas
      'inicial_confirmada': 240, // 4 horas
      'contrato_firmado': 480, // 8 horas
      'entrega_completada': 0,
      'suspendido': 0,
      'cancelado': 0
    };
    
    return tiemposEsperados[estado] || 0;
  }

  private async actualizarContadorDocumentos(solicitudId: string): Promise<void> {
    try {
      const queryRef = query(
        this.documentosCollection,
        where('solicitudId', '==', solicitudId)
      );
      
      const snapshot = await getDocs(queryRef);
      const documentos = snapshot.docs.map(doc => doc.data());
      
      const validados = documentos.filter(doc => doc['estado'] === 'aprobado').length;
      const pendientes = documentos.filter(doc => doc['estado'] === 'pendiente').length;
      
      await this.actualizarSolicitud(
        solicitudId,
        {
          documentosValidados: validados,
          documentosPendientes: pendientes
        },
        'system',
        'Sistema',
        'Actualización automática de contadores'
      );
      
    } catch (error) {
      console.error('Error actualizando contador documentos:', error);
    }
  }

  private async ejecutarAccionesPostCambioEstado(
    solicitudId: string,
    nuevoEstado: EstadoSolicitud
  ): Promise<void> {
    try {
      switch (nuevoEstado) {
        case 'aprobado':
          await this.generarCertificadoAprobacion(solicitudId);
          break;
        case 'certificado_generado':
          await this.notificarCertificadoDisponible(solicitudId);
          break;
        case 'rechazado':
          await this.notificarRechazo(solicitudId);
          break;
        case 'documentos_observados':
          await this.notificarDocumentosObservados(solicitudId);
          break;
        case 'entrevista_programada':
          await this.programarEntrevistaAutomatica(solicitudId);
          break;
      }
    } catch (error) {
      console.error('Error ejecutando acciones post cambio estado:', error);
    }
  }

  // ==================================================
  // 12. MÉTODOS ESPECÍFICOS DE ACCIONES AUTOMÁTICAS
  // ==================================================

  private async generarCertificadoAprobacion(solicitudId: string): Promise<void> {
    console.log(`Generando certificado para solicitud: ${solicitudId}`);
    // TODO: Implementar generación de PDF del certificado
    
    await this.actualizarSolicitud(
      solicitudId,
      {
        certificadoGenerado: true,
        urlCertificado: `https://certificados.example.com/${solicitudId}.pdf`
      },
      'system',
      'Sistema',
      'Certificado generado automáticamente'
    );
  }

  private async notificarCertificadoDisponible(solicitudId: string): Promise<void> {
    console.log(`Notificando certificado disponible: ${solicitudId}`);
    // TODO: Implementar envío de notificación
  }

  private async notificarRechazo(solicitudId: string): Promise<void> {
    console.log(`Notificando rechazo: ${solicitudId}`);
    // TODO: Implementar notificación de rechazo
  }

  private async notificarDocumentosObservados(solicitudId: string): Promise<void> {
    console.log(`Notificando documentos observados: ${solicitudId}`);
    // TODO: Implementar notificación de documentos observados
  }

  private async programarEntrevistaAutomatica(solicitudId: string): Promise<void> {
    console.log(`Programando entrevista automática: ${solicitudId}`);
    // TODO: Implementar lógica de programación de entrevista
  }

  // ==================================================
  // 13. MÉTODOS PÚBLICOS DE GESTIÓN DE FILTROS
  // ==================================================

  /**
   * Actualizar filtros (dispara actualización reactiva)
   */
  actualizarFiltros(filtros: {
    estado?: EstadoSolicitud[];
    vendedorId?: string;
    evaluadorId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    prioridad?: string[];
  }): void {
    this.filtrosSubject.next(filtros);
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtrosSubject.next({});
  }

  // ==================================================
  // 14. MÉTODOS DE GESTIÓN DE EVALUADORES Y USUARIOS
  // ==================================================

  /**
   * Obtener evaluadores disponibles por tipo
   */
  async obtenerEvaluadoresPorTipo(tipoEvaluacion: TipoEvaluacion): Promise<any[]> {
    try {
      // TODO: Implementar consulta a tabla de usuarios/evaluadores
      const evaluadores = [
        { id: 'eval1', nombre: 'Juan Pérez', especialidad: 'documental' },
        { id: 'eval2', nombre: 'Ana Martínez', especialidad: 'garantes' },
        { id: 'eval3', nombre: 'Luis García', especialidad: 'entrevistas' }
      ];
      
      return evaluadores.filter(e => e.especialidad === tipoEvaluacion);
    } catch (error) {
      console.error('Error obteniendo evaluadores:', error);
      return [];
    }
  }

  /**
   * Obtener carga de trabajo de un evaluador
   */
  async obtenerCargaTrabajoEvaluador(evaluadorId: string): Promise<{
    solicitudesAsignadas: number;
    solicitudesPendientes: number;
    tiempoPromedioEvaluacion: number;
  }> {
    try {
      const solicitudes = await this.getSolicitudesPorEvaluador(evaluadorId).toPromise();
      
      const pendientes = solicitudes?.filter(s => 
        !['aprobado', 'rechazado', 'entrega_completada'].includes(s.estado)
      ).length || 0;
      
      const completadas = solicitudes?.filter(s => 
        ['aprobado', 'rechazado', 'entrega_completada'].includes(s.estado)
      ) || [];
      
      const tiempoPromedio = completadas.length > 0 
        ? completadas.reduce((sum, s) => sum + (s.tiempoTotalProceso || 0), 0) / completadas.length
        : 0;

      return {
        solicitudesAsignadas: solicitudes?.length || 0,
        solicitudesPendientes: pendientes,
        tiempoPromedioEvaluacion: tiempoPromedio
      };
    } catch (error) {
      console.error('Error obteniendo carga de trabajo:', error);
      return {
        solicitudesAsignadas: 0,
        solicitudesPendientes: 0,
        tiempoPromedioEvaluacion: 0
      };
    }
  }

  // ==================================================
  // 15. MÉTODOS DE REPORTING Y ANALYTICS
  // ==================================================

  /**
   * Generar reporte de rendimiento por período
   */
  async generarReporteRendimiento(
    fechaInicio: Date,
    fechaFin: Date,
    filtros?: {
      evaluadorId?: string;
      vendedorId?: string;
      estados?: EstadoSolicitud[];
    }
  ): Promise<{
    totalSolicitudes: number;
    solicitudesPorEstado: { [key: string]: number };
    tiempoPromedioEvaluacion: number;
    tasaAprobacion: number;
    solicitudesVencidas: number;
    topVendedores: { vendedor: string; solicitudes: number }[];
    topEvaluadores: { evaluador: string; solicitudes: number; tiempoPromedio: number }[];
  }> {
    try {
      // Obtener solicitudes del período
      let queryConstraints: QueryConstraint[] = [
        where('createdAt', '>=', Timestamp.fromDate(fechaInicio)),
        where('createdAt', '<=', Timestamp.fromDate(fechaFin)),
        orderBy('createdAt', 'desc')
      ];

      // Aplicar filtros adicionales
      if (filtros?.evaluadorId) {
        queryConstraints.push(where('evaluadorActualId', '==', filtros.evaluadorId));
      }

      if (filtros?.vendedorId) {
        queryConstraints.push(where('vendedorId', '==', filtros.vendedorId));
      }

      const queryRef = query(this.solicitudesCollection, ...queryConstraints);
      const snapshot = await getDocs(queryRef);
      
      let solicitudes = snapshot.docs.map(doc => 
        this.parsearSolicitud({ id: doc.id, ...doc.data() } as SolicitudFirebaseRaw)
      );

      // Aplicar filtro de estados si se especifica
      if (filtros?.estados && filtros.estados.length > 0) {
        solicitudes = solicitudes.filter(s => filtros.estados!.includes(s.estado));
      }

      // Calcular métricas
      const solicitudesPorEstado = this.contarPorCampo(solicitudes, 'estado');
      const tiempoPromedioEvaluacion = this.calcularTiempoPromedioEvaluacion(solicitudes);
      
      const aprobadas = solicitudes.filter(s => 
        ['aprobado', 'certificado_generado', 'entrega_completada'].includes(s.estado)
      ).length;
      const tasaAprobacion = solicitudes.length > 0 ? (aprobadas / solicitudes.length) * 100 : 0;
      
      const solicitudesVencidas = solicitudes.filter(s => s.estaVencido).length;
      
      // Top vendedores
      const ventasPorVendedor = this.contarPorCampo(solicitudes, 'vendedorNombre');
      const topVendedores = Object.entries(ventasPorVendedor)
        .map(([vendedor, solicitudes]) => ({ vendedor, solicitudes }))
        .sort((a, b) => b.solicitudes - a.solicitudes)
        .slice(0, 5);

      // Top evaluadores
      const evaluacionesPorEvaluador = solicitudes.reduce((acc, s) => {
        if (s.evaluadorActualId) {
          if (!acc[s.evaluadorActualId]) {
            acc[s.evaluadorActualId] = { solicitudes: 0, tiempoTotal: 0 };
          }
          acc[s.evaluadorActualId].solicitudes++;
          acc[s.evaluadorActualId].tiempoTotal += s.tiempoTotalProceso || 0;
        }
        return acc;
      }, {} as { [key: string]: { solicitudes: number; tiempoTotal: number } });

      const topEvaluadores = Object.entries(evaluacionesPorEvaluador)
        .map(([evaluador, data]) => ({
          evaluador,
          solicitudes: data.solicitudes,
          tiempoPromedio: data.solicitudes > 0 ? data.tiempoTotal / data.solicitudes : 0
        }))
        .sort((a, b) => b.solicitudes - a.solicitudes)
        .slice(0, 5);

      return {
        totalSolicitudes: solicitudes.length,
        solicitudesPorEstado,
        tiempoPromedioEvaluacion,
        tasaAprobacion,
        solicitudesVencidas,
        topVendedores,
        topEvaluadores
      };

    } catch (error) {
      console.error('Error generando reporte:', error);
      throw error;
    }
  }

  /**
   * Obtener métricas en tiempo real para dashboard
   */
  getMetricasEnTiempoReal(): Observable<{
    solicitudesHoy: number;
    solicitudesPendientes: number;
    solicitudesVencidas: number;
    eficienciaPromedio: number;
  }> {
    return this.getSolicitudesReactivo().pipe(
      map(solicitudes => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const solicitudesHoy = solicitudes.filter(s => 
          s.fechaCreacion >= hoy
        ).length;

        const solicitudesPendientes = solicitudes.filter(s => 
          !['aprobado', 'rechazado', 'entrega_completada', 'cancelado'].includes(s.estado)
        ).length;

        const solicitudesVencidas = solicitudes.filter(s => s.estaVencido).length;

        const eficienciaPromedio = solicitudes.length > 0 
          ? solicitudes.reduce((sum, s) => sum + s.porcentajeProgreso, 0) / solicitudes.length
          : 0;

        return {
          solicitudesHoy,
          solicitudesPendientes,
          solicitudesVencidas,
          eficienciaPromedio: Math.round(eficienciaPromedio)
        };
      })
    );
  }

  // ==================================================
  // 16. MÉTODOS DE CACHE Y OPTIMIZACIÓN
  // ==================================================

  /**
   * Limpiar cache de solicitudes
   */
  limpiarCache(): void {
    this.solicitudesCache.set([]);
  }

  /**
   * Obtener solicitudes desde cache
   */
  getSolicitudesDesdeCache(): SolicitudCredito[] {
    return this.solicitudesCache();
  }

  /**
   * Precargar datos relacionados para mejor performance
   */
  async precargarDatosRelacionados(solicitudIds: string[]): Promise<void> {
    try {
      console.log(`Precargando datos para ${solicitudIds.length} solicitudes...`);
      
      // Precargar en lotes para evitar sobrecarga
      const loteSize = 10;
      for (let i = 0; i < solicitudIds.length; i += loteSize) {
        const lote = solicitudIds.slice(i, i + loteSize);
        await Promise.all(
          lote.map(id => this.obtenerSolicitudCompleta(id))
        );
      }
      
      console.log('Precarga completada');
    } catch (error) {
      console.error('Error en precarga:', error);
    }
  }

  // ==================================================
  // 17. MÉTODOS DE VALIDACIÓN Y SEGURIDAD
  // ==================================================

  /**
   * Validar permisos de usuario para operación
   */
  validarPermisos(operacion: string, usuarioRol: RolUsuario): boolean {
    const permisos: { [key: string]: RolUsuario[] } = {
      'crear_solicitud': ['admin', 'asesor', 'vendedor'],
      'asignar_evaluador': ['admin', 'supervisor', 'asesor'],
      'evaluar_documentos': ['admin', 'evaluador_documental'],
      'evaluar_garantes': ['admin', 'evaluador_garantes'],
      'realizar_entrevista': ['admin', 'entrevistador'],
      'tomar_decision': ['admin', 'oficial_credito'],
      'aprobar_credito': ['admin', 'oficial_credito'],
      'ver_todas_solicitudes': ['admin', 'supervisor'],
      'generar_reportes': ['admin', 'supervisor', 'oficial_credito']
    };

    return permisos[operacion]?.includes(usuarioRol) || false;
  }

  /**
   * Auditar acción de usuario
   */
  async auditarAccion(
    usuarioId: string,
    accion: string,
    solicitudId?: string,
    detalles?: any
  ): Promise<void> {
    try {
      const auditData = {
        usuarioId,
        accion,
        solicitudId: solicitudId || null,
        detalles: detalles || null,
        fechaAccion: serverTimestamp(),
        ip: 'pending' // TODO: obtener IP real
      };

      await addDoc(collection(this.firestore, 'auditoria'), auditData);
    } catch (error) {
      console.error('Error auditando acción:', error);
    }
  }

  // ==================================================
  // 18. MÉTODOS DE INTEGRACIÓN CON OTROS SISTEMAS
  // ==================================================

  

}// ==================================================



