import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, Firestore } from '@angular/fire/firestore';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { Tienda } from '../../common_module/models/tienda';

@Injectable({
  providedIn: 'root'
})
export class ColaboradoresService {

    private _firestore = inject(Firestore);
    private tiendasCache$ = new BehaviorSubject<Tienda[] | null>(null); // Caché en memoria de las motocicletas
  

  constructor() { }


   async seveFormularios(formulario: any, tableName: string): Promise<void> {

      const collecionFirebase = collection(this._firestore, tableName);
      await addDoc(collecionFirebase, formulario).then(() => {});
      this.refreshProducts(); // Actualizar la caché después de guardar un nuevo producto
    }

    refreshProducts(): void {
      this.tiendasCache$.next(null);
    }

    getAllProducts(tableName: string): Observable<Tienda[]> {
    
    
        if (this.tiendasCache$.value) {
          return of(this.tiendasCache$.value);
        }
    
        return collectionData(collection(this._firestore, tableName), { idField: 'id' }).pipe(
          map((data) => data.map(doc => doc as Tienda)), // Convertir a tipo Motocicleta
          tap((motocicletas) => {
            this.tiendasCache$.next(motocicletas); // Guardar en caché
          }),
          catchError((error) => {
            console.error('Error al cargar los productos', error);
            return of([]); // Evitar fallos en la app
          })
        );
      }


  }
