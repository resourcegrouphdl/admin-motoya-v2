import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, catchError, of } from 'rxjs';

import { ClienteEvaluacionService } from './cliente-evaluacion.service';


/**
 * Estado del sistema integrado
 */
export interface EstadoSistemaOTOYA {
  inicializado: boolean;
  migracionCompletada: boolean;
  sistemaListo: boolean;
  error?: string;
  procesoActual?: string;
  versionModelo: 'OTOYA-2.0';
  ultimaValidacion?: Date;
}

/**
 * Resumen completo del sistema OTOYA
 */
export interface ResumenSistemaOTOYA {
  // Migración OTOYA
  migracion: {
    totalV1: number;
    totalMigradosOTOYA: number;
    pendientesMigracion: number;
    ultimaMigracion?: Date;
    entidadesCreadas: {
      solicitudes: number;
      personas: number;
      vehiculos: number;
      documentos: number;
      referencias: number;
    };
    estadosMigracion: {
      exitosos: number;
      fallidos: number;
      rollbacks: number;
    };
  };
  
  // Evaluación integrada
  evaluacion: {
    expedientesDisponibles: number;
    evaluacionesPendientes: number;
    evaluacionesEnProceso: number;
    evaluacionesCompletadas: number;
    evaluacionesRechazadas: number;
    tiempoPromedioEvaluacion: number;
    tasaAprobacion: number;
    alertasCriticas: number;
  };
  
  // Calidad del sistema
  calidad: {
    integridadDatos: number;
    completitudModelo: number;
    consistenciaRelacional: number;
    errorRate: number;
  };
  
  // Estado general
  sistemaOperativo: boolean;
  ultimaActualizacion: Date;
  alertasActivas: string[];
}

/**
 * Métricas en tiempo real OTOYA
 */

@Injectable({
  providedIn: 'root'
})
export class SistemaEvaluacionIntegradoService {


  private evaluacionService = inject(ClienteEvaluacionService);
  
  // Estados del sistema OTOYA
  private estadoSistema = signal<EstadoSistemaOTOYA>({
    inicializado: false,
    migracionCompletada: false,
    sistemaListo: false,
    versionModelo: 'OTOYA-2.0'
  });
  
  private resumenSistema = signal<ResumenSistemaOTOYA | null>(null);
  
  // Observables públicos
  readonly estadoSistema$ = this.estadoSistema.asReadonly();
  readonly resumenSistema$ = this.resumenSistema.asReadonly();
  
  // Subject para notificar cambios de estado
  private estadoSubject = new BehaviorSubject<EstadoSistemaOTOYA>(this.estadoSistema());
  
  /**
   * Inicializar sistema completo OTOYA con migración automática
   */
  async inicializarSistemaOTOYA(): Promise<void> {
    console.log('🚀 [SistemaOTOYA] Iniciando sistema completo con modelo OTOYA...');
    
    try {
      this.actualizarEstado({
        inicializado: false,
        migracionCompletada: false,
        sistemaListo: false,
        versionModelo: 'OTOYA-2.0',
        procesoActual: 'Inicializando sistema OTOYA...'
      });
      
      // Paso 1: Verificar y ejecutar migración OTOYA
      
      // Paso 3: Preparar expedientes para evaluación
      await this.prepararExpedientesEvaluacion();
      
      // Paso 4: Marcar sistema como listo
      this.actualizarEstado({
        inicializado: true,
        migracionCompletada: true,
        sistemaListo: true,
        versionModelo: 'OTOYA-2.0',
        ultimaValidacion: new Date(),
        procesoActual: undefined
      });
      
      // Paso 5: Cargar resumen inicial
     
      
      console.log('✅ [SistemaOTOYA] Sistema OTOYA inicializado correctamente');
      
    } catch (error) {
      console.error('❌ [SistemaOTOYA] Error inicializando sistema:', error);
      this.actualizarEstado({
        inicializado: true,
        migracionCompletada: false,
        sistemaListo: false,
        versionModelo: 'OTOYA-2.0',
        error: `Error de inicialización OTOYA: ${error}`,
        procesoActual: undefined
      });
      throw error;
    }
  }
  
  /**
   * Verificar migración OTOYA y ejecutarla si es necesaria
   */
  
  /**
   * Validar integridad del modelo OTOYA migrado
   */
  
  /**
   * Preparar expedientes OTOYA para evaluación
   */
  private async prepararExpedientesEvaluacion(): Promise<void> {
    console.log('🔧 [SistemaOTOYA] Preparando expedientes OTOYA para evaluación...');
    
    this.actualizarEstado({
      ...this.estadoSistema(),
      procesoActual: 'Preparando expedientes OTOYA...'
    });
    
    try {
      
      
    } catch (error) {
      console.error('❌ [SistemaOTOYA] Error preparando expedientes:', error);
      console.warn('⚠️ [SistemaOTOYA] Continuando sin preparación completa de expedientes');
    }
  }
  
  /**
   * Sincronizar expedientes OTOYA con sistema de evaluación
   */
  private async sincronizarExpedientesConEvaluacion(statsOTOYA: any): Promise<void> {
    console.log('🔄 [SistemaOTOYA] Sincronizando expedientes con evaluación...');
    
    let expedientesSincronizados = 0;
    
    // TODO: Obtener lista de solicitudes OTOYA y crear expedientes de evaluación
    // Por ahora simulamos el proceso
    
    expedientesSincronizados = statsOTOYA.entidadesOTOYA.solicitudes;
    
    if (expedientesSincronizados > 0) {
      console.log(`✅ [SistemaOTOYA] ${expedientesSincronizados} expedientes sincronizados para evaluación`);
    }
  }
  
  /**
   * Actualizar resumen completo del sistema OTOYA
   */
  
  /**
   * Generar alertas activas del sistema
   */
  private generarAlertasActivas(statsOTOYA: any, statsEvaluacion: any): string[] {
    const alertas: string[] = [];
    
    if (statsOTOYA.resumenGeneral.pendientesMigracion > 0) {
      alertas.push(`${statsOTOYA.resumenGeneral.pendientesMigracion} solicitudes sin migrar a OTOYA`);
    }
    
    if (statsOTOYA.calidad.integridadDatos < 95) {
      alertas.push(`Integridad de datos OTOYA: ${statsOTOYA.calidad.integridadDatos}%`);
    }
    
    if (statsOTOYA.estadosMigracion.fallidos > 0) {
      alertas.push(`${statsOTOYA.estadosMigracion.fallidos} migraciones OTOYA fallidas`);
    }
    
    if (statsEvaluacion.totalPendientes > 50) {
      alertas.push(`Alto volumen de evaluaciones pendientes: ${statsEvaluacion.totalPendientes}`);
    }
    
    if (statsOTOYA.rendimiento.errorRate > 5) {
      alertas.push(`Tasa de errores elevada: ${statsOTOYA.rendimiento.errorRate}%`);
    }
    
    return alertas;
  }
  
  /**
   * Crear expediente OTOYA completo para evaluación
   */
  async crearExpedienteParaEvaluacion(solicitudId: string): Promise<any> {
    try {
     
      
    } catch (error) {
      console.error(`❌ [SistemaOTOYA] Error creando expediente: ${error}`);
      throw error;
    }
  }
  
  /**
   * Forzar migración manual OTOYA
   */
  async forzarMigracionOTOYA(): Promise<void> {
    console.log('🔄 [SistemaOTOYA] Forzando migración manual OTOYA...');
    
    this.actualizarEstado({
      ...this.estadoSistema(),
      procesoActual: 'Ejecutando migración manual OTOYA...'
    });
    
    try {
     
     
      
      this.actualizarEstado({
        ...this.estadoSistema(),
        procesoActual: undefined
      });
      
    } catch (error) {
      this.actualizarEstado({
        ...this.estadoSistema(),
        error: `Error en migración manual OTOYA: ${error}`,
        procesoActual: undefined
      });
      throw error;
    }
  }
  
  /**
  
  
  /**
   * Reinicializar sistema completo OTOYA
   */
  async reinicializarSistemaOTOYA(): Promise<void> {
    console.log('🔄 [SistemaOTOYA] Reinicializando sistema OTOYA...');
    
    // Resetear estado
    this.actualizarEstado({
      inicializado: false,
      migracionCompletada: false,
      sistemaListo: false,
      versionModelo: 'OTOYA-2.0',
      error: undefined,
      procesoActual: 'Reinicializando OTOYA...'
    });
    
    this.resumenSistema.set(null);
    
    // Reinicializar con modelo OTOYA
    await this.inicializarSistemaOTOYA();
  }
  
  /**
   * Obtener métricas en tiempo real OTOYA
   */
  
 
  
  /**
   * Obtener clientes pendientes de evaluación (expedientes OTOYA)
   */
  obtenerExpedientesPendientes(): Observable<any[]> {
    // TODO: Adaptar para trabajar con expedientes OTOYA
    return this.evaluacionService.obtenerClientesPendientes();
  }
  
  /**
   * Obtener expedientes en proceso de evaluación
   */
  obtenerExpedientesEnProceso(): Observable<any[]> {
    // TODO: Adaptar para trabajar con expedientes OTOYA
    return this.evaluacionService.obtenerClientesEnProceso();
  }
  
  /**
   * Actualizar estado interno y notificar cambios
   */
  private actualizarEstado(nuevoEstado: EstadoSistemaOTOYA): void {
    this.estadoSistema.set(nuevoEstado);
    this.estadoSubject.next(nuevoEstado);
    
    console.log('📊 [SistemaOTOYA] Estado actualizado:', nuevoEstado);
  }
  
  /**
   * Observable del estado del sistema OTOYA
   */
  get estadoSistemaObservable(): Observable<EstadoSistemaOTOYA> {
    return this.estadoSubject.asObservable();
  }
  
  /**
   * Verificar si el sistema OTOYA está listo
   */
  get sistemaListo(): boolean {
    return this.estadoSistema().sistemaListo;
  }
  
  /**
   * Obtener último error del sistema
   */
  get ultimoError(): string | undefined {
    return this.estadoSistema().error;
  }
  
  /**
   * Obtener proceso actual
   */
  get procesoActual(): string | undefined {
    return this.estadoSistema().procesoActual;
  }
  
  /**
   * Obtener versión del modelo
   */
  get versionModelo(): string {
    return this.estadoSistema().versionModelo;
  }

  // ======================================
  // MÉTODOS DE COMPATIBILIDAD (LEGACY)
  // ======================================
  
  /**
   * Métodos de compatibilidad con la interfaz anterior
   * para mantener funcionando el dashboard existente
   */
  
  async inicializarSistema(): Promise<void> {
    return this.inicializarSistemaOTOYA();
  }
  
  
  
  obtenerClientesPendientes(): Observable<any[]> {
    return this.obtenerExpedientesPendientes();
  }
  
  obtenerClientesEnProceso(): Observable<any[]> {
    return this.obtenerExpedientesEnProceso();
  }
  
  async forzarMigracion(): Promise<void> {
    return this.forzarMigracionOTOYA();
  }
  
  async reinicializarSistema(): Promise<void> {
    return this.reinicializarSistemaOTOYA();
  }
  
  
  
 

  
}