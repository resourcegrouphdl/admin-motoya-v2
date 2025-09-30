import { Score } from "./tipes";

export interface ResultadoVerificacionReferencia {
    readonly conoceTitular: boolean;
  readonly tiempoConocimiento: string;
  readonly relacion: 'muy_buena' | 'buena' | 'regular' | 'mala';
  readonly recomendaria: boolean;
  readonly observaciones: string;
  readonly confiabilidad: Score;
}
