import { Moneda, Timestamp } from "./tipes";

export interface ValidacionSBS {
  readonly fechaConsulta: Timestamp;
  readonly score: number;
  readonly clasificacion:
    | 'normal'
    | 'con_problemas'
    | 'deficiente'
    | 'dudoso'
    | 'perdida';
  readonly deudaTotal: Moneda;
  readonly entidadesReportantes: number;
}
