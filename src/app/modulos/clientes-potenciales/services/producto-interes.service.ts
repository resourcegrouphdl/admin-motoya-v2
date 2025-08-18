import { inject, Injectable } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { FIREBASE_COLLECTIONS } from '../../../services/firebase-collection';

export interface ProductoInteresado {
  id: string;
  imagen_principal?: string;
  marca?: string;
  modelo?: string;
  precioWeb: string;
  producto?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoInteresService {
  _firestore = inject(Firestore);

  constructor() {}

  // Método original mejorado
  async getProductById(id: string): Promise<ProductoInteresado> {
    try {
      const productRef = doc(
        this._firestore,
        FIREBASE_COLLECTIONS.PRODUCTOS_MOTOCICLETAS,
        id
      );
      const productSnapshot = await getDoc(productRef);

      if (productSnapshot.exists()) {
        const data = productSnapshot.data();
        return {
          id: productSnapshot.id,
          ...data,
          
        } as ProductoInteresado;
      } else {
        throw new Error(`Producto con ID ${id} no encontrado`);
      }
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  }

  // Método específico para obtener solo la imagen principal
  async getImagenPrincipalById(id: string): Promise<string> {
    try {
      const producto = await this.getProductById(id);

      if (
        producto.imagen_principal &&
        typeof producto.imagen_principal === 'string'
      ) {
        return producto.imagen_principal;
      } else {
        throw new Error(
          'El producto no tiene imagen_principal o no es una URL válida'
        );
      }
    } catch (error) {
      console.error('Error al obtener imagen principal:', error);
      throw error;
    }
  }

  // Método alternativo que obtiene directamente desde Firestore solo la imagen
  async getImagenPrincipalDirecta(id: string): Promise<string | null> {
    try {
      const productRef = doc(
        this._firestore,
        FIREBASE_COLLECTIONS.PRODUCTOS_MOTOCICLETAS,
        id
      );
      const productSnapshot = await getDoc(productRef);

      if (productSnapshot.exists()) {
        const data = productSnapshot.data();
        const imagenPrincipal = data?.['imagen_principal'];

        if (imagenPrincipal && typeof imagenPrincipal === 'string') {
          return imagenPrincipal;
        } else {
          console.warn(`Producto ${id} no tiene imagen_principal válida`);
          return null;
        }
      } else {
        throw new Error(`Producto con ID ${id} no encontrado`);
      }
    } catch (error) {
      console.error('Error al obtener imagen principal directa:', error);
      return null;
    }
  }

  // Método para validar si una URL de imagen es válida
  private isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Método con validación de URL de imagen
  async getImagenPrincipalValidada(id: string): Promise<string> {
    try {
      const imagenUrl = await this.getImagenPrincipalById(id);

      if (this.isValidImageUrl(imagenUrl)) {
        return imagenUrl;
      } else {
        throw new Error('La URL de imagen_principal no es válida');
      }
    } catch (error) {
      console.error('Error al validar imagen principal:', error);
      throw error;
    }
  }
}
