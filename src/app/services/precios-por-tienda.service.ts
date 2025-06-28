import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, Firestore } from '@angular/fire/firestore';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { preciosPorTientda } from '../colaboradores/detalles-asociados-atienda/detalles-asociados-atienda.component';
import { ColaboradoresService } from './colaboradores/colaboradores.service';

@Injectable({
  providedIn: 'root'
})
export class PreciosPorTiendaService {

  _ccolaboradoresService = inject(ColaboradoresService);

  private _firestore = inject(Firestore);
  preciosAFinanciarCache$ = new BehaviorSubject<any[] | null>(null); // Caché en memoria de las motocicletas
  private _collectionRef = collection(this._firestore, "preciosPorTienda");


  constructor() { }

  
    getById(){

    }

  
  

}
