import { TipoDocumento } from "./estado-solicitud";
import { Porcentaje } from "./tipes";

export interface EstadoPersonaCalculado {
    readonly porcentajeCompletitud: Porcentaje;
  readonly documentosRequeridos: number;
  readonly documentosCompletados: number;
  readonly documentosFaltantes: readonly TipoDocumento[];
  readonly requiereAtencionUrgente: boolean;
  readonly probabilidadAprobacion: Porcentaje;
}
