import { CoordenadaTexto } from './coordenada-texto';
import { DatosExtraidosOCR } from './datos-extraidos-ocr';
import { Porcentaje, Timestamp } from './tipes';

export interface ValidacionOCR {
  readonly fechaProcesamiento: Timestamp;
  readonly proveedor: string;
  readonly exitoso: boolean;
  readonly confiabilidad: Porcentaje;
  readonly datosExtraidos: DatosExtraidosOCR;
  readonly coordenadasTexto: readonly CoordenadaTexto[];
}
