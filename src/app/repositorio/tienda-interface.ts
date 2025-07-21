import { PreciosPorTientda, Tienda } from '../common_module/models/tienda';

export interface TiendaInterface {
  guardarDatosDeTienda(formulario: Tienda): Promise<void>;

  modificarDatosDelTienda(uid: string): Promise<void>;

  borrarDatosDelTienda(uid: string): Promise<void>;

  buscarTiendaPorId(id: string): Promise<Tienda | null>;

  listarVendedoresDeTienda(idTienda: string): Promise<Tienda | null>;

  agregarListaDePreciosPorTienda(
    idTienda: string,
    listaDePrecios: PreciosPorTientda[]
  ): Promise<void>;

  modificarListaDePreciosPorTienda(
    idTienda: string,
    listaDePrecios: PreciosPorTientda[]
  ): Promise<void>;

  eliminarListaDePreciosPorTienda(
    idTienda: string,
    listaDePrecios: PreciosPorTientda[]
  ): Promise<void>;

}
