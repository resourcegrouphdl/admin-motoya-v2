import { Porcentaje } from "./tipes";

export interface MetadataImagen {
    readonly dimensiones: { readonly ancho: number; readonly alto: number };
  readonly resolucion: number;
  readonly calidadEstimada: Porcentaje;
}
