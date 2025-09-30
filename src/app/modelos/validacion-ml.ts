import { Porcentaje, Score, Timestamp } from './tipes';

export interface ValidacionML {
  readonly fechaAnalisis: Timestamp;
  readonly modelo: string;
  readonly versionModelo: string;
  readonly predicciones: {
    readonly tipoDocumento: {
      readonly tipo: string;
      readonly confianza: Porcentaje;
    };
    readonly autenticidad: {
      readonly esAutentico: boolean;
      readonly confianza: Porcentaje;
    };
    readonly calidad: {
      readonly puntuacion: Score;
      readonly factores: readonly string[];
    };
  };
}
