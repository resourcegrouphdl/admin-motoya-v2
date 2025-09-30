import { EstadoDocumento } from "./estado-solicitud";
import { ID, Timestamp } from "./tipes";

export interface CambioDocumento {
    readonly fecha: Timestamp;
  readonly accion: 'subida' | 'evaluacion' | 'aprobacion' | 'rechazo' | 'observacion';
  readonly estadoAnterior?: EstadoDocumento;
  readonly estadoNuevo: EstadoDocumento;
  readonly realizadoPorId: ID;
  readonly observaciones?: string;
}
