import { AlertaPersona } from "./alerta-persona";
import { Score } from "./tipes";

export interface EvaluacionPersona {
  readonly estado:
    | 'incompleto'
    | 'en_evaluacion'
    | 'con_observaciones'
    | 'aprobado'
    | 'rechazado';
  readonly scoreGeneral: Score;
  readonly scoresDetalle: {
    readonly documentos: Score;
    readonly datosPersonales: Score;
    readonly centralesRiesgo: Score;
    readonly referencias?: Score; // Solo para titular
  };
  readonly observaciones: readonly string[];
  readonly alertas: readonly AlertaPersona[];
  readonly proximaAccion: string;
}
