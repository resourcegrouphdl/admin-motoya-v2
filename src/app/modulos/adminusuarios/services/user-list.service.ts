import { inject, Injectable } from '@angular/core';
import { BaseProfile, UserType } from '../enums/user-type.types';
import { collection, DocumentSnapshot, Firestore, getDocs, limit, orderBy, query, where } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { FIREBASE_COLLECTIONS } from '../../../services/firebase-collection';
import { DateUtils } from '../enums/date-utils';
export interface UserListOptions {
  
  pageSize?: number;
  orderByField?: keyof BaseProfile;
  orderDirection?: 'asc' | 'desc';
  filterByType?: UserType;
  filterByActive?: boolean;
  searchEmail?: string;
}

export interface UserListResult {
  users: BaseProfile[];
  hasMore: boolean;
  lastDocument?: DocumentSnapshot;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserListService {

  private firestore = inject(Firestore);
  private usersSubject = new BehaviorSubject<BaseProfile[]>([]);
  public users$ = this.usersSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private currentOptions: UserListOptions = {
    pageSize: 20,
    orderByField: 'createdAt',
    orderDirection: 'desc'
  };

  async loadUsers(options: UserListOptions = {}): Promise<UserListResult> {
    this.loadingSubject.next(true);
    
    try {
      this.currentOptions = { ...this.currentOptions, ...options };
      
      const usersCollection = collection(this.firestore, FIREBASE_COLLECTIONS.USERS);
      let q = query(usersCollection);

      // Aplicar filtros
      if (this.currentOptions.filterByType) {
        q = query(q, where('userType', '==', this.currentOptions.filterByType));
      }

      if (this.currentOptions.filterByActive !== undefined) {
        q = query(q, where('isActive', '==', this.currentOptions.filterByActive));
      }

      if (this.currentOptions.searchEmail) {
        q = query(q, where('email', '>=', this.currentOptions.searchEmail));
        q = query(q, where('email', '<=', this.currentOptions.searchEmail + '\uf8ff'));
      }

      // Ordenamiento
      if (this.currentOptions.orderByField) {
        q = query(q, orderBy(this.currentOptions.orderByField, this.currentOptions.orderDirection));
      }

      // Paginación
      if (this.currentOptions.pageSize) {
        q = query(q, limit(this.currentOptions.pageSize + 1)); // +1 para saber si hay más
      }

      const querySnapshot = await getDocs(q);
      const users: BaseProfile[] = [];
      
      querySnapshot.forEach(doc => {
        const userData = doc.data() as BaseProfile;
        users.push(this.convertTimestampsToDate(userData));
      });
const hasMore = querySnapshot.size > (this.currentOptions.pageSize || 0);
      const lastDocument = hasMore ? querySnapshot.docs[querySnapshot.docs.length - 2] : undefined;
      return { users, hasMore, lastDocument };

    } catch (error) {
      console.error('Error searching users by email:', error);
      throw error;
    }
  }

  async getUsersByType(userType: UserType): Promise<BaseProfile[]> {
    try {
      const usersCollection = collection(this.firestore, FIREBASE_COLLECTIONS.USERS);
      const q = query(
        usersCollection,
        where('userType', '==', userType),
        where('isActive', '==', true),
        orderBy('firstName')
      );

      const querySnapshot = await getDocs(q);
      const users: BaseProfile[] = [];
      
      querySnapshot.forEach(doc => {
        const userData = doc.data() as BaseProfile;
        users.push(this.convertTimestampsToDate(userData));
      });

      return users;

    } catch (error) {
      console.error('Error getting users by type:', error);
      throw error;
    }
  }

  refreshUsers(): void {
    this.loadUsers(this.currentOptions);
  }

    clearUsers(): void {
    this.usersSubject.next([]);
  }

  private convertTimestampsToDate(userData: any): BaseProfile {
    return DateUtils.convertFromFirestoreFormat(userData);
  }

  

}
