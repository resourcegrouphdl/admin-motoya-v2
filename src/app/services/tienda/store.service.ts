import { Injectable, inject, signal, computed } from '@angular/core';
import { ExternalUserService } from '../../modulos/adminusuarios/services/external-user.service';
import { TiendaProfile } from '../../modulos/adminusuarios/enums/user-type.types';
import { take } from 'rxjs';
import { DateAdapter } from '@angular/material/core';


export interface StoreData {
  uid: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  nit?: string;
  contacto?: string;
  fechaRegistro?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private externalUserService = inject(ExternalUserService);
  
  // Computed signal que convierte las tiendas a nuestro formato
  private storesMap = computed(() => {
    const tiendas = this.externalUserService.tiendas$ ? 
      this.getCurrentTiendas() : [];
    
    const map = new Map<string, StoreData>();
    
    tiendas.forEach(tienda => {
      const storeData: StoreData = {
        uid: tienda.uid ||'',
        nombre: tienda.businessName || 'Tienda sin nombre',
        email: tienda.email,
        telefono: tienda.phone ,
        direccion:  tienda.address,
        ciudad:  tienda.city,
        nit:  tienda.documentNumber,
        contacto: tienda.contactPersonName,
        fechaRegistro: tienda.createdAt.toString(),
      };
      map.set(storeData.uid, storeData);
    });
    console.log('StoresMap actualizado, total tiendas:', map.size);
    return map;
  });

  constructor() {
    console.log('StoreService inicializado con ExternalUserService');
    
    // Suscribirse a cambios para debug
    this.externalUserService.tiendas$.subscribe(tiendas => {
      console.log('Tiendas actualizadas en StoreService:', tiendas.length);
    });
  }
  
  private getCurrentTiendas(): TiendaProfile[] {
    // Método helper para obtener el valor actual del BehaviorSubject
    let currentTiendas: TiendaProfile[] = [];
    this.externalUserService.tiendas$.pipe(take(1)).subscribe(tiendas => {
      currentTiendas = tiendas;
    });
    return currentTiendas;
  }

  /**
   * Obtener datos de una tienda por UID - Ahora usa el servicio existente
   */
  async getStoreByUID(uid: string): Promise<StoreData | null> {
    const storesMap = this.storesMap();
    const store = storesMap.get(uid);
    
    if (store) {
      console.log('Tienda encontrada en servicio existente:', store.nombre);
      return store;
    }
    
    console.warn('No se encontró tienda con UID en servicio existente:', uid);
    
    // Crear entrada básica para UIDs no encontrados
    return {
      uid: uid,
      nombre: `Tienda ${uid.substring(0, 8)}...`,
    };
  }

  /**
   * Obtener múltiples tiendas por UIDs - Simplificado
   */
  async getMultipleStores(uids: string[]): Promise<Map<string, StoreData>> {
    const results = new Map<string, StoreData>();
    const storesMap = this.storesMap();
    
    for (const uid of uids) {
      const store = storesMap.get(uid);
      if (store) {
        results.set(uid, store);
      } else {
        // Crear entrada básica para UIDs no encontrados
        results.set(uid, {
          uid: uid,
          nombre: `Tienda ${uid.substring(0, 8)}...`,
        });
      }
    }
    
    return results;
  }

  /**
   * Obtener nombre de tienda - Método rápido y sincrónico
   */
  getStoreName(uid: string): string {
    const storesMap = this.storesMap();
    const store = storesMap.get(uid);
    
    if (store) {
      return store.nombre;
    }
    
    return `Tienda ${uid.substring(0, 8)}...`;
  }

  /**
   * Verificar si una tienda está disponible
   */
  isStoreInCache(uid: string): boolean {
    const storesMap = this.storesMap();
    return storesMap.has(uid);
  }

  /**
   * Precargar tiendas - Ya no necesario, pero mantenemos para compatibilidad
   */
  async preloadStoresForProposals(proposals: any[]): Promise<void> {
    // Ya no es necesario precargar, los datos ya están disponibles
    console.log('Precarga no necesaria - usando servicio existente');
    return Promise.resolve();
  }

  /**
   * Limpiar cache - Ya no necesario, pero mantenemos para compatibilidad
   */
  clearCache(): void {
    console.log('Clear cache no necesario - usando servicio existente');
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats(): { size: number; stores: string[] } {
    const storesMap = this.storesMap();
    return {
      size: storesMap.size,
      stores: Array.from(storesMap.keys())
    };
  }

  /**
   * Obtener todas las tiendas disponibles
   */
  getAllStores(): StoreData[] {
    const storesMap = this.storesMap();
    return Array.from(storesMap.values());
  }

  /**
   * Buscar tiendas por nombre
   */
  searchStoresByName(searchTerm: string): StoreData[] {
    if (!searchTerm.trim()) {
      return this.getAllStores();
    }
    
    const term = searchTerm.toLowerCase();
    return this.getAllStores().filter(store => 
      store.nombre.toLowerCase().includes(term) ||
      store.uid.toLowerCase().includes(term)
    );
  }

  /**
   * Obtener tiendas con más propuestas (requiere datos de propuestas)
   */
  getStoresWithProposalCount(proposals: any[]): Array<{store: StoreData, count: number}> {
    const storeProposalCounts = new Map<string, number>();
    
    proposals.forEach(proposal => {
      const current = storeProposalCounts.get(proposal.uidTienda) || 0;
      storeProposalCounts.set(proposal.uidTienda, current + 1);
    });
    
    const storesMap = this.storesMap();
    const result: Array<{store: StoreData, count: number}> = [];
    
    storeProposalCounts.forEach((count, uid) => {
      const store = storesMap.get(uid);
      if (store) {
        result.push({ store, count });
      }
    });
    
    return result.sort((a, b) => b.count - a.count);
  }
}
