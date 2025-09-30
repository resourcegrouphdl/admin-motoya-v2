import { Timestamp } from "./tipes";

export interface AlertaPersona {
  readonly tipo: 'info' | 'warning' | 'error' | 'critical';
  readonly categoria: 'documento' | 'datos' | 'centrales' | 'tiempo';
  readonly mensaje: string;
  readonly fechaCreacion: Timestamp;
  readonly resuelto: boolean;
}
