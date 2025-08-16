// utils/date.utils.ts
import { Timestamp } from '@angular/fire/firestore';
import { BaseProfile, UserProfile, UserProfileFirestore } from './user-type.types';
import { FirestoreUtils } from '../services/firestore.utils.utils';


export class DateUtils {
  
  /**
   * Convierte un objeto con fechas Date a Timestamps para Firestore
   */
  static convertToFirestoreFormat(profile: UserProfile): UserProfileFirestore {
    // Primero limpiar undefined values
    const cleanProfile = FirestoreUtils.cleanForFirestore(profile);
    
    // Luego convertir fechas
    const converted: any = { ...cleanProfile };
    
    // Convertir fechas específicas
    if (converted.createdAt instanceof Date) {
      converted.createdAt = Timestamp.fromDate(converted.createdAt);
    }
    
    if (converted.updatedAt instanceof Date) {
      converted.updatedAt = Timestamp.fromDate(converted.updatedAt);
    }
    
    if (converted.lastPasswordChange instanceof Date) {
      converted.lastPasswordChange = Timestamp.fromDate(converted.lastPasswordChange);
    }

    // Asegurar que storeIds sea un array vacío si es undefined
    if (!converted.storeIds) {
      converted.storeIds = [];
    }

    return converted as UserProfileFirestore;
  }

  /**
   * Convierte un objeto con Timestamps de Firestore a fechas Date
   */
  static convertFromFirestoreFormat(firestoreData: any): BaseProfile {
    const converted: any = { ...firestoreData };
    
    // Convertir Timestamps a Date
    if (converted.createdAt && typeof converted.createdAt.toDate === 'function') {
      converted.createdAt = converted.createdAt.toDate();
    }
    
    if (converted.updatedAt && typeof converted.updatedAt.toDate === 'function') {
      converted.updatedAt = converted.updatedAt.toDate();
    }
    
    if (converted.lastPasswordChange && typeof converted.lastPasswordChange.toDate === 'function') {
      converted.lastPasswordChange = converted.lastPasswordChange.toDate();
    }

    // Asegurar que storeIds sea un array
    if (!converted.storeIds) {
      converted.storeIds = [];
    }

    return converted as BaseProfile;
  }

  /**
   * Verifica si un valor es un Timestamp de Firestore
   */
  static isFirestoreTimestamp(value: any): value is Timestamp {
    return FirestoreUtils.isFirestoreTimestamp(value);
  }

  /**
   * Convierte un valor que puede ser Date o Timestamp a Date
   */
  static toDate(value: Date | Timestamp | any): Date {
    if (value instanceof Date) {
      return value;
    }
    
    if (this.isFirestoreTimestamp(value)) {
      return value.toDate();
    }
    
    // Fallback: crear nueva fecha
    return new Date();
  }

  /**
   * Convierte un valor que puede ser Date o Timestamp a Timestamp
   */
  static toTimestamp(value: Date | Timestamp | any): Timestamp {
    if (this.isFirestoreTimestamp(value)) {
      return value;
    }
    
    if (value instanceof Date) {
      return Timestamp.fromDate(value);
    }
    
    // Fallback: crear timestamp actual
    return Timestamp.now();
  }

  /**
   * Formatea una fecha para mostrar en UI
   */
  static formatForDisplay(value: Date | Timestamp | any): string {
    const date = this.toDate(value);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene la fecha actual como Timestamp para usar con serverTimestamp()
   */
  static getCurrentTimestamp(): Timestamp {
    return Timestamp.now();
  }

  /**
   * Obtiene la fecha actual como Date
   */
  static getCurrentDate(): Date {
    return new Date();
  }
}