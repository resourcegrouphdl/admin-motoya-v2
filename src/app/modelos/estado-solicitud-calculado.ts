import { Porcentaje } from "./tipes";

export interface EstadoSolicitudCalculado {
  readonly etapaActual: number; // 1-10
  readonly porcentajeProgreso: Porcentaje;
  readonly tiempoTranscurrido: number; // horas desde creación
  readonly tiempoEnEtapaActual: number; // horas en etapa actual
  readonly tiempoRestante?: number; // horas hasta vencimiento
  readonly estaVencido: boolean;
  readonly requiereAccionUrgente: boolean;
  readonly proximaAccion: string;
  readonly accionesDisponibles: readonly string[];
}
