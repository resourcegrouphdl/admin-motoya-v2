import { Timestamp } from "./tipes";

export interface ValidacionMTC {
  readonly fechaConsulta: Timestamp;
  readonly licenciaValida: boolean;
  readonly categoria: string;
  readonly fechaVencimiento: Timestamp;
  readonly restricciones: readonly string[];
  readonly infracciones: number;
}
