import { inject, Injectable, signal } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore, getDoc, query, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { MotocicletaProduct } from '../../common_module/models/motocicleta';


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private _firestore = inject(Firestore);
  private motocicletasCache$ = new BehaviorSubject<MotocicletaProduct[] | null>(null); // Caché en memoria de las motocicletas
  private _collectionRef = collection(this._firestore, "motocicleta-producto");

  loading = signal<boolean>(true);

  // Método para obtener todas las motocicletas
  
  async seveMotocicletaProduct(
    motocicleta: any,
    tableName: string
  ): Promise<void> {
    const motocicletasCollection = collection(this._firestore, tableName);
    await addDoc(motocicletasCollection, motocicleta).then(() => {});
    this.refreshProducts(); // Actualizar la caché después de guardar un nuevo producto
  }



  getById(id: string): Observable <MotocicletaProduct> {
    const docRef = doc(this._firestore, 'motocicleta-producto', id);
    return new Observable<MotocicletaProduct>((observer) => {
      getDoc(docRef).then((doc) => {
        if (doc.exists()) {
          observer.next({ id: doc.id, ...doc.data() } as MotocicletaProduct); // Convertir a tipo Motocicleta
          observer.complete();
        } else {
          observer.error(new Error('Documento no encontrado'));
        }
      }).catch((error) => {
        console.error('Error al cargar el producto', error);
        observer.error(error); // Propagar el error
      });
    });
  }


  
  getAllProducts(): Observable<MotocicletaProduct[]> {


    if (this.motocicletasCache$.value) {
      return of(this.motocicletasCache$.value);
    }

    return collectionData(this._collectionRef, { idField: 'id' }).pipe(
      map((data) => data.map(doc => doc as MotocicletaProduct)), // Convertir a tipo Motocicleta
      tap((motocicletas) => {
        this.motocicletasCache$.next(motocicletas); // Guardar en caché
      }),
      catchError((error) => {
        console.error('Error al cargar los productos', error);
        return of([]); // Evitar fallos en la app
      })
    );
  }

  refreshProducts(): void {
    this.motocicletasCache$.next(null);
  }
     

  async updateMotocicleta(id: string, field: Partial<MotocicletaProduct>): Promise<void> {
    try {
      const docRef = doc(this._firestore, `motocicleta-producto/${id}`);
      await updateDoc(docRef, field); // Actualiza solo los campos especificados
      console.log(`Documento con ID ${id} actualizado correctamente.`);
      this.refreshProducts(); // Actualizar la caché después de la actualización
    } catch (error) {
      console.error('Error al actualizar el documento:', error);
      throw error; // Propagar el error si es necesario
    }
  }


  async deleteMotocicleta(id: string): Promise<void> {
    try {
      const docRef = doc(this._firestore, `motocicleta-producto/${id}`);
      await deleteDoc(docRef); // Eliminar el documento de la base de datos
      console.log(`Documento con ID ${id} eliminado correctamente.`);
      this.refreshProducts(); // Actualizar la caché después de la eliminación
    } catch (error) {
      console.error('Error al eliminar el documento:', error);
      throw error; // Propagar el error si es necesario
    }
  }
  
}
