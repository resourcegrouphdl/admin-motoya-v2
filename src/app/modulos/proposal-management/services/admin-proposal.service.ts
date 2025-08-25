import { Injectable, inject, signal, computed } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  deleteDoc,
  orderBy,
  Query,
  Unsubscribe,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';


export interface Proposal {
  id: string;
  uidTienda: string;
  marca: string;
  modelo: string;
  precio: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fechaCreacion: string;
  fechaAprobacion?: string;
  motivoRechazo?: string;
  negociaciones: Negotiation[];
}

export interface Negotiation {
  id: string;
  mensaje: string;
  autor: 'tienda' | 'financiera';
  fecha: string;
}

export interface OfficialProduct {
  id: string;
  uidTienda: string;
  marca: string;
  modelo: string;
  precio: number;
  fechaAprobacion: string;
  propuestaOriginalId: string;
  evaluadoPor?: string; // UID del administrador que evaluó
}

export interface ProposalEvaluation {
  proposalId: string;
  accion: 'aprobar' | 'rechazar';
  motivoRechazo?: string;
  evaluadoPor: string; // UID del admin
  fechaEvaluacion: string;
}

export interface AdminFilters {
  estado?: 'pendiente' | 'aprobado' | 'rechazado' | 'todos';
  uidTienda?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  marca?: string;
}


@Injectable({
  providedIn: 'root'
})
export class AdminProposalService {

  

  private _firestore = inject(Firestore);
  private _proposalsCollection = collection(this._firestore, 'proposals');
  private _officialProductsCollection = collection(this._firestore, 'official_products');
  
  // Signals para propuestas
  private _proposalsSignal = signal<Proposal[]>([]);
  private _loadingProposalsSignal = signal<boolean>(false);
  private _errorProposalsSignal = signal<string | null>(null);
  
  // Signals para productos oficiales
  private _officialProductsSignal = signal<OfficialProduct[]>([]);
  private _loadingOfficialSignal = signal<boolean>(false);
  private _errorOfficialSignal = signal<string | null>(null);
  
  // Listeners activos
  private _proposalsListener: Unsubscribe | null = null;
  private _officialProductsListener: Unsubscribe | null = null;
  
  // Subject para filtros
  private _filtersSubject = new BehaviorSubject<AdminFilters>({});

  // Computed signals públicos
  public readonly proposals = this._proposalsSignal.asReadonly();
  public readonly officialProducts = this._officialProductsSignal.asReadonly();
  public readonly loadingProposals = this._loadingProposalsSignal.asReadonly();
  public readonly loadingOfficial = this._loadingOfficialSignal.asReadonly();
  public readonly errorProposals = this._errorProposalsSignal.asReadonly();
  public readonly errorOfficial = this._errorOfficialSignal.asReadonly();
  
  // Filtros por estado
  public readonly pendingProposals = computed(() => 
    this._proposalsSignal().filter(p => p.estado === 'pendiente')
  );
  public readonly approvedProposals = computed(() => 
    this._proposalsSignal().filter(p => p.estado === 'aprobado')
  );
  public readonly rejectedProposals = computed(() => 
    this._proposalsSignal().filter(p => p.estado === 'rechazado')
  );

  constructor() {
    console.log('AdminProposalService inicializado');
  }

  /**
   * Inicializar listeners para la vista administrativa
   */
  initializeAdminView(filters: AdminFilters = {}): void {
    console.log('Inicializando vista administrativa con filtros:', filters);
    this.startProposalsListener(filters);
    this.startOfficialProductsListener(filters);
  }

  /**
   * Listener para todas las propuestas (con filtros administrativos)
   */
  private startProposalsListener(filters: AdminFilters): void {
    this.stopProposalsListener();
    
    this._loadingProposalsSignal.set(true);
    this._errorProposalsSignal.set(null);

    const q = this.buildProposalsQuery(filters);

    this._proposalsListener = onSnapshot(
      q,
      (querySnapshot) => {
        console.log('Propuestas recibidas (admin):', querySnapshot.size);
        
        const proposals: Proposal[] = [];
        
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          
          if (!data['marca'] || !data['modelo'] || !data['uidTienda']) {
            console.warn('Propuesta con datos incompletos:', docSnapshot.id);
            return;
          }
          
          const proposal: Proposal = {
            id: docSnapshot.id,
            uidTienda: data['uidTienda'] || '',
            marca: data['marca'] || '',
            modelo: data['modelo'] || '',
            precio: typeof data['precio'] === 'number' ? data['precio'] : 0,
            estado: data['estado'] || 'pendiente',
            fechaCreacion: data['fechaCreacion'] || this.getCurrentISOString(),
            fechaAprobacion: data['fechaAprobacion'],
            motivoRechazo: data['motivoRechazo'],
            negociaciones: Array.isArray(data['negociaciones']) ? data['negociaciones'] : [],
          };
          
          proposals.push(proposal);
        });

        // Aplicar filtros adicionales en el cliente
        const filteredProposals = this.applyClientSideFilters(proposals, filters);

        // Ordenar por fecha (más recientes primero)
        filteredProposals.sort((a, b) => {
          const dateA = new Date(a.fechaCreacion);
          const dateB = new Date(b.fechaCreacion);
          return dateB.getTime() - dateA.getTime();
        });

        this._proposalsSignal.set(filteredProposals);
        this._loadingProposalsSignal.set(false);
        
        console.log('Propuestas administrativas actualizadas:', {
          total: filteredProposals.length,
          pendientes: filteredProposals.filter(p => p.estado === 'pendiente').length,
          aprobadas: filteredProposals.filter(p => p.estado === 'aprobado').length,
          rechazadas: filteredProposals.filter(p => p.estado === 'rechazado').length
        });
      },
      (error) => {
        console.error('Error en listener propuestas admin:', error);
        this._errorProposalsSignal.set('Error al cargar propuestas');
        this._loadingProposalsSignal.set(false);
      }
    );
  }

  /**
   * Listener para productos oficiales (vista administrativa)
   */
  private startOfficialProductsListener(filters: AdminFilters): void {
    this.stopOfficialProductsListener();
    
    this._loadingOfficialSignal.set(true);
    this._errorOfficialSignal.set(null);

    const q = query(
      this._officialProductsCollection,
      orderBy('fechaAprobacion', 'desc')
    );

    this._officialProductsListener = onSnapshot(
      q,
      (querySnapshot) => {
        console.log('Productos oficiales recibidos (admin):', querySnapshot.size);
        
        const products: OfficialProduct[] = [];
        
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          
          const product: OfficialProduct = {
            id: docSnapshot.id,
            uidTienda: data['uidTienda'] || '',
            marca: data['marca'] || '',
            modelo: data['modelo'] || '',
            precio: typeof data['precio'] === 'number' ? data['precio'] : 0,
            fechaAprobacion: data['fechaAprobacion'] || this.getCurrentISOString(),
            propuestaOriginalId: data['propuestaOriginalId'] || '',
            evaluadoPor: data['evaluadoPor'],
          };
          
          products.push(product);
        });

        this._officialProductsSignal.set(products);
        this._loadingOfficialSignal.set(false);
        
        console.log('Productos oficiales admin actualizados:', products.length);
      },
      (error) => {
        console.error('Error en listener productos oficiales admin:', error);
        this._errorOfficialSignal.set('Error al cargar productos oficiales');
        this._loadingOfficialSignal.set(false);
      }
    );
  }

  /**
   * Aprobar una propuesta (función principal de admin)
   */
  async approveProposal(proposalId: string, evaluadoPor: string): Promise<void> {
    console.log('Aprobando propuesta:', proposalId, 'por:', evaluadoPor);
    this._loadingProposalsSignal.set(true);

    try {
      // Obtener la propuesta
      const proposal = await this.getProposalById(proposalId);
      if (!proposal) {
        throw new Error('Propuesta no encontrada');
      }

      const fechaAprobacion = this.getCurrentISOString();

      // 1. Crear producto oficial
      const officialProductData = {
        uidTienda: proposal.uidTienda,
        marca: proposal.marca,
        modelo: proposal.modelo,
        precio: proposal.precio,
        fechaAprobacion,
        propuestaOriginalId: proposalId,
        evaluadoPor,
        _serverTimestamp: serverTimestamp(),
      };

      await addDoc(this._officialProductsCollection, officialProductData);

      // 2. Actualizar estado de la propuesta original (opcional: mantener para historial)
      await updateDoc(doc(this._firestore, 'proposals', proposalId), {
        estado: 'aprobado',
        fechaAprobacion,
        evaluadoPor,
        _lastUpdated: serverTimestamp(),
      });

      console.log('Propuesta aprobada y agregada a lista oficial');
      this._loadingProposalsSignal.set(false);
    } catch (error) {
      console.error('Error al aprobar propuesta:', error);
      this._errorProposalsSignal.set('Error al aprobar la propuesta');
      this._loadingProposalsSignal.set(false);
      throw error;
    }
  }

  /**
   * Rechazar una propuesta con motivo
   */
  async rejectProposal(
    proposalId: string, 
    motivoRechazo: string, 
    evaluadoPor: string
  ): Promise<void> {
    console.log('Rechazando propuesta:', proposalId, 'motivo:', motivoRechazo);
    this._loadingProposalsSignal.set(true);

    try {
      const updateData = {
        estado: 'rechazado' as const,
        motivoRechazo,
        evaluadoPor,
        fechaEvaluacion: this.getCurrentISOString(),
        _lastUpdated: serverTimestamp(),
      };

      await updateDoc(doc(this._firestore, 'proposals', proposalId), updateData);
      
      console.log('Propuesta rechazada exitosamente');
      this._loadingProposalsSignal.set(false);
    } catch (error) {
      console.error('Error al rechazar propuesta:', error);
      this._errorProposalsSignal.set('Error al rechazar la propuesta');
      this._loadingProposalsSignal.set(false);
      throw error;
    }
  }

  /**
   * Agregar respuesta de la financiera a una negociación
   */
  async addFinancialResponse(
    proposalId: string,
    mensaje: string,
    autor: string
  ): Promise<void> {
    console.log('Agregando respuesta financiera:', proposalId);
    this._loadingProposalsSignal.set(true);

    try {
      const proposal = await this.getProposalById(proposalId);
      if (!proposal) {
        throw new Error('Propuesta no encontrada');
      }

      const negotiation: Negotiation = {
        id: crypto.randomUUID(),
        mensaje,
        autor: 'financiera',
        fecha: this.getCurrentISOString(),
      };

      const updatedNegotiations = [...proposal.negociaciones, negotiation];

      await updateDoc(doc(this._firestore, 'proposals', proposalId), {
        negociaciones: updatedNegotiations,
        respondidoPor: autor,
        _lastUpdated: serverTimestamp(),
      });

      console.log('Respuesta financiera agregada');
      this._loadingProposalsSignal.set(false);
    } catch (error) {
      console.error('Error al agregar respuesta financiera:', error);
      this._errorProposalsSignal.set('Error al agregar respuesta');
      this._loadingProposalsSignal.set(false);
      throw error;
    }
  }

  /**
   * Obtener propuesta por ID
   */
  private async getProposalById(proposalId: string): Promise<Proposal | null> {
    try {
      const docSnap = await getDoc(doc(this._firestore, 'proposals', proposalId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uidTienda: data['uidTienda'],
          marca: data['marca'],
          modelo: data['modelo'],
          precio: data['precio'],
          estado: data['estado'],
          fechaCreacion: data['fechaCreacion'],
          fechaAprobacion: data['fechaAprobacion'],
          motivoRechazo: data['motivoRechazo'],
          negociaciones: data['negociaciones'] || [],
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener propuesta:', error);
      throw error;
    }
  }

  /**
   * Construir query para propuestas con filtros administrativos
   */
  private buildProposalsQuery(filters: AdminFilters): Query {
    let q: Query = collection(this._firestore, 'proposals');

    // Filtro básico - solo un where para evitar índices compuestos
    if (filters.estado && filters.estado !== 'todos') {
      q = query(q, where('estado', '==', filters.estado));
    } else if (filters.uidTienda) {
      q = query(q, where('uidTienda', '==', filters.uidTienda));
    }

    // Agregar ordenamiento
    q = query(q, orderBy('fechaCreacion', 'desc'));

    return q;
  }

  /**
   * Aplicar filtros adicionales en el cliente
   */
  private applyClientSideFilters(proposals: Proposal[], filters: AdminFilters): Proposal[] {
    let filtered = proposals;

    if (filters.uidTienda) {
      filtered = filtered.filter(p => p.uidTienda === filters.uidTienda);
    }

    if (filters.marca) {
      filtered = filtered.filter(p => 
        p.marca.toLowerCase().includes(filters.marca!.toLowerCase())
      );
    }

    if (filters.fechaDesde) {
      const desde = filters.fechaDesde.toISOString();
      filtered = filtered.filter(p => p.fechaCreacion >= desde);
    }

    if (filters.fechaHasta) {
      const hasta = filters.fechaHasta.toISOString();
      filtered = filtered.filter(p => p.fechaCreacion <= hasta);
    }

    return filtered;
  }

  /**
   * Actualizar filtros
   */
  updateFilters(filters: AdminFilters): void {
    console.log('Actualizando filtros admin:', filters);
    this._filtersSubject.next(filters);
    this.initializeAdminView(filters);
  }

  /**
   * Detener listeners
   */
  stopProposalsListener(): void {
    if (this._proposalsListener) {
      this._proposalsListener();
      this._proposalsListener = null;
    }
  }

  stopOfficialProductsListener(): void {
    if (this._officialProductsListener) {
      this._officialProductsListener();
      this._officialProductsListener = null;
    }
  }

  stopAllListeners(): void {
    this.stopProposalsListener();
    this.stopOfficialProductsListener();
  }

  /**
   * Obtener propuestas por estado (para admin)
   */
  getProposalsByStatus(estado: 'pendiente' | 'aprobado' | 'rechazado'): Proposal[] {
    return this._proposalsSignal().filter(p => p.estado === estado);
  }

  /**
   * Eliminar producto de lista oficial (si es necesario)
   */
  async removeFromOfficialList(productId: string): Promise<void> {
    try {
      await deleteDoc(doc(this._firestore, 'official_products', productId));
      console.log('Producto eliminado de lista oficial');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  }

  /**
   * Utilidades
   */
  private getCurrentISOString(): string {
    return new Date().toISOString();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  }

  formatDate(isoDateString: string): string {
    if (!isoDateString) return 'Fecha no disponible';
    
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Estadísticas administrativas
   */
  get adminStats() {
    return computed(() => {
      const proposals = this._proposalsSignal();
      const officialProducts = this._officialProductsSignal();
      
      return {
        totalPropuestas: proposals.length,
        pendientes: proposals.filter(p => p.estado === 'pendiente').length,
        aprobadas: proposals.filter(p => p.estado === 'aprobado').length,
        rechazadas: proposals.filter(p => p.estado === 'rechazado').length,
        productosOficiales: officialProducts.length,
        tiendas: new Set(proposals.map(p => p.uidTienda)).size,
      };
    });
  }

  // Getters de estado
  get isLoading(): boolean {
    return this._loadingProposalsSignal() || this._loadingOfficialSignal();
  }

  get hasError(): boolean {
    return this._errorProposalsSignal() !== null || this._errorOfficialSignal() !== null;
  }

  get errorMessage(): string | null {
    return this._errorProposalsSignal() || this._errorOfficialSignal();
  }

  get currentFilters(): AdminFilters {
    return this._filtersSubject.value;
  }

  clearErrors(): void {
    this._errorProposalsSignal.set(null);
    this._errorOfficialSignal.set(null);
  }

  ngOnDestroy(): void {
    console.log('Limpiando AdminProposalService');
    this.stopAllListeners();
  }
}

