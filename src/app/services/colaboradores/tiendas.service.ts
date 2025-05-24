import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Tienda } from '../../common_module/models/tienda';
import { AutenticacionService } from '../auth/autenticacion.service';


@Injectable({
  providedIn: 'root'
})
export class TiendasService {

  _authService = inject(AutenticacionService);
  _firestore = inject(Firestore);
  tiendaCache$ = new BehaviorSubject<Tienda | null>(null);

  
  


  constructor() { }

  crearUsuarioTienda(){
    
  }


}
