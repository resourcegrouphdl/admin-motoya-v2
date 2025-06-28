import { preciosPorTientda } from "../../colaboradores/detalles-asociados-atienda/detalles-asociados-atienda.component";
import { Direccion } from "./direccion";

export interface Tienda {

    id: string;
    razonSocial: string;
    direccion: string[];
    telefono: string;
    correo: string;
    imagen: string;
    contrasena: string;
    colaboradorId: string[];
    listaDeProductosPorFinanciar: preciosPorTientda[]

    

}
