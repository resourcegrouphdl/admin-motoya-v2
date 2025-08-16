// services/firebase-user.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  UserCredential,
  updateProfile,
  sendPasswordResetEmail
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { UserFactoryService, CreateUserRequest } from './user-factory.service';


import { BaseProfile, UserProfile, UserProfileFirestore, UserType } from '../enums/user-type.types';
import { FirestoreUserProfile } from '../models/firestore-user';
import { FIREBASE_COLLECTIONS } from '../../../services/firebase-collection';
import { DateUtils } from '../enums/date-utils';
import { FirestoreUtils } from './firestore.utils.utils';

export interface UserOperationResult {
  success: boolean;
  uid?: string;
  error?: string;
}

export interface UserQuery {
  userType?: UserType;
  isActive?: boolean;
  storeIds?: string[];
  documentNumber?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseUserService {

    private auth = inject(Auth);
  private firestore = inject(Firestore);
  private userFactory = inject(UserFactoryService);

  async createUser(userData: CreateUserRequest, currentUserUid: string): Promise<UserOperationResult> {
    let createdUserUid: string | null = null;
    
    try {
      // 1. Verificar que el email no existe
      console.log('🔍 Verificando email:', userData.email);
      const emailExists = await this.checkEmailExists(userData.email);
      if (emailExists) {
        throw new Error('Ya existe un usuario con este email');
      }

      // 2. Verificar que el documento no existe
      console.log('🔍 Verificando documento:', userData.documentNumber);
      const documentExists = await this.checkDocumentExists(userData.documentNumber);
      if (documentExists) {
        throw new Error('Ya existe un usuario con este número de documento');
      }

      // 3. Crear usuario en Firebase Auth
      console.log('🔐 Creando usuario en Auth...');
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth, 
        userData.email, 
        userData.password
      );

      createdUserUid = userCredential.user.uid;
      console.log('✅ Usuario creado en Auth con UID:', createdUserUid);

      if (!createdUserUid) {
        throw new Error('No se pudo obtener el UID del usuario creado');
      }

      // 4. Actualizar perfil en Auth
      console.log('👤 Actualizando perfil en Auth...');
      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      // 5. Crear perfil usando el Factory
      console.log('🏭 Creando perfil con Factory...');
      const userProfile = this.userFactory.createUserProfile(createdUserUid, userData, currentUserUid);
      console.log('📝 Perfil creado:', userProfile);

    // 6. Usar transacción en lugar de batch para mejor manejo de errores
    await this.saveUserDataWithTransaction(createdUserUid, userProfile, userData, currentUserUid);

    console.log('✅ Usuario creado exitosamente:', createdUserUid);
    return { success: true, uid: createdUserUid };

  } catch (error: any) {
    console.error('❌ Error creating user:', error);
    
    // Si hay error después de crear el usuario en Auth, registrarlo para cleanup manual
    if (createdUserUid && error.code !== 'auth/email-already-in-use') {
      console.warn(`⚠️ Usuario creado en Auth (UID: ${createdUserUid}) pero falló en Firestore.`);
      console.warn('Se requiere cleanup manual en Firebase Console');
      
      // Intentar crear un registro de error para cleanup posterior
      try {
        const errorDoc = doc(collection(this.firestore, 'cleanup_required'));
        await setDoc(errorDoc, {
          uid: createdUserUid,
          email: userData.email,
          error: error.message,
          timestamp: serverTimestamp(),
          status: 'pending_cleanup'
        });
      } catch (cleanupError) {
        console.error('Error registrando cleanup:', cleanupError);
      }
    }
    
    return { 
      success: false, 
      error: this.getErrorMessage(error) 
    };
  }
}

  private async saveUserDataWithTransaction(
    uid: string, 
    userProfile: UserProfile, 
    userData: CreateUserRequest, 
    currentUserUid: string
  ): Promise<void> {
    console.log('💾 Guardando datos en Firestore...');
    
    // Guardar documento principal
    console.log('📄 Guardando documento principal en users...');
    const userDoc = doc(this.firestore, FIREBASE_COLLECTIONS.USERS, uid);
    const userDataForFirestore = this.convertDatesToTimestamp(userProfile);
    
    await setDoc(userDoc, userDataForFirestore);
    console.log('✅ Documento principal guardado');

    // Guardar datos específicos en subcolección
    const specificData = this.extractSpecificData(userProfile);
    if (Object.keys(specificData).length > 0) {
      console.log('📋 Guardando datos específicos...');
      const collectionName = this.getCollectionNameByUserType(userData.userType);
      const specificDoc = doc(this.firestore, collectionName, uid);
      
      await setDoc(specificDoc, {
        ...specificData,
        uid,
        userType: userData.userType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUserUid
      });
      console.log('✅ Datos específicos guardados en:', collectionName);
    }

    // Crear registro de auditoría
    console.log('📊 Creando registro de auditoría...');
    const auditDoc = doc(collection(this.firestore, FIREBASE_COLLECTIONS.USER_AUDIT));
    await setDoc(auditDoc, {
      userId: uid,
      action: 'USER_CREATED',
      performedBy: currentUserUid,
      timestamp: serverTimestamp(),
      details: {
        userType: userData.userType,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      }
    });
    console.log('✅ Auditoría guardada');
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(this.firestore, FIREBASE_COLLECTIONS.USERS, uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      const userData = DateUtils.convertFromFirestoreFormat(userDoc.data());
      
      // Obtener datos específicos según el tipo de usuario
      const specificData = await this.getUserSpecificData(uid, userData.userType);
      
      return { ...userData, ...specificData } as UserProfile;

    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUser(uid: string, updates: Partial<BaseProfile>, currentUserUid: string): Promise<UserOperationResult> {
    try {
      const userDoc = doc(this.firestore, FIREBASE_COLLECTIONS.USERS, uid);
      
      // Limpiar y preparar datos para actualización
      const cleanUpdates = FirestoreUtils.prepareForFirestore({
        ...updates,
        updatedAt: serverTimestamp()
      });

      await setDoc(userDoc, cleanUpdates, { merge: true });

      // Registro de auditoría
      const auditDoc = doc(collection(this.firestore, FIREBASE_COLLECTIONS.USER_AUDIT));
      const auditData = FirestoreUtils.prepareForFirestore({
        userId: uid,
        action: 'USER_UPDATED',
        performedBy: currentUserUid,
        timestamp: serverTimestamp(),
        details: updates
      });

      await setDoc(auditDoc, auditData);

      return { success: true, uid };

    } catch (error: any) {
      console.error('Error updating user:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  async deactivateUser(uid: string, currentUserUid: string): Promise<UserOperationResult> {
    return this.updateUser(uid, { isActive: false }, currentUserUid);
  }

  async activateUser(uid: string, currentUserUid: string): Promise<UserOperationResult> {
    return this.updateUser(uid, { isActive: true }, currentUserUid);
  }

  async searchUsers(queryParams: UserQuery): Promise<BaseProfile[]> {
    try {
      let q = collection(this.firestore, FIREBASE_COLLECTIONS.USERS);
      let queryConstraints: any[] = [];

      if (queryParams.userType) {
        queryConstraints.push(where('userType', '==', queryParams.userType));
      }

      if (queryParams.isActive !== undefined) {
        queryConstraints.push(where('isActive', '==', queryParams.isActive));
      }

      if (queryParams.documentNumber) {
        queryConstraints.push(where('documentNumber', '==', queryParams.documentNumber));
      }

      if (queryParams.email) {
        queryConstraints.push(where('email', '==', queryParams.email));
      }

      const finalQuery = query(q, ...queryConstraints);
      const querySnapshot = await getDocs(finalQuery);

      return querySnapshot.docs.map(doc => doc.data() as BaseProfile);

    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  async sendPasswordReset(email: string): Promise<UserOperationResult> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  private async checkEmailExists(email: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, FIREBASE_COLLECTIONS.USERS),
        where('email', '==', email)
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

  private async getUserSpecificData(uid: string, userType: UserType): Promise<any> {
    try {
      const collectionName = this.getCollectionNameByUserType(userType);
      const specificDoc = await getDoc(doc(this.firestore, collectionName, uid));
      
      return specificDoc.exists() ? specificDoc.data() : {};
    } catch (error) {
      console.error('Error getting specific data:', error);
      return {};
    }
  }

  private getCollectionNameByUserType(userType: UserType): string {
    const collections = {
      [UserType.COMERCIAL]: FIREBASE_COLLECTIONS.COMERCIAL_PROFILES,
      [UserType.LOGISTICA]: FIREBASE_COLLECTIONS.LOGISTICA_PROFILES,
      [UserType.FINANZAS]: FIREBASE_COLLECTIONS.FINANZAS_PROFILES,
      [UserType.GERENCIA]: FIREBASE_COLLECTIONS.GERENCIA_PROFILES,
      [UserType.CONTABILIDAD]: FIREBASE_COLLECTIONS.CONTABILIDAD_PROFILES,
      [UserType.ADMINISTRACION]: FIREBASE_COLLECTIONS.ADMINISTRACION_PROFILES,
      [UserType.RECURSOS_HUMANOS]: FIREBASE_COLLECTIONS.RECURSOS_HUMANOS_PROFILES
    };
    return collections[userType];
  }

  private extractSpecificData(profile: UserProfile): any {
    const baseKeys = [
      'uid', 'firstName', 'lastName', 'email', 'phone', 
      'documentType', 'documentNumber', 'userType', 'isActive',
      'createdAt', 'updatedAt', 'createdBy', 'storeIds', 
      'isFirstLogin', 'lastPasswordChange'
    ];

    const specificData: any = {};
    Object.keys(profile).forEach(key => {
      if (!baseKeys.includes(key)) {
        specificData[key] = (profile as any)[key];
      }
    });

    return specificData;
  }

  private convertDatesToTimestamp(profile: UserProfile): UserProfileFirestore {
    // Crear una copia del perfil sin las propiedades de fecha
    const { createdAt, updatedAt, lastPasswordChange, ...baseProfile } = profile;
    
    // Crear el objeto para Firestore con Timestamps
    const firestoreProfile: UserProfileFirestore = {
      ...baseProfile,
      createdAt: createdAt instanceof Date ? Timestamp.fromDate(createdAt) : createdAt as Timestamp,
      updatedAt: updatedAt instanceof Date ? Timestamp.fromDate(updatedAt) : updatedAt as Timestamp
    };

    // Agregar lastPasswordChange si existe
    if (lastPasswordChange) {
      firestoreProfile.lastPasswordChange = lastPasswordChange instanceof Date ? 
        Timestamp.fromDate(lastPasswordChange) : lastPasswordChange as Timestamp;
    }

    return firestoreProfile;
  }

  private getErrorMessage(error: any): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'Email no válido',
      'auth/network-request-failed': 'Error de conexión. Verifique su internet',
      'permission-denied': 'No tiene permisos para realizar esta acción',
      'unavailable': 'Servicio no disponible. Intente más tarde'
    };

    return errorMessages[error.code] || error.message || 'Error desconocido';
  }
}