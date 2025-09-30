import { inject, Injectable, signal } from '@angular/core';import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  collectionData,
  addDoc
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';


interface ResultadoCentrales {
  equifax: 'aprobado' | 'condicional' | 'rechazo';
  sentinel: 'aprobado' | 'condicional' | 'rechazo';
  scoreEquifax: number;
  scoreSentinel: number;
  deudaTotal: number;
  reporteCompleto: string;
  fechaConsulta: Date;
}

interface EvaluacionDocumental {
  dniValido: boolean;
  rostroCoincide: boolean;
  documentosLegibles: boolean;
  reciboServicioValido: boolean;
  fachadaCorresponde: boolean;
  observaciones: string;
  evaluadoPor: string;
  fechaEvaluacion: Date;
  score: number;
}

interface EvaluacionIngresos {
  metodosVerificacion: string[];
  montoDeclarado: number;
  montoVerificado: number;
  consistencia: 'alta' | 'media' | 'baja';
  observaciones: string;
  evaluadoPor: string;
  fechaEvaluacion: Date;
}

interface ClienteEvaluado {
  id: string;
  // Datos base (del cliente migrado)
  datosBasicos: any;
  ubicacion: any;
  documentos: any;
  
  // Estados de evaluación
  evaluacion: {
    estado: 'pendiente' | 'en_proceso' | 'completada' | 'rechazada';
    asignadoA?: string;
    fechaAsignacion?: Date;
    fechaCompletada?: Date;
    prioridad: 'alta' | 'media' | 'baja';
    
    // Sub-evaluaciones
    documental?: EvaluacionDocumental;
    centrales?: ResultadoCentrales;
    ingresos?: EvaluacionIngresos;
    
    // Resultado final
    scoreTotal: number;
    nivelRiesgo: 'bajo' | 'medio' | 'alto';
    recomendacion: 'aprobar' | 'condicional' | 'rechazar';
    observacionesFinales?: string;
    
    // Alertas y flags
    requiereRevisionManual: boolean;
    alertasActivas: string[];
    motivosRechazo: string[];
  };
  
  metadatos: {
    fechaCreacion: Date;
    fechaActualizacion: Date;
    evaluadoPor?: string;
    versionEvaluacion: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClienteEvaluacionService {

  private firestore = inject(Firestore);
  
  // Collections
  private clientesEvaluacion = collection(this.firestore, 'clientes_evaluacion_v2');
  private evaluacionesLog = collection(this.firestore, 'evaluaciones_log');
  
  // Signals
  private clientesCache = signal<ClienteEvaluado[]>([]);
  private cargando = signal<boolean>(false);
  
  /**
   * Obtener clientes pendientes de evaluación
   */
  obtenerClientesPendientes(): Observable<ClienteEvaluado[]> {
    const queryRef = query(
      this.clientesEvaluacion,
      where('evaluacion.estado', '==', 'pendiente'),
      orderBy('metadatos.fechaCreacion', 'desc')
    );
    
    return collectionData(queryRef, { idField: 'id' }).pipe(
      map((clientes: any[]) => 
        clientes.map(cliente => this.mapearClienteEvaluado(cliente))
      )
    );
  }
  
  /**
   * Obtener clientes en proceso de evaluación
   */
  obtenerClientesEnProceso(): Observable<ClienteEvaluado[]> {
    const queryRef = query(
      this.clientesEvaluacion,
      where('evaluacion.estado', '==', 'en_proceso'),
      orderBy('evaluacion.fechaAsignacion', 'asc')
    );
    
    return collectionData(queryRef, { idField: 'id' }).pipe(
      map((clientes: any[]) => 
        clientes.map(cliente => this.mapearClienteEvaluado(cliente))
      )
    );
  }
  
  /**
   * Asignar cliente a evaluador
   */
  async asignarClienteAEvaluador(
    clienteId: string, 
    evaluadorId: string,
    evaluadorNombre: string
  ): Promise<void> {
    try {
      const clienteRef = doc(this.clientesEvaluacion, clienteId);
      
      const updates = {
        'evaluacion.estado': 'en_proceso',
        'evaluacion.asignadoA': evaluadorId,
        'evaluacion.fechaAsignacion': serverTimestamp(),
        'metadatos.fechaActualizacion': serverTimestamp()
      };
      
      await updateDoc(clienteRef, updates);
      
      // Log de asignación
      await this.registrarAccionEvaluacion(
        clienteId,
        'asignacion',
        evaluadorId,
        `Cliente asignado a ${evaluadorNombre}`
      );
      
    } catch (error) {
      console.error('Error asignando cliente:', error);
      throw error;
    }
  }
  
  /**
   * Realizar evaluación documental
   */
  async realizarEvaluacionDocumental(
    clienteId: string,
    evaluacion: EvaluacionDocumental,
    evaluadorId: string
  ): Promise<void> {
    try {
      const clienteRef = doc(this.clientesEvaluacion, clienteId);
      
      const updates = {
        'evaluacion.documental': {
          ...evaluacion,
          fechaEvaluacion: serverTimestamp()
        },
        'metadatos.fechaActualizacion': serverTimestamp()
      };
      
      await updateDoc(clienteRef, updates);
      
      // Recalcular score total
      await this.recalcularScoreCliente(clienteId);
      
      await this.registrarAccionEvaluacion(
        clienteId,
        'evaluacion_documental',
        evaluadorId,
        `Evaluación documental completada. Score: ${evaluacion.score}`
      );
      
    } catch (error) {
      console.error('Error en evaluación documental:', error);
      throw error;
    }
  }
  
  /**
   * Consultar centrales de riesgo
   */
  async consultarCentralesRiesgo(
    clienteId: string,
    documentNumber: string,
    evaluadorId: string
  ): Promise<ResultadoCentrales> {
    try {
      // Simulación de consulta a centrales
      // En producción, aquí irían las llamadas a APIs reales
      const resultado = await this.simularConsultaCentrales(documentNumber);
      
      const clienteRef = doc(this.clientesEvaluacion, clienteId);
      
      const updates = {
        'evaluacion.centrales': {
          ...resultado,
          fechaConsulta: serverTimestamp()
        },
        'metadatos.fechaActualizacion': serverTimestamp()
      };
      
      await updateDoc(clienteRef, updates);
      
      // Recalcular score
      await this.recalcularScoreCliente(clienteId);
      
      await this.registrarAccionEvaluacion(
        clienteId,
        'consulta_centrales',
        evaluadorId,
        `Centrales consultadas. Equifax: ${resultado.equifax}, Sentinel: ${resultado.sentinel}`
      );
      
      return resultado;
      
    } catch (error) {
      console.error('Error consultando centrales:', error);
      throw error;
    }
  }
  
  /**
   * Evaluar ingresos del cliente
   */
  async evaluarIngresos(
    clienteId: string,
    evaluacion: EvaluacionIngresos,
    evaluadorId: string
  ): Promise<void> {
    try {
      const clienteRef = doc(this.clientesEvaluacion, clienteId);
      
      const updates = {
        'evaluacion.ingresos': {
          ...evaluacion,
          fechaEvaluacion: serverTimestamp()
        },
        'metadatos.fechaActualizacion': serverTimestamp()
      };
      
      await updateDoc(clienteRef, updates);
      
      await this.recalcularScoreCliente(clienteId);
      
      await this.registrarAccionEvaluacion(
        clienteId,
        'evaluacion_ingresos',
        evaluadorId,
        `Ingresos evaluados. Declarado: ${evaluacion.montoDeclarado}, Verificado: ${evaluacion.montoVerificado}`
      );
      
    } catch (error) {
      console.error('Error evaluando ingresos:', error);
      throw error;
    }
  }
  
  /**
   * Completar evaluación
   */
  async completarEvaluacion(
    clienteId: string,
    observacionesFinales: string,
    evaluadorId: string
  ): Promise<void> {
    try {
      const cliente = await this.obtenerClientePorId(clienteId);
      if (!cliente) throw new Error('Cliente no encontrado');
      
      // Calcular resultado final
      const { nivelRiesgo, recomendacion } = this.determinarRecomendacionFinal(cliente);
      
      const clienteRef = doc(this.clientesEvaluacion, clienteId);
      
      const updates = {
        'evaluacion.estado': 'completada',
        'evaluacion.fechaCompletada': serverTimestamp(),
        'evaluacion.nivelRiesgo': nivelRiesgo,
        'evaluacion.recomendacion': recomendacion,
        'evaluacion.observacionesFinales': observacionesFinales,
        'metadatos.fechaActualizacion': serverTimestamp(),
        'metadatos.evaluadoPor': evaluadorId
      };
      
      await updateDoc(clienteRef, updates);
      
      await this.registrarAccionEvaluacion(
        clienteId,
        'evaluacion_completada',
        evaluadorId,
        `Evaluación completada. Recomendación: ${recomendacion}`
      );
      
    } catch (error) {
      console.error('Error completando evaluación:', error);
      throw error;
    }
  }
  
  /**
   * Rechazar cliente
   */
  async rechazarCliente(
    clienteId: string,
    motivos: string[],
    observaciones: string,
    evaluadorId: string
  ): Promise<void> {
    try {
      const clienteRef = doc(this.clientesEvaluacion, clienteId);
      
      const updates = {
        'evaluacion.estado': 'rechazada',
        'evaluacion.fechaCompletada': serverTimestamp(),
        'evaluacion.recomendacion': 'rechazar',
        'evaluacion.motivosRechazo': motivos,
        'evaluacion.observacionesFinales': observaciones,
        'metadatos.fechaActualizacion': serverTimestamp(),
        'metadatos.evaluadoPor': evaluadorId
      };
      
      await updateDoc(clienteRef, updates);
      
      await this.registrarAccionEvaluacion(
        clienteId,
        'cliente_rechazado',
        evaluadorId,
        `Cliente rechazado. Motivos: ${motivos.join(', ')}`
      );
      
    } catch (error) {
      console.error('Error rechazando cliente:', error);
      throw error;
    }
  }
  
  /**
   * Obtener cliente por ID
   */
  async obtenerClientePorId(clienteId: string): Promise<ClienteEvaluado | null> {
    try {
      const docRef = doc(this.clientesEvaluacion, clienteId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.mapearClienteEvaluado({
          id: docSnap.id,
          ...docSnap.data()
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas de evaluación
   */
  async obtenerEstadisticasEvaluacion(): Promise<{
    totalPendientes: number;
    totalEnProceso: number;
    totalCompletadas: number;
    totalRechazadas: number;
    tiempoPromedioEvaluacion: number;
    tasaAprobacion: number;
  }> {
    try {
      const snapshot = await getDocs(this.clientesEvaluacion);
      const clientes = snapshot.docs.map(doc => 
        this.mapearClienteEvaluado({ id: doc.id, ...doc.data() })
      );
      
      const pendientes = clientes.filter(c => c.evaluacion.estado === 'pendiente').length;
      const enProceso = clientes.filter(c => c.evaluacion.estado === 'en_proceso').length;
      const completadas = clientes.filter(c => c.evaluacion.estado === 'completada').length;
      const rechazadas = clientes.filter(c => c.evaluacion.estado === 'rechazada').length;
      
      const completadasConFecha = clientes.filter(c => 
        c.evaluacion.estado === 'completada' && 
        c.evaluacion.fechaAsignacion && 
        c.evaluacion.fechaCompletada
      );
      
      const tiempoPromedio = completadasConFecha.length > 0 ? 
        completadasConFecha.reduce((sum, c) => {
          const inicio = c.evaluacion.fechaAsignacion!.getTime();
          const fin = c.evaluacion.fechaCompletada!.getTime();
          return sum + (fin - inicio);
        }, 0) / completadasConFecha.length / (1000 * 60 * 60) : 0; // en horas
      
      const aprobadas = clientes.filter(c => 
        c.evaluacion.recomendacion === 'aprobar' || 
        c.evaluacion.recomendacion === 'condicional'
      ).length;
      
      const tasaAprobacion = (completadas + rechazadas) > 0 ? 
        (aprobadas / (completadas + rechazadas)) * 100 : 0;
      
      return {
        totalPendientes: pendientes,
        totalEnProceso: enProceso,
        totalCompletadas: completadas,
        totalRechazadas: rechazadas,
        tiempoPromedioEvaluacion: tiempoPromedio,
        tasaAprobacion
      };
      
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
  
  // Métodos privados
  
  private mapearClienteEvaluado(data: any): ClienteEvaluado {
    return {
      ...data,
      metadatos: {
        ...data.metadatos,
        fechaCreacion: this.convertirTimestampToDate(data.metadatos?.fechaCreacion),
        fechaActualizacion: this.convertirTimestampToDate(data.metadatos?.fechaActualizacion)
      },
      evaluacion: {
        ...data.evaluacion,
        fechaAsignacion: data.evaluacion?.fechaAsignacion ? 
          this.convertirTimestampToDate(data.evaluacion.fechaAsignacion) : undefined,
        fechaCompletada: data.evaluacion?.fechaCompletada ? 
          this.convertirTimestampToDate(data.evaluacion.fechaCompletada) : undefined,
        documental: data.evaluacion?.documental ? {
          ...data.evaluacion.documental,
          fechaEvaluacion: this.convertirTimestampToDate(data.evaluacion.documental.fechaEvaluacion)
        } : undefined,
        centrales: data.evaluacion?.centrales ? {
          ...data.evaluacion.centrales,
          fechaConsulta: this.convertirTimestampToDate(data.evaluacion.centrales.fechaConsulta)
        } : undefined,
        ingresos: data.evaluacion?.ingresos ? {
          ...data.evaluacion.ingresos,
          fechaEvaluacion: this.convertirTimestampToDate(data.evaluacion.ingresos.fechaEvaluacion)
        } : undefined
      }
    };
  }
  
  private async recalcularScoreCliente(clienteId: string): Promise<void> {
    try {
      const cliente = await this.obtenerClientePorId(clienteId);
      if (!cliente) return;
      
      let scoreTotal = 0;
      let factores = 0;
      const alertas: string[] = [];
      
      // Score documental (40% del total)
      if (cliente.evaluacion.documental) {
        scoreTotal += cliente.evaluacion.documental.score * 0.4;
        factores += 0.4;
        
        if (cliente.evaluacion.documental.score < 60) {
          alertas.push('Documentos con calificación baja');
        }
      }
      
      // Score centrales (40% del total)
      if (cliente.evaluacion.centrales) {
        let scoreCentrales = 0;
        
        if (cliente.evaluacion.centrales.equifax === 'aprobado') scoreCentrales += 50;
        else if (cliente.evaluacion.centrales.equifax === 'condicional') scoreCentrales += 30;
        
        if (cliente.evaluacion.centrales.sentinel === 'aprobado') scoreCentrales += 50;
        else if (cliente.evaluacion.centrales.sentinel === 'condicional') scoreCentrales += 30;
        
        scoreTotal += scoreCentrales * 0.4;
        factores += 0.4;
        
        if (cliente.evaluacion.centrales.equifax === 'rechazo' || 
            cliente.evaluacion.centrales.sentinel === 'rechazo') {
          alertas.push('Reporte negativo en centrales de riesgo');
        }
      }
      
      // Score ingresos (20% del total)
      if (cliente.evaluacion.ingresos) {
        let scoreIngresos = 0;
        
        if (cliente.evaluacion.ingresos.consistencia === 'alta') scoreIngresos = 100;
        else if (cliente.evaluacion.ingresos.consistencia === 'media') scoreIngresos = 70;
        else scoreIngresos = 40;
        
        scoreTotal += scoreIngresos * 0.2;
        factores += 0.2;
        
        if (cliente.evaluacion.ingresos.consistencia === 'baja') {
          alertas.push('Inconsistencia en verificación de ingresos');
        }
      }
      
      // Normalizar score
      const scoreFinal = factores > 0 ? scoreTotal / factores : 0;
      
      // Determinar si requiere revisión manual
      const requiereRevision = scoreFinal < 70 || alertas.length > 0;
      
      const clienteRef = doc(this.clientesEvaluacion, clienteId);
      const updates = {
        'evaluacion.scoreTotal': Math.round(scoreFinal),
        'evaluacion.alertasActivas': alertas,
        'evaluacion.requiereRevisionManual': requiereRevision,
        'metadatos.fechaActualizacion': serverTimestamp()
      };
      
      await updateDoc(clienteRef, updates);
      
    } catch (error) {
      console.error('Error recalculando score:', error);
      throw error;
    }
  }
  
  private determinarRecomendacionFinal(cliente: ClienteEvaluado): {
    nivelRiesgo: 'bajo' | 'medio' | 'alto';
    recomendacion: 'aprobar' | 'condicional' | 'rechazar';
  } {
    const score = cliente.evaluacion.scoreTotal || 0;
    
    // Factores de rechazo automático
    if (cliente.evaluacion.centrales?.equifax === 'rechazo' ||
        cliente.evaluacion.centrales?.sentinel === 'rechazo') {
      return { nivelRiesgo: 'alto', recomendacion: 'rechazar' };
    }
    
    if (cliente.evaluacion.documental && 
        (!cliente.evaluacion.documental.dniValido || !cliente.evaluacion.documental.rostroCoincide)) {
      return { nivelRiesgo: 'alto', recomendacion: 'rechazar' };
    }
    
    // Evaluación por score
    if (score >= 80) {
      return { nivelRiesgo: 'bajo', recomendacion: 'aprobar' };
    } else if (score >= 65) {
      return { nivelRiesgo: 'medio', recomendacion: 'condicional' };
    } else {
      return { nivelRiesgo: 'alto', recomendacion: 'rechazar' };
    }
  }
  
  private async simularConsultaCentrales(documentNumber: string): Promise<ResultadoCentrales> {
    // Simulación de consulta a centrales de riesgo
    // En producción, esto sería una llamada a API real
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular latencia
    
    const random = Math.random();
    
    return {
      equifax: random > 0.7 ? 'aprobado' : random > 0.3 ? 'condicional' : 'rechazo',
      sentinel: random > 0.6 ? 'aprobado' : random > 0.4 ? 'condicional' : 'rechazo',
      scoreEquifax: Math.floor(Math.random() * 400) + 300, // 300-700
      scoreSentinel: Math.floor(Math.random() * 400) + 300,
      deudaTotal: Math.floor(Math.random() * 50000),
      reporteCompleto: `Reporte generado para DNI ${documentNumber}`,
      fechaConsulta: new Date()
    };
  }
  
  private async registrarAccionEvaluacion(
    clienteId: string,
    accion: string,
    usuarioId: string,
    descripcion: string
  ): Promise<void> {
    try {
      const logRef = collection(this.firestore, 'evaluaciones_log');
      await addDoc(logRef, {
        clienteId,
        accion,
        usuarioId,
        descripcion,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error registrando acción:', error);
    }
  }
  
  private convertirTimestampToDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000);
    }
    
    return new Date(timestamp);
  }
}