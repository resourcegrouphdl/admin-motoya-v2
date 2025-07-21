import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, sendPasswordResetEmail, UserCredential } from '@angular/fire/auth';
import { getDoc, getDocs, query, setDoc, where } from '@angular/fire/firestore';
import { Firestore, writeBatch, doc, collection } from '@angular/fire/firestore';

import { UserType } from '../modelos/enums';
import { BaseUser } from '../modelos/clases-herencia';
import { BaseProfile } from '../modelos/interface-base';
import { UserFactory } from '../factori/factoriry-pattern';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  

  private readonly MAIN_COLLECTION = 'users';

  constructor(
    private auth: Auth,
    private firestore: Firestore,
   // private functions: Functions
  ) {}

  async createUser(
    userType: UserType,
    profile: Omit<BaseProfile, 'uid' | 'createdAt' | 'updatedAt' | 'isActive' | 'userType'>,
    additionalData: any,
    temporaryPassword?: string
  ): Promise<BaseUser> {
    try {
      // 1. Crear usuario con Factory Pattern
      const user = UserFactory.createUser(userType, profile, additionalData);

      // 2. Crear usuario en Firebase Auth
      const userCredential = await this.createAuthUser(user.email, temporaryPassword);
      user.uid = userCredential.user.uid;

      // 3. Guardar en Firestore usando batch
      await this.saveUserToFirestore(user);

      // 4. Enviar email con credenciales
      //await this.sendCredentialsEmail(user.email, temporaryPassword || 'TempPass123');

      return user;

    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  private async createAuthUser(email: string, password?: string): Promise<UserCredential> {
    const tempPassword = password || this.generateTemporaryPassword();
    return await createUserWithEmailAndPassword(this.auth, email, tempPassword);
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async saveUserToFirestore(user: BaseUser): Promise<void> {
    const batch = writeBatch(this.firestore);

    // Documento principal en 'users'
    const mainUserDoc = doc(this.firestore, this.MAIN_COLLECTION, user.uid);
    batch.set(mainUserDoc, user.toFirestore());

    // Documento específico en subcolección
    const specificCollection = collection(this.firestore, user.getCollectionName());
    const specificDoc = doc(specificCollection, user.uid);
    batch.set(specificDoc, {
      ...user.getSpecificData(),
      uid: user.uid,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

    await batch.commit();
  }

  /**private async sendCredentialsEmail(email: string, password: string): Promise<void> {
    const sendEmail = httpsCallable(this.functions, 'sendUserCredentials');
    await sendEmail({ 
      email, 
      password,
      subject: 'Credenciales de acceso - Sistema de Gestión'
    });
  }
  */
  // Métodos de consulta
  async getUserByUid(uid: string): Promise<BaseUser | null> {
    const docSnap = await getDoc(doc(this.firestore, this.MAIN_COLLECTION, uid));
    if (!docSnap.exists()) return null;

    const userData = docSnap.data() as BaseProfile;
    
    // Obtener datos específicos
    const specificCollection = this.getCollectionNameByType(userData.userType);
    const specificDoc = await getDoc(doc(this.firestore, specificCollection, uid));
    const specificData = specificDoc.exists() ? specificDoc.data() : {};

    return UserFactory.createUser(userData.userType, userData, specificData);
  }

  async getUsersByStore(storeId: string): Promise<BaseUser[]> {
    const q = query(
      collection(this.firestore, this.MAIN_COLLECTION),
      where('storeIds', 'array-contains', storeId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const users: BaseUser[] = [];

    for (const docSnap of querySnapshot.docs) {
      const userData = docSnap.data() as BaseProfile;
      const specificCollection = this.getCollectionNameByType(userData.userType);
      const specificDoc = await getDoc(doc(this.firestore, specificCollection, docSnap.id));
      const specificData = specificDoc.exists() ? specificDoc.data() : {};

      users.push(UserFactory.createUser(userData.userType, userData, specificData));
    }

    return users;
  }

  async getUsersByType(userType: UserType): Promise<BaseUser[]> {
    const q = query(
      collection(this.firestore, this.MAIN_COLLECTION),
      where('userType', '==', userType),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const users: BaseUser[] = [];

    for (const docSnap of querySnapshot.docs) {
      const userData = docSnap.data() as BaseProfile;
      const specificCollection = this.getCollectionNameByType(userData.userType);
      const specificDoc = await getDoc(doc(this.firestore, specificCollection, docSnap.id));
      const specificData = specificDoc.exists() ? specificDoc.data() : {};

      users.push(UserFactory.createUser(userData.userType, userData, specificData));
    }

    return users;
  }

  private getCollectionNameByType(userType: UserType): string {
    const collections = {
      [UserType.ADMIN]: 'admin_profiles',
      [UserType.STORE]: 'store_profiles',
      [UserType.VENDOR]: 'vendor_profiles',
      [UserType.ACCOUNTANT]: 'accountant_profiles',
      [UserType.FINANCIAL]: 'financial_profiles'
    };
    return collections[userType];
  }

  async resetUserPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async deactivateUser(uid: string): Promise<void> {
    const userDoc = doc(this.firestore, this.MAIN_COLLECTION, uid);
    await setDoc(userDoc, { isActive: false, updatedAt: new Date() }, { merge: true });
  }
}
