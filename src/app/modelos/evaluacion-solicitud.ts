import { Score } from './tipes';

export interface EvaluacionSolicitud {
  readonly scoreDocumental?: Score;
  readonly scoreCentralesRiesgo?: Score;
  readonly scoreGarantes?: Score;
  readonly scoreEntrevista?: Score;
  readonly scoreFinal?: Score;
  readonly nivelRiesgo?: 'bajo' | 'medio' | 'alto';
}
