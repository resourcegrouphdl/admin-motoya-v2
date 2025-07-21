import { inject, Injectable } from '@angular/core';
import { TiendaInterface } from '../tienda-interface';
import { Tienda, PreciosPorTientda } from '../../common_module/models/tienda';
import { Firestore } from '@angular/fire/firestore';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root',
})
export class TiendaService implements TiendaInterface {
  _firestore = inject(Firestore);
  _errorHandler = inject(ErrorHandlerService);

  tablaDeVendedores = environment.TABLA_VENDEDORES;
  tablaDeTienda = environment.TABLA_TIENDAS;

  constructor() {}
  guardarDatosDeTienda(formulario: Tienda): Promise<void> {
    throw new Error('Method not implemented.');
  }
  modificarDatosDelTienda(uid: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  borrarDatosDelTienda(uid: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  buscarTiendaPorId(id: string): Promise<Tienda | null> {
    throw new Error('Method not implemented.');
  }
  listarVendedoresDeTienda(idTienda: string): Promise<Tienda | null> {
    throw new Error('Method not implemented.');
  }
  agregarListaDePreciosPorTienda(
    idTienda: string,
    listaDePrecios: PreciosPorTientda[]
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  modificarListaDePreciosPorTienda(
    idTienda: string,
    listaDePrecios: PreciosPorTientda[]
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  eliminarListaDePreciosPorTienda(
    idTienda: string,
    listaDePrecios: PreciosPorTientda[]
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
