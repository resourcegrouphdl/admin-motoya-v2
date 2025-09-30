import { Porcentaje } from "./tipes";

export interface CoordenadaTexto {
    readonly texto: string;
  readonly x: number;
  readonly y: number;
  readonly ancho: number;
  readonly alto: number;
  readonly confianza: Porcentaje;
}
