import { inject, Injectable, Signal } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { Vendedor } from '../../common_module/models/vendedor';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Tienda } from '../../common_module/models/tienda';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root',
})
export class CargaInicialService {
  // metod a llamar desde los componentes

  private _vendedores$: Signal<Vendedor[]>;
  private _tiendas$ : Signal<Tienda[]>;

  // Inyectamos Firestore para acceder a la base de datos

  private _firestore = inject(Firestore);

  // Nombre de la colección

  tableaDeVendedores = environment.TABLA_VENDEDORES;
  tableaDeTienda = environment.TABLA_TIENDAS;



  constructor() {

    const vendedoresCollection = collection(
      this._firestore,
      this.tableaDeVendedores
    );
    const vendedoresObservable = collectionData(vendedoresCollection, {
      idField: 'id',
    }).pipe(
      map((docs) => docs.map((doc) => doc as Vendedor)),
      catchError((err) => {
        console.error('Error cargando vendedores', err);
        return of([]);
      })
    );

    //  obtener las tiendas

    const tiendasCollection = collection(
      this._firestore,
      this.tableaDeTienda
    );

    const tiendasObservable = collectionData(tiendasCollection, {
      idField: 'id',
    }).pipe(
      map((docs) => docs.map((doc) => doc as Tienda)),
      catchError((err) => {
        console.error('Error cargando tiendas', err);
        return of([]);
      })
    );

    // Guardamos en signal para mantener en memoria actualizada
    this._vendedores$ = toSignal(vendedoresObservable, { initialValue: [] });
    this._tiendas$ = toSignal(tiendasObservable, { initialValue: [] });
  }




  get vendedores$(): Signal<Vendedor[]> {
    return this._vendedores$;
  }

  get tiendas$(): Signal<Tienda[]> {
    return this._tiendas$;
  }



}
