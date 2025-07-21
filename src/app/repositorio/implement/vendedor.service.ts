import { inject, Injectable } from '@angular/core';
import { VendedorInterface } from '../vendedor-interface';
import { environment } from '../environment';
import { addDoc, collection, Firestore, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Vendedor } from '../../common_module/models/vendedor';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { VendedorExistenteError } from '../../core/errors/firestore-conexion.error';
import { AppError } from '../../core/errors/app-error';
import { ErrorDeConexionFirestore } from '../../core/errors/vendedor-existente.error';

@Injectable({
  providedIn: 'root'
})
export class VendedorService implements VendedorInterface {

  _firestore = inject(Firestore);
  _errorHandler = inject(ErrorHandlerService);

  tablaDeVendedores = environment.TABLA_VENDEDORES;
  tablaDeTienda = environment.TABLA_TIENDAS;


  constructor() { }

  async guardarDatosDelVendedor(formulario: Vendedor): Promise<void> {

    const vendedorRef = collection(this._firestore, this.tablaDeVendedores);
    try {
      
      const existeVendedor = await getDocs(query(vendedorRef, where('correo', '==', formulario.correo)));
      
      if (!existeVendedor.empty) {
        throw new VendedorExistenteError;
      }
      await addDoc(vendedorRef, formulario);
    
    } catch (error) {
      throw error instanceof AppError ? error : new ErrorDeConexionFirestore();
    }
  }

  modificarDatosDelVendedor(uid: string): Promise<void> {
    // Implementación del método
    return Promise.resolve();
  }

  borrarDatosDelVendedor(uid: string): Promise<void> {
    // Implementación del método
    return Promise.resolve();
  }

  desiganarVendedorATienda(uid: string, idTienda: string): Promise<void> {
    // Implementación del método
    return Promise.resolve();
  }



}
