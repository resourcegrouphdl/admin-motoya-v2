import { ID, Moneda, Porcentaje, Timestamp } from "./tipes";

export interface DecisionCredito {
    readonly resultado: 'aprobado' | 'rechazado' | 'condicional';
  readonly montoAprobado?: Moneda;
  readonly tasaAprobada?: Porcentaje;
  readonly condicionesEspeciales?: readonly string[];
  readonly motivoRechazo?: string;
  readonly decidirPorId: ID;
  readonly fechaDecision: Timestamp;
}
