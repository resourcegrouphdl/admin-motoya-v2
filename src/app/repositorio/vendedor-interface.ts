import { Vendedor } from "../common_module/models/vendedor";

export interface VendedorInterface {

   guardarDatosDelVendedor(formulario: Vendedor): Promise<void>;

   modificarDatosDelVendedor(uid: string): Promise<void>;

   borrarDatosDelVendedor(uid: string): Promise<void>;

   desiganarVendedorATienda(uid: string, idTienda: string): Promise<void>;

}
