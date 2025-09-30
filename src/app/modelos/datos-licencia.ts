import { Timestamp } from "./tipes";

export interface DatosLicencia {
  readonly numero: string;
  readonly categoria: string;
  readonly fechaVencimiento: Timestamp;
  readonly estado: 'vigente' | 'vencida' | 'suspendida';
}
