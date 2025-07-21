import { inject, Injectable } from '@angular/core';
import { addDoc, collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { Vendedor } from '../../common_module/models/vendedor';
import { ErrorDeConexionFirestore } from '../errors/vendedor-existente.error';
import { VendedorExistenteError } from '../errors/firestore-conexion.error';
import { AppError } from '../errors/app-error';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  _firestore = inject(Firestore);
  _errorHandler = inject(ErrorHandlerService);

  constructor() { }

  async guardarVendedor(v: Vendedor): Promise<void> {
    const vendedoresRef = collection(this._firestore, 'vendedores');

    try {
      const existe = await getDocs(query(vendedoresRef, where('apellido', '==', v.apellido)));

      if (!existe.empty) throw new VendedorExistenteError();

      await addDoc(vendedoresRef, v);
    } catch (error) {
      throw error instanceof AppError ? error : new ErrorDeConexionFirestore();
    }
  }
}
