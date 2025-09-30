import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import {
  BaseProfile,
  UserType,
} from '../../adminusuarios/enums/user-type.types';
import { FIREBASE_COLLECTIONS } from '../../../services/firebase-collection';
import { DateUtils } from '../../adminusuarios/enums/date-utils';
import { ExpedienteCompleto } from '../../admin-clientes/modelos/modelos-solicitudes';
import { AsesorSeleccionado } from '../selector-asesor-dialog/selector-asesor-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class VendedorService {
  private firestore = inject(Firestore);
  private usersSubject = new BehaviorSubject<BaseProfile[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor() {}

  async getUsersByType(userType: UserType): Promise<BaseProfile[]> {
    try {
      const usersCollection = collection(
        this.firestore,
        FIREBASE_COLLECTIONS.USERS
      );
      
      // SOLO una condición where para evitar índices compuestos
      const q = query(
        usersCollection,
        where('userType', '==', userType)
      );

      const querySnapshot = await getDocs(q);
      const users: BaseProfile[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data() as BaseProfile;
        // Filtrar isActive manualmente para evitar índices
        if (userData.isActive === true) {
          users.push(this.convertTimestampsToDate(userData));
        }
      });

      // Ordenar manualmente
      users.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

      return users;
    } catch (error) {
      console.error('Error getting users by type:', error);
      // SIEMPRE retornar array para evitar problemas de tipo
      return [];
    }
  }

  private convertTimestampsToDate(userData: any): BaseProfile {
    return DateUtils.convertFromFirestoreFormat(userData);
  }

  async getListaDeUsuarios(): Promise<BaseProfile[]> {
    try {
      const users = await this.getUsersByType(UserType.VENDEDOR);
      this.usersSubject.next(users);
      return users;
    } catch (error) {
      console.error('Error en getListaDeUsuarios:', error);
      // Asegurar que siempre se actualice el subject con un array
      this.usersSubject.next([]);
      return [];
    }
  }

  async getAllAdministrativeUsers(): Promise<BaseProfile[]> {
    try {
      const allUserTypes = [
        UserType.COMERCIAL,
        UserType.LOGISTICA,
        UserType.FINANZAS,
        UserType.GERENCIA,
        UserType.CONTABILIDAD,
        UserType.ADMINISTRACION,
        UserType.RECURSOS_HUMANOS
      ];

      const usersCollection = collection(this.firestore, FIREBASE_COLLECTIONS.USERS);
      const users: BaseProfile[] = [];

      // Procesar cada tipo de usuario por separado para evitar índices compuestos
      for (const userType of allUserTypes) {
        try {
          const q = query(
            usersCollection,
            where('userType', '==', userType)
          );

          const querySnapshot = await getDocs(q);

          querySnapshot.forEach(doc => {
            const userData = doc.data() as BaseProfile;
            // Filtrar isActive manualmente
            if (userData.isActive === true) {
              users.push(this.convertTimestampsToDate(userData));
            }
          });
        } catch (typeError) {
          console.warn(`Error loading users of type ${userType}:`, typeError);
          // Continuar con el siguiente tipo en caso de error
        }
      }

      // Ordenar la lista final por firstName
      users.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

      return users;
    } catch (error) {
      console.error('Error getting all administrative users:', error);
      return [];
    }
  }

  // Método auxiliar para verificar que el cache es un array válido
  private ensureArray(data: any): BaseProfile[] {
    if (Array.isArray(data)) {
      return data;
    }
    console.warn('Data is not an array, returning empty array:', data);
    return [];
  }

  // Método para obtener usuarios del cache de forma segura
  getUsersFromCache(): BaseProfile[] {
    const currentUsers = this.usersSubject.value;
    return this.ensureArray(currentUsers);
  }

  

// Método corregido usando la colección correcta: 'solicitudes'
// Implementación completa del método asignarAsesor
async asignarAsesor(asesor: AsesorSeleccionado, solicitudId: string): Promise<void> {
  console.log('🚀 Iniciando asignación de asesor:', { asesor, solicitudId });

  // Validaciones
  if (!solicitudId) {
    console.error('❌ solicitudId es requerido');
    throw new Error('ID de solicitud es requerido');
  }

  if (!asesor || !asesor.id) {
    console.error('❌ Asesor inválido:', asesor);
    throw new Error('Datos del asesor son inválidos');
  }

  try {
    // Crear referencia al documento en la colección 'solicitudes'
    const solicitudDocRef = doc(this.firestore, 'solicitudes', solicitudId);
    console.log('📝 Referencia creada:', solicitudDocRef.path);

    // Verificar que el documento existe
    const docSnapshot = await getDoc(solicitudDocRef);
    if (!docSnapshot.exists()) {
      console.error('❌ Documento no encontrado:', solicitudId);
      throw new Error(`Solicitud con ID ${solicitudId} no encontrada`);
    }

    console.log('✅ Documento encontrado, asignando asesor...');

    // Crear objeto asesor completo
    const asesorAsignado = {
      id: asesor.id,
      nombre: asesor.nombre,
      email: asesor.email,
      rol: asesor.rol,
      fechaAsignacion: new Date().toISOString()
    };

    console.log('👤 Asesor a asignar:', asesorAsignado);

    // Actualizar el documento agregando el campo asesorAsignado
    await setDoc(solicitudDocRef, {
      asesorAsignado: asesorAsignado,
      ultimaActualizacion: new Date().toISOString()
    }, { merge: true });

    console.log('✅ Asesor asignado exitosamente a la solicitud:', solicitudId);

  } catch (error:any) {
    console.error('❌ Error en asignarAsesor:', {
      error: error.message,
      solicitudId,
      asesor
    });
    throw new Error(`Error al asignar asesor: ${error.message}`);
  }
}
}