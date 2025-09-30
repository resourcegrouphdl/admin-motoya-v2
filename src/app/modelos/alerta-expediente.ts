import { Timestamp } from './tipes';

export interface AlertaExpediente {
  readonly tipo: 'info' | 'warning' | 'error' | 'critical';
  readonly origen:
    | 'solicitud'
    | 'titular'
    | 'fiador'
    | 'documentos'
    | 'tiempo'
    | 'sistema';
  readonly mensaje: string;
  readonly accionRequerida?: string;
  readonly fechaCreacion: Timestamp;
  readonly urgente: boolean;
}
