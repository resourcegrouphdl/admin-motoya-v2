import { inject, Injectable } from '@angular/core';
import { BaseProfile, CreateTiendaRequest, CreateVendedorRequest, TiendaProfile, TiendaStatus, VendedorProfile, VendedorStatus } from '../enums/user-type.types';
import { collection, doc, Firestore, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where, writeBatch } from '@angular/fire/firestore';
import { FIREBASE_COLLECTIONS } from '../../../services/firebase-collection';
import { FirestoreUtils } from './firestore.utils.utils';
import { Auth, createUserWithEmailAndPassword, updateProfile, UserCredential } from '@angular/fire/auth';
import { UserOperationResult } from './firebase-user.service';
import { BehaviorSubject } from 'rxjs';
import { ErrorHandlerService } from './error-handler.service';
import { UserFactoryService } from './user-factory.service';

export interface TiendaWithVendedores extends TiendaProfile {
  vendedores?: VendedorProfile[];
  vendedoresCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExternalUserService {





constructor() { }

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private userFactory = inject(UserFactoryService);
  private errorHandler = inject(ErrorHandlerService);

  // State management para tiendas
  private tiendasSubject = new BehaviorSubject<TiendaProfile[]>([]);
  public tiendas$ = this.tiendasSubject.asObservable();

  // State management para vendedores
  private vendedoresSubject = new BehaviorSubject<VendedorProfile[]>([]);
  public vendedores$ = this.vendedoresSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Cache para evitar cargas innecesarias
  private tiendasLoaded = false;
  private vendedoresLoaded = false;

  /**
   * Inicializar datos - método público para el componente
   */
  async initializeData(): Promise<void> {
    console.log('🚀 Iniciando carga de datos del servicio...');
    this.loadingSubject.next(true);
    
    try {
      // Cargar ambas colecciones en paralelo
      await Promise.all([
        this.loadTiendas(),
        this.loadVendedores()
      ]);
      
      console.log('✅ Datos inicializados correctamente');
    } catch (error) {
      console.error('❌ Error inicializando datos:', error);
      this.errorHandler.handleError(error, 'InitializeData');
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Refrescar todos los datos
   */
  async refreshAllData(): Promise<void> {
    console.log('🔄 Refrescando todos los datos...');
    this.tiendasLoaded = false;
    this.vendedoresLoaded = false;
    await this.initializeData();
  }

  /**
   * Crear nueva tienda afiliada
   */
  async createTienda(tiendaData: CreateTiendaRequest, currentUserUid: string): Promise<UserOperationResult> {
    let createdUserUid: string | null = null;
    
    try {
      console.log('🏪 Creando tienda afiliada:', tiendaData.businessName);

      // 1. Verificar que el email no existe
      const emailExists = await this.checkEmailExists(tiendaData.email);
      if (emailExists) {
        throw new Error('Ya existe un usuario con este email');
      }

      // 2. Verificar que el documento no existe
      const documentExists = await this.checkDocumentExists(tiendaData.documentNumber);
      if (documentExists) {
        throw new Error('Ya existe un usuario con este número de documento');
      }

      // 3. Verificar que el nombre comercial no existe
      const businessExists = await this.checkBusinessNameExists(tiendaData.businessName);
      if (businessExists) {
        throw new Error('Ya existe una tienda con este nombre comercial');
      }

      // 4. Crear usuario en Firebase Auth
      console.log('🔐 Creando usuario en Auth...');
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth, 
        tiendaData.email, 
        tiendaData.password
      );

      createdUserUid = userCredential.user.uid;
      console.log('✅ Usuario creado en Auth con UID:', createdUserUid);

      // 5. Actualizar perfil en Auth
      await updateProfile(userCredential.user, {
        displayName: `${tiendaData.businessName} - ${tiendaData.firstName} ${tiendaData.lastName}`
      });

      // 6. Crear perfil de tienda usando el Factory
      console.log('🏭 Creando perfil de tienda...');
      const tiendaProfile = this.userFactory.createTiendaProfile(createdUserUid, tiendaData, currentUserUid);

      // 7. Guardar en Firestore
      await this.saveTiendaData(createdUserUid, tiendaProfile, currentUserUid);

      console.log('✅ Tienda creada exitosamente:', createdUserUid);
      
      // 8. Recargar solo las tiendas
      await this.loadTiendas();

      return { success: true, uid: createdUserUid };

    } catch (error: any) {
      console.error('❌ Error creating tienda:', error);
      
      // Cleanup si es necesario
      if (createdUserUid) {
        await this.registerCleanupRequired(createdUserUid, tiendaData.email, error.message);
      }
      
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Crear nuevo vendedor
   */
  async createVendedor(vendedorData: CreateVendedorRequest, currentUserUid: string): Promise<UserOperationResult> {
    let createdUserUid: string | null = null;
    
    try {
      console.log('👤 Creando vendedor:', vendedorData.firstName);

      // 1. Verificar que la tienda existe y está activa
      const tiendaExists = await this.verifyTiendaExists(vendedorData.tiendaId);
      if (!tiendaExists) {
        throw new Error('La tienda especificada no existe o no está activa');
      }

      // 2. Verificar email y documento únicos
      const emailExists = await this.checkEmailExists(vendedorData.email);
      if (emailExists) {
        throw new Error('Ya existe un usuario con este email');
      }

      const documentExists = await this.checkDocumentExists(vendedorData.documentNumber);
      if (documentExists) {
        throw new Error('Ya existe un usuario con este número de documento');
      }

      // 3. Crear usuario en Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth, 
        vendedorData.email, 
        vendedorData.password
      );

      createdUserUid = userCredential.user.uid;
      console.log('✅ Usuario vendedor creado en Auth con UID:', createdUserUid);

      // 4. Actualizar perfil en Auth
      await updateProfile(userCredential.user, {
        displayName: `${vendedorData.firstName} ${vendedorData.lastName} - ${vendedorData.position}`
      });

      // 5. Crear perfil de vendedor usando el Factory
      const vendedorProfile = this.userFactory.createVendedorProfile(createdUserUid, vendedorData, currentUserUid);

      // 6. Guardar en Firestore
      await this.saveVendedorData(createdUserUid, vendedorProfile, currentUserUid);

      // 7. Actualizar relación tienda-vendedor
      await this.updateTiendaVendedorRelation(vendedorData.tiendaId, createdUserUid, 'add');

      console.log('✅ Vendedor creado exitosamente:', createdUserUid);
      
      // 8. Recargar solo los vendedores
      await this.loadVendedores();

      return { success: true, uid: createdUserUid };

    } catch (error: any) {
      console.error('❌ Error creating vendedor:', error);
      
      if (createdUserUid) {
        await this.registerCleanupRequired(createdUserUid, vendedorData.email, error.message);
      }
      
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Obtener tiendas con filtro opcional (PRIVADO - uso interno)
   */
   async loadTiendas(status?: TiendaStatus): Promise<TiendaProfile[]> {
    console.log('🏪 Cargando tiendas con status:', status);
    
    try {
      const tiendasCollection = collection(this.firestore, FIREBASE_COLLECTIONS.TIENDA_PROFILES);
      let q;
      
      if (status) {
        console.log('📋 Aplicando filtro por estado:', status);
        q = query(tiendasCollection, where('tiendaStatus', '==', status));
      } else {
        console.log('📋 Cargando todas las tiendas');
        q = query(tiendasCollection);
      }
      
      console.log('⏳ Ejecutando consulta a Firestore...');
      const querySnapshot = await getDocs(q);
      console.log('📊 Documentos obtenidos:', querySnapshot.size);
      
      const tiendas: TiendaProfile[] = [];
      
      querySnapshot.forEach(doc => {
        console.log('📄 Procesando documento:', doc.id);
        const tiendaData = FirestoreUtils.convertTimestampsToDates(doc.data());
        console.log('✅ Datos convertidos para:', tiendaData?.businessName || 'Sin nombre');
        tiendas.push(tiendaData as TiendaProfile);
      });
      
      console.log('📈 Total tiendas procesadas:', tiendas.length);
      
      // Ordenar en el cliente para evitar índices complejos
      tiendas.sort((a, b) => {
        return a.businessName.localeCompare(b.businessName);
      });
      
      console.log('🔤 Tiendas ordenadas alfabéticamente');
      console.log('🔄 Actualizando tiendasSubject...');
      this.tiendasSubject.next(tiendas);
      this.tiendasLoaded = true;
      console.log('✅ loadTiendas completado exitosamente');
      
      return tiendas;
      
    } catch (error) {
      console.error('❌ Error loading tiendas:', error);
      this.errorHandler.handleError(error, 'LoadTiendas');
      return [];
    }
  }

  /**
   * Cargar vendedores (PRIVADO - uso interno)
   */
  private async loadVendedores(): Promise<VendedorProfile[]> {
    console.log('👥 Cargando vendedores...');
    
    try {
      const vendedoresCollection = collection(this.firestore, FIREBASE_COLLECTIONS.VENDEDOR_PROFILES);
      const q = query(vendedoresCollection, orderBy('firstName'));
      
      console.log('⏳ Ejecutando consulta vendedores a Firestore...');
      const querySnapshot = await getDocs(q);
      console.log('📊 Documentos vendedores obtenidos:', querySnapshot.size);
      
      const vendedores: VendedorProfile[] = [];
      
      querySnapshot.forEach(doc => {
        console.log('📄 Procesando vendedor:', doc.id);
        const vendedorData = FirestoreUtils.convertTimestampsToDates(doc.data());
        console.log('✅ Datos convertidos para:', vendedorData?.firstName || 'Sin nombre');
        vendedores.push(vendedorData as VendedorProfile);
      });
      
      console.log('📈 Total vendedores procesados:', vendedores.length);
      
      console.log('🔄 Actualizando vendedoresSubject...');
      this.vendedoresSubject.next(vendedores);
      this.vendedoresLoaded = true;
      console.log('✅ loadVendedores completado exitosamente');
      
      return vendedores;
      
    } catch (error) {
      console.error('❌ Error loading vendedores:', error);
      this.errorHandler.handleError(error, 'LoadVendedores');
      return [];
    }
  }

  /**
   * Obtener vendedores por tienda
   */
  async getVendedoresByTienda(tiendaId: string): Promise<VendedorProfile[]> {
    try {
      const vendedoresCollection = collection(this.firestore, FIREBASE_COLLECTIONS.VENDEDOR_PROFILES);
      // Consulta simple solo con filtro por tiendaId
      const q = query(
        vendedoresCollection,
        where('tiendaId', '==', tiendaId)
      );

      const querySnapshot = await getDocs(q);
      const vendedores: VendedorProfile[] = [];

      querySnapshot.forEach(doc => {
        const vendedorData = FirestoreUtils.convertTimestampsToDates(doc.data());
        vendedores.push(vendedorData as VendedorProfile);
      });

      // Ordenar en el cliente
      vendedores.sort((a, b) => {
        return a.firstName.localeCompare(b.firstName);
      });

      return vendedores;

    } catch (error) {
      console.error('Error loading vendedores by tienda:', error);
      return [];
    }
  }

  /**
   * Obtener tienda con sus vendedores
   */
  async getTiendaWithVendedores(tiendaId: string): Promise<TiendaWithVendedores | null> {
    try {
      // Obtener tienda
      const tiendaDoc = await getDoc(doc(this.firestore, FIREBASE_COLLECTIONS.TIENDA_PROFILES, tiendaId));
      
      if (!tiendaDoc.exists()) {
        return null;
      }

      const tiendaData = FirestoreUtils.convertTimestampsToDates(tiendaDoc.data()) as TiendaProfile;
      
      // Obtener vendedores
      const vendedores = await this.getVendedoresByTienda(tiendaId);

      return {
        ...tiendaData,
        vendedores,
        vendedoresCount: vendedores.length
      };

    } catch (error) {
      console.error('Error getting tienda with vendedores:', error);
      return null;
    }
  }

  /**
   * Cambiar estado de tienda
   */
  async updateTiendaStatus(tiendaId: string, newStatus: TiendaStatus, currentUserUid: string): Promise<UserOperationResult> {
    try {
      const tiendaRef = doc(this.firestore, FIREBASE_COLLECTIONS.TIENDA_PROFILES, tiendaId);
      const updates = FirestoreUtils.prepareForFirestore({
        tiendaStatus: newStatus,
        updatedAt: serverTimestamp()
      });

      await setDoc(tiendaRef, updates, { merge: true });

      // Auditoría
      await this.createAuditEntry(tiendaId, 'TIENDA_STATUS_CHANGED', currentUserUid, { 
        newStatus, 
        changedAt: new Date() 
      });

      // Si se desactiva la tienda, desactivar sus vendedores
      if (newStatus === TiendaStatus.SUSPENDIDA) {
        await this.suspendVendedoresByTienda(tiendaId, currentUserUid);
      }

      // Recargar ambas listas ya que los vendedores pueden haber cambiado también
      await Promise.all([
        this.loadTiendas(),
        this.loadVendedores()
      ]);
      
      return { success: true, uid: tiendaId };

    } catch (error: any) {
      console.error('Error updating tienda status:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Cambiar estado de vendedor
   */
  async updateVendedorStatus(vendedorId: string, newStatus: VendedorStatus, currentUserUid: string): Promise<UserOperationResult> {
    try {
      const vendedorRef = doc(this.firestore, FIREBASE_COLLECTIONS.VENDEDOR_PROFILES, vendedorId);
      const updates = FirestoreUtils.prepareForFirestore({
        vendedorStatus: newStatus,
        updatedAt: serverTimestamp()
      });

      await setDoc(vendedorRef, updates, { merge: true });

      // Auditoría
      await this.createAuditEntry(vendedorId, 'VENDEDOR_STATUS_CHANGED', currentUserUid, { 
        newStatus, 
        changedAt: new Date() 
      });

      // Recargar solo vendedores
      await this.loadVendedores();
      return { success: true, uid: vendedorId };

    } catch (error: any) {
      console.error('Error updating vendedor status:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Obtener tiendas para selector
   */
  async getTiendasForSelector(): Promise<Array<{value: string, label: string, status: TiendaStatus}>> {
    try {
      // Si las tiendas no están cargadas, cargar solo las activas
      if (!this.tiendasLoaded) {
        await this.loadTiendas(TiendaStatus.ACTIVA);
      }
      
      // Usar las tiendas del state, filtrar solo activas
      const tiendasActivas = this.currentTiendas.filter(tienda => tienda.tiendaStatus === TiendaStatus.ACTIVA);
      
      return tiendasActivas.map(tienda => ({
        value: tienda.uid,
        label: `${tienda.businessName} - ${tienda.city}`,
        status: tienda.tiendaStatus
      }));
    } catch (error) {
      console.error('Error getting tiendas for selector:', error);
      return [];
    }
  }

  // Métodos privados auxiliares (sin cambios significativos)

  private async saveTiendaData(uid: string, tiendaProfile: TiendaProfile, currentUserUid: string): Promise<void> {
    console.log('💾 Guardando datos de tienda en Firestore...');
    
    // Guardar en colección principal de usuarios
    const userDoc = doc(this.firestore, FIREBASE_COLLECTIONS.USERS, uid);
    const baseUserData = this.extractBaseProfileData(tiendaProfile);
    const userDataClean = FirestoreUtils.prepareForFirestore(baseUserData);
    
    await setDoc(userDoc, userDataClean);

    // Guardar perfil específico de tienda
    const tiendaDoc = doc(this.firestore, FIREBASE_COLLECTIONS.TIENDA_PROFILES, uid);
    const tiendaDataClean = FirestoreUtils.prepareForFirestore(tiendaProfile);
    
    await setDoc(tiendaDoc, tiendaDataClean);

    // Auditoría
    await this.createAuditEntry(uid, 'TIENDA_CREATED', currentUserUid, {
      businessName: tiendaProfile.businessName,
      city: tiendaProfile.city
    });

    console.log('✅ Datos de tienda guardados');
  }

  private async saveVendedorData(uid: string, vendedorProfile: VendedorProfile, currentUserUid: string): Promise<void> {
    console.log('💾 Guardando datos de vendedor en Firestore...');
    
    // Guardar en colección principal de usuarios
    const userDoc = doc(this.firestore, FIREBASE_COLLECTIONS.USERS, uid);
    const baseUserData = this.extractBaseProfileData(vendedorProfile);
    const userDataClean = FirestoreUtils.prepareForFirestore(baseUserData);
    
    await setDoc(userDoc, userDataClean);

    // Guardar perfil específico de vendedor
    const vendedorDoc = doc(this.firestore, FIREBASE_COLLECTIONS.VENDEDOR_PROFILES, uid);
    const vendedorDataClean = FirestoreUtils.prepareForFirestore(vendedorProfile);
    
    await setDoc(vendedorDoc, vendedorDataClean);

    // Auditoría
    await this.createAuditEntry(uid, 'VENDEDOR_CREATED', currentUserUid, {
      tiendaId: vendedorProfile.tiendaId,
      position: vendedorProfile.position
    });

    console.log('✅ Datos de vendedor guardados');
  }

  private async updateTiendaVendedorRelation(tiendaId: string, vendedorId: string, action: 'add' | 'remove'): Promise<void> {
    const relationDoc = doc(this.firestore, FIREBASE_COLLECTIONS.TIENDA_VENDEDORES, `${tiendaId}_${vendedorId}`);
    
    if (action === 'add') {
      await setDoc(relationDoc, {
        tiendaId,
        vendedorId,
        createdAt: serverTimestamp(),
        isActive: true
      });
    } else {
      await setDoc(relationDoc, {
        isActive: false,
        removedAt: serverTimestamp()
      }, { merge: true });
    }
  }

  private async suspendVendedoresByTienda(tiendaId: string, currentUserUid: string): Promise<void> {
    const vendedores = await this.getVendedoresByTienda(tiendaId);
    const batch = writeBatch(this.firestore);

    vendedores.forEach(vendedor => {
      const vendedorRef = doc(this.firestore, FIREBASE_COLLECTIONS.VENDEDOR_PROFILES, vendedor.uid);
      batch.update(vendedorRef, {
        vendedorStatus: VendedorStatus.SUSPENDIDO,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
  }

  private async checkEmailExists(email: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, FIREBASE_COLLECTIONS.USERS),
        where('email', '==', email.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }

  private async checkDocumentExists(documentNumber: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, FIREBASE_COLLECTIONS.USERS),
        where('documentNumber', '==', documentNumber)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking document:', error);
      return false;
    }
  }

  private async checkBusinessNameExists(businessName: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, FIREBASE_COLLECTIONS.TIENDA_PROFILES),
        where('businessName', '==', businessName)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking business name:', error);
      return false;
    }
  }

  private async verifyTiendaExists(tiendaId: string): Promise<boolean> {
    try {
      const tiendaDoc = await getDoc(doc(this.firestore, FIREBASE_COLLECTIONS.TIENDA_PROFILES, tiendaId));
      if (!tiendaDoc.exists()) return false;
      
      const tiendaData = tiendaDoc.data() as TiendaProfile;
      return tiendaData.tiendaStatus === TiendaStatus.ACTIVA;
    } catch (error) {
      console.error('Error verifying tienda exists:', error);
      return false;
    }
  }

  private extractBaseProfileData(profile: TiendaProfile | VendedorProfile): BaseProfile {
    const { 
      uid, firstName, lastName, email, phone, documentType, documentNumber,
      userType, userCategory, isActive, createdAt, updatedAt, createdBy, password,
      storeIds, isFirstLogin, lastPasswordChange
    } = profile;

    return {
      uid, firstName, lastName, email, phone, documentType, documentNumber,
      userType, userCategory, isActive, createdAt, updatedAt, createdBy, password,
      storeIds, isFirstLogin, lastPasswordChange
    };
  }

  private async createAuditEntry(userId: string, action: string, performedBy: string, details: any): Promise<void> {
    const auditDoc = doc(collection(this.firestore, FIREBASE_COLLECTIONS.USER_AUDIT));
    const auditData = FirestoreUtils.prepareForFirestore({
      userId,
      action,
      performedBy,
      timestamp: serverTimestamp(),
      details
    });
    
    await setDoc(auditDoc, auditData);
  }

  private async registerCleanupRequired(uid: string, email: string, error: string): Promise<void> {
    try {
      const cleanupDoc = doc(collection(this.firestore, FIREBASE_COLLECTIONS.CLEANUP_REQUIRED));
      await setDoc(cleanupDoc, {
        uid,
        email,
        error,
        timestamp: serverTimestamp(),
        status: 'pending_cleanup',
        type: 'external_user'
      });
    } catch (cleanupError) {
      console.error('Error registrando cleanup:', cleanupError);
    }
  }

  private getErrorMessage(error: any): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'Email no válido',
      'permission-denied': 'No tiene permisos para realizar esta acción',
      'unavailable': 'Servicio no disponible. Intente más tarde'
    };

    return errorMessages[error.code] || error.message || 'Error desconocido';
  }

  // Getters para el estado actual
  get currentTiendas(): TiendaProfile[] {
    return this.tiendasSubject.value;
  }

  get currentVendedores(): VendedorProfile[] {
    return this.vendedoresSubject.value;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  get isDataLoaded(): boolean {
    return this.tiendasLoaded && this.vendedoresLoaded;
  }
}