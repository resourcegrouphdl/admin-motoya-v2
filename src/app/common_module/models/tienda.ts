import { Direccion } from "./direccion";

export interface Tienda {

    id: string;
    razonSocial: string;
    direccion: string[];
    telefono: string;
    correo: string;
    horarioApertura: string;
    horarioCierre: string;
    imagen: string;
    colaboradorId: string[];

}
