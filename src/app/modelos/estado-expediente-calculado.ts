import { TipoDocumento } from "./estado-solicitud";
import { Porcentaje } from "./tipes";

export interface EstadoExpedienteCalculado {
    readonly puedeAvanzarEtapa: boolean;
  readonly cumpleRequisitosEtapaActual: boolean;
  readonly documentosPendientes: readonly TipoDocumento[];
  readonly validacionesPendientes: readonly string[];
  readonly tiempoRestanteEtapa?: number; // horas
  readonly probabilidadAprobacionFinal: Porcentaje;
}
