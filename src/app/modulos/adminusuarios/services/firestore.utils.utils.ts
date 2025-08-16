import { Timestamp } from '@angular/fire/firestore';

export class FirestoreUtils {
  
  /**
   * Limpia un objeto removiendo campos undefined y null para Firestore
   */
  static cleanForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj
        .map(item => this.cleanForFirestore(item))
        .filter(item => item !== null && item !== undefined);
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.cleanForFirestore(value);
        
        // Solo incluir si no es undefined
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      
      return cleaned;
    }

    return obj;
  }

  /**
   * Convierte Date a Timestamp y limpia undefined
   */
  static prepareForFirestore(obj: any): any {
    const cleaned = this.cleanForFirestore(obj);
    return this.convertDatesToTimestamps(cleaned);
  }

  /**
   * Convierte Date objects a Firestore Timestamps
   */
  static convertDatesToTimestamps(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Date) {
      return Timestamp.fromDate(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertDatesToTimestamps(item));
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
      const converted: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this.convertDatesToTimestamps(value);
      }
      
      return converted;
    }

    return obj;
  }

  /**
   * Convierte Firestore Timestamps a Date objects
   */
  static convertTimestampsToDates(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (this.isFirestoreTimestamp(obj)) {
      return obj.toDate();
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertTimestampsToDates(item));
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
      const converted: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this.convertTimestampsToDates(value);
      }
      
      return converted;
    }

    return obj;
  }

  /**
   * Verifica si un valor es un Timestamp de Firestore
   */
  static isFirestoreTimestamp(value: any): boolean {
    return value && 
           typeof value.toDate === 'function' && 
           typeof value.seconds === 'number' &&
           typeof value.nanoseconds === 'number';
  }

  /**
   * Valida que un objeto no tenga campos undefined antes de guardar
   */
  static validateForFirestore(obj: any, path: string = 'root'): string[] {
    const errors: string[] = [];

    if (obj === undefined) {
      errors.push(`Campo undefined en: ${path}`);
      return errors;
    }

    if (obj === null || typeof obj !== 'object') {
      return errors;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const itemErrors = this.validateForFirestore(item, `${path}[${index}]`);
        errors.push(...itemErrors);
      });
      return errors;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        errors.push(`Campo undefined en: ${path}.${key}`);
      } else if (typeof value === 'object' && value !== null) {
        const nestedErrors = this.validateForFirestore(value, `${path}.${key}`);
        errors.push(...nestedErrors);
      }
    }

    return errors;
  }

  /**
   * Sanitiza strings para Firestore
   */
  static sanitizeString(str: string): string {
    if (!str || typeof str !== 'string') {
      return '';
    }

    return str.trim()
              .replace(/\s+/g, ' ') // Múltiples espacios -> un espacio
              .substring(0, 1500); // Límite de Firestore para strings
  }

  /**
   * Sanitiza email
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    return email.toLowerCase().trim();
  }

  /**
   * Crea un objeto seguro para Firestore con valores por defecto
   */
  static createSafeObject(obj: any, defaults: any = {}): any {
    const safe = { ...defaults };

    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          safe[key] = this.sanitizeString(value);
        } else if (Array.isArray(value)) {
          safe[key] = value.filter(item => item !== undefined && item !== null);
        } else {
          safe[key] = value;
        }
      }
    }

    return safe;
  }

  /**
   * Genera un ID único para documentos
   */
  static generateId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 20; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}