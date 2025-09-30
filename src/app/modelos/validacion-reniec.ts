import { Timestamp } from "./tipes";

export interface ValidacionReniec {
  readonly fechaConsulta: Timestamp;
  readonly exitoso: boolean;
  readonly datosCoinciden: boolean;
  readonly detalles: {
    readonly numeroDocumento: boolean;
    readonly nombres: boolean;
    readonly apellidos: boolean;
    readonly fechaNacimiento: boolean;
  };
  readonly estadoDocumento: 'vigente' | 'vencido' | 'anulado';
}
