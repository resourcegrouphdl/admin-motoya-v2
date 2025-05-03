import {inject, Injectable} from "@angular/core";
import {collection, collectionData, Firestore} from "@angular/fire/firestore";
import {BehaviorSubject, catchError, map, Observable, of, tap} from "rxjs";
import {ClientesAnalisis} from "../../common_module/models/clienteanalisis";



@Injectable({
  providedIn: 'root'
})// para indicar que se puede injectar de cualquier parte de la aplicacion
export class ClientesmotoyaService {

  private _firestore = inject(Firestore);
  private _collectionRef = collection(this._firestore, "clientes");
  private ClientesAnalisisCache$ = new BehaviorSubject<ClientesAnalisis[] | null>(null); // Caché en memoria de las motocicletas


  getAllClienteAnalisis(): Observable<ClientesAnalisis[]> {

    if (this.ClientesAnalisisCache$.value) {
      return of(this.ClientesAnalisisCache$.value);
    }

    return collectionData(this._collectionRef, {idField: 'id'}).pipe(
      map((data) => data.map(doc => doc as ClientesAnalisis)), // Convertir a tipo Motocicleta
      tap((cleintesanalisis) => {
        this.ClientesAnalisisCache$.next(cleintesanalisis); // save in caché
      }),
      catchError((error) => {
        console.error('Error al cargar los clientes', error);
        return of([]); // Evitar fallos en la app
      })
    );
  }

  refreshProducts(): void {
    this.ClientesAnalisisCache$.next(null);
  }
}
