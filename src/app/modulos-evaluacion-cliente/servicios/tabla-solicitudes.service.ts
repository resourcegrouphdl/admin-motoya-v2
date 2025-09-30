import { computed, inject, Injectable, signal } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Observable, map, catchError, tap, of, BehaviorSubject } from 'rxjs';
interface Titular {
  nombre?: string;
  apellido?: string;
  documentNumber?: string;
  telefono1?: string;
  telefono2?: string;
  email?: string;
  dniFrenteuRL?: string;
  dniReversoURL?: string;
  licConducirFrenteURL?: string;
}

interface FormularioFirebase {
  id?: string;
  createdAt?: any;
  formTitular?: Titular;
  formularioVehiculo: any;
  formularioFiador: any;
}

export interface CreditRequest {
  id: string;
  clientName: string;
  registrationDate: Date;
  sellerName: string;
  amount: number;
  status: 'pending' | 'in-progress' | 'approved' | 'rejected';
  puntoVenta: string;
  vehiculo: string;
  telefono: string;
  email: string;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  statusNote: string;
}

export interface SolicitudesStats {
  total: number;
  pending: number;
  inProgress: number;
  approved: number;
  rejected: number;
  highPriority: number;
  avgAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TablaSolicitudesService {

  private firebaseService = inject(FirebaseService);
  
  // Estado con signals
  private creditRequests = signal<CreditRequest[]>([]);
  private lastSearchTerm = signal<string>('');
  private lastUpdateTime = signal<Date>(new Date(0));

  // Cache duration: 3 minutos
  private readonly CACHE_DURATION_MS = 3 * 60 * 1000;

  // Logging subject para debugging
  private debugLog$ = new BehaviorSubject<string>('TablaSolicitudesService inicializado');

  // Getters computados
  public readonly requests = computed(() => this.creditRequests());
  public readonly stats = computed(() => this.calculateStats());
  public readonly isDataFresh = computed(() => !this.isCacheExpired());

  constructor() {
    this.log('🚀 TablaSolicitudesService inicializado');
  }

  /**
   * Obtiene solicitudes con cache inteligente
   */
  getSolicitudes(forceRefresh: boolean = false): Observable<CreditRequest[]> {
    this.log(`📊 getSolicitudes - forceRefresh: ${forceRefresh}`);
    
    // Cache hit
    if (!forceRefresh && !this.isCacheExpired() && this.creditRequests().length > 0) {
      this.log(`✅ Cache hit - ${this.creditRequests().length} solicitudes desde cache`);
      return of(this.creditRequests());
    }

    // Cache miss - cargar desde Firebase
    this.log('🔄 Cache miss - cargando desde Firebase');
    return this.loadFromFirebase();
  }

  /**
   * Búsqueda optimizada con cache por término
   */
  searchSolicitudes(searchTerm: string): Observable<CreditRequest[]> {
    const term = searchTerm.trim();
    this.log(`🔍 Buscando: "${term}"`);

    // Si no hay término, devolver todas las solicitudes
    if (!term) {
      this.lastSearchTerm.set('');
      return this.getSolicitudes();
    }

    // Si es el mismo término reciente, usar cache
    
    if (term === this.lastSearchTerm() && !this.isCacheExpired()) {
      this.log(`✅ Búsqueda desde cache para: "${term}"`);
      return of(this.creditRequests());
    }

    this.lastSearchTerm.set(term);

    // Determinar tipo de búsqueda y ejecutar
    if (/^\d+$/.test(term)) {
      this.log(`🔢 Búsqueda por documento: ${term}`);
      return this.searchByDocumento(term);
    } else {
      this.log(`👤 Búsqueda por nombre: ${term}`);
      return this.searchByNombre(term);
    }
  }
  searchByNombre(term: string): Observable<CreditRequest[]> {
    throw new Error('Method not implemented.');
  }
  searchByDocumento(term: string): Observable<CreditRequest[]> {
    throw new Error('Method not implemented.');
  }

  /**
   * Filtra solicitudes localmente por estado
   */
  filterByStatus(status: string): CreditRequest[] {
    const filtered = status === 'all' 
      ? this.creditRequests() 
      : this.creditRequests().filter(req => req.status === status);
    
    this.log(`🔽 Filtro por estado "${status}": ${filtered.length} resultados`);
    return filtered;
  }

  /**
   * Filtra solicitudes localmente por prioridad
   */
  filterByPriority(priority: string): CreditRequest[] {
    const filtered = priority === 'all' 
      ? this.creditRequests() 
      : this.creditRequests().filter(req => req.priority === priority);
    
    this.log(`⭐ Filtro por prioridad "${priority}": ${filtered.length} resultados`);
    return filtered;
  }

  /**
   * Refresca datos forzando actualización
   */
  refresh(): Observable<CreditRequest[]> {
    this.log('🔄 Refresh manual iniciado');
    return this.getSolicitudes(true);
  }

  /**
   * Limpia cache y estado
   */
  clearCache(): void {
    this.log('🗑️ Limpiando cache');
    this.creditRequests.set([]);
    this.lastSearchTerm.set('');
    this.lastUpdateTime.set(new Date(0));
  }

  /**
   * Observable para logs de debugging
   */
  get debugLogs$(): Observable<string> {
    return this.debugLog$.asObservable();
  }

  // === MÉTODOS PRIVADOS ===

  /**
   * Carga datos desde Firebase
   */
  private loadFromFirebase(): Observable<CreditRequest[]> {
  this.log('⬇️ Iniciando carga desde Firebase...');

  return this.firebaseService.getAllWithMeta<FormularioFirebase>("clientes").pipe(
    map(clientes => {
      this.log(`📦 Datos recibidos de Firebase: ${clientes.length} clientes`);
      console.log('Clientes con metadata:', clientes);

      const requests = this.parseClientesToRequests(clientes);
      this.log(`✨ Datos procesados: ${requests.length} solicitudes`);
      return requests;
    }),
    tap(requests => {
      this.creditRequests.set(requests);
      this.updateTimestamp();
      this.log(`💾 Cache actualizado con ${requests.length} solicitudes`);
    }),
    catchError(error => {
      this.log(`❌ Error cargando desde Firebase: ${error.message}`);
      throw error;
    })
  );
}

  /**
   * Búsqueda por documento
   
  private searchByDocumento(documento: string): Observable<CreditRequest[]> {
    this.log(`🔍 Ejecutando búsqueda por documento en Firebase: ${documento}`);

    return this.firebaseService.searchByDocumento(documento).pipe(
      map(clientes => {
        this.log(`📦 Búsqueda por documento - Resultados: ${clientes.length} clientes`);
        const requests = this.parseClientesToRequests(clientes);
        this.updateTimestamp();
        return requests;
      }),
      tap(requests => {
        this.creditRequests.set(requests);
        this.log(`💾 Cache actualizado con resultados de búsqueda: ${requests.length} solicitudes`);
      }),
      catchError(error => {
        this.log(`❌ Error en búsqueda por documento: ${error.message}`);
        throw error;
      })
    );
  }

  /**
   * Búsqueda por nombre
   
  private searchByNombre(nombre: string): Observable<CreditRequest[]> {
    this.log(`🔍 Ejecutando búsqueda por nombre en Firebase: ${nombre}`);

    return this.firebaseService.searchByNombre(nombre).pipe(
      map(clientes => {
        this.log(`📦 Búsqueda por nombre - Resultados: ${clientes.length} clientes`);
        const requests = this.parseClientesToRequests(clientes);
        this.updateTimestamp();
        return requests;
      }),
      tap(requests => {
        this.creditRequests.set(requests);
        this.log(`💾 Cache actualizado con resultados de búsqueda: ${requests.length} solicitudes`);
      }),
      catchError(error => {
        this.log(`❌ Error en búsqueda por nombre: ${error.message}`);
        throw error;
      })
    );
  }

  /**
   * Convierte clientes de Firebase a CreditRequest
   */
 private parseClientesToRequests(clientes: FormularioFirebase[]): CreditRequest[] {
  console.log('🔄 PROCESANDO CLIENTES:', clientes.length);
  
  const requests = clientes.map((cliente, index) => {
    const request = this.parseClienteToRequest(cliente);
    if (index < 5) {
      console.log(`📝 Cliente ${index}:`, {
        id: cliente.id,
        nombre: cliente.formTitular?.nombre,
        apellido: cliente.formTitular?.apellido,
        resultado: request.clientName
      });
    }
    return request;
  });
  
  console.log('✅ SOLICITUDES PROCESADAS:', requests.length);
  return requests;
}

  /**
   * Convierte un cliente individual a CreditRequest (optimizado)
   */
  private parseClienteToRequest(cliente: FormularioFirebase): CreditRequest {
    const { formTitular: titular = {} as any, formularioVehiculo: vehiculo = {} as any } = cliente;
    
    const clientName = `${titular.nombre || ''} ${titular.apellido || ''}`.trim() || 'Sin nombre';
    const vehiculoDesc = `${vehiculo.marcaVehiculo || ''} ${vehiculo.modeloVehiculo || ''} ${vehiculo.colorVehiculo || ''}`.trim() || 'Sin especificar';
    const amount = vehiculo.precioCompraMoto || 0;
    const registrationDate = this.parseDate(cliente.createdAt);

    return {
      id: cliente.id || '',
      clientName,
      registrationDate,
      sellerName: vehiculo.nombreDelVendedor || 'No especificado',
      amount,
      status: this.determineStatus(cliente),
      puntoVenta: vehiculo.puntoDeVenta || 'No especificado',
      vehiculo: vehiculoDesc,
      telefono: titular.telefono1 || titular.telefono2 || 'No disponible',
      email: titular.email || 'No disponible',
      priority: this.calculatePriority(amount, registrationDate),
      progress: this.calculateProgress(cliente),
      statusNote: this.generateStatusNote(cliente)
    };
  }

  /**
   * Determina estado optimizado
   */
  private determineStatus(cliente: FormularioFirebase): CreditRequest['status'] {
    const { formTitular: titular = {}, formularioVehiculo: vehiculo = {}, formularioFiador: fiador = {} } = cliente;

    const hasBasicInfo = Boolean(titular.nombre && titular.apellido && titular.documentNumber);
    const hasVehicleInfo = Boolean(vehiculo.marcaVehiculo && vehiculo.modeloVehiculo);
    const hasDocuments = Boolean(titular.dniFrenteuRL && titular.dniReversoURL);
    const hasFinancialInfo = Boolean(vehiculo.precioCompraMoto && vehiculo.montotDeLaCuota);
    const hasFiador = Boolean(fiador.nombreFiador);

    if (!hasBasicInfo || !hasVehicleInfo) return 'pending';
    if (hasBasicInfo && hasVehicleInfo && hasFinancialInfo && hasDocuments && hasFiador) return 'pending';
    if (hasBasicInfo && hasVehicleInfo && hasFinancialInfo) return 'pending';
    
    return 'pending';
  }

  /**
   * Calcula prioridad optimizada
   */
  private calculatePriority(amount: number, date: Date): CreditRequest['priority'] {
    const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (amount > 15000 || daysSince > 7) return 'high';
    if ((amount >= 5000 && amount <= 15000) || (daysSince >= 3 && daysSince <= 7)) return 'medium';
    return 'low';
  }

  /**
   * Calcula progreso optimizado
   */
  private calculateProgress(cliente: FormularioFirebase): number {
    const { formTitular: titular = {}, formularioVehiculo: vehiculo = {}, formularioFiador: fiador = {} } = cliente;

    let score = 0;
    const checks = [
      Boolean(titular.nombre && titular.apellido),                    // 1
      Boolean(titular.documentNumber && titular.email),              // 1
      Boolean(titular.dniFrenteuRL && titular.dniReversoURL),        // 1
      Boolean(titular.licConducirFrenteURL),                         // 1
      Boolean(vehiculo.marcaVehiculo && vehiculo.modeloVehiculo),    // 1
      Boolean(vehiculo.precioCompraMoto && vehiculo.montotDeLaCuota), // 1
      Boolean(fiador.nombreFiador && fiador.documentNumberFiador),   // 1
      Boolean(vehiculo.nombreDelVendedor)                            // 1
    ];

    score = checks.filter(Boolean).length;
    return Math.round((score / 8) * 100);
  }

  /**
   * Genera nota de estado optimizada
   */
  private generateStatusNote(cliente: FormularioFirebase): string {
    const status = this.determineStatus(cliente);
    const progress = this.calculateProgress(cliente);

    const statusMessages = {
      'pending': 'Información básica incompleta',
      'in-progress': `En proceso - ${progress}% completado`,
      'approved': 'Documentación completa',
      'rejected': 'Solicitud rechazada'
    };

    return statusMessages[status] || 'Estado indeterminado';
  }

  /**
   * Calcula estadísticas optimizada
   */
  private calculateStats(): SolicitudesStats {
    const requests = this.creditRequests();
    const len = requests.length;
    
    if (len === 0) {
      return { total: 0, pending: 0, inProgress: 0, approved: 0, rejected: 0, highPriority: 0, avgAmount: 0 };
    }

    let pending = 0, inProgress = 0, approved = 0, rejected = 0, highPriority = 0, totalAmount = 0;

    for (const req of requests) {
      switch (req.status) {
        case 'pending': pending++; break;
        case 'in-progress': inProgress++; break;
        case 'approved': approved++; break;
        case 'rejected': rejected++; break;
      }
      if (req.priority === 'high') highPriority++;
      totalAmount += req.amount;
    }

    return {
      total: len,
      pending,
      inProgress,
      approved,
      rejected,
      highPriority,
      avgAmount: Math.round(totalAmount / len)
    };
  }

  /**
   * Utilities
   */
  private parseDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  }

  private isCacheExpired(): boolean {
    return (Date.now() - this.lastUpdateTime().getTime()) > this.CACHE_DURATION_MS;
  }

  private updateTimestamp(): void {
    this.lastUpdateTime.set(new Date());
  }

  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`%c${logMessage}`, 'color: #2196F3; font-weight: bold;');
    this.debugLog$.next(logMessage);
  }
}