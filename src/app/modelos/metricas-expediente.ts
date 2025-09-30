import { Porcentaje } from "./tipes";

export interface MetricasExpediente {
     readonly tiempoPromedioEtapa: number; // minutos
  readonly eficienciaProceso: Porcentaje;
  readonly numeroReevaluaciones: number;
  readonly documentosEvaluados: number;
  readonly evaluadoresInvolucrados: number;
}
