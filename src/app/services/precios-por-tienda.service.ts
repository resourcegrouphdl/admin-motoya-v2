import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, Firestore } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
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
