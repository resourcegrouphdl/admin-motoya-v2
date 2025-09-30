import { Timestamp } from './tipes';
import { ID, Score } from './tipes';
import { ResultadoVerificacionReferencia } from './resultado-verificacion-referencia';

export interface Referencia {
  id: ID;
  titularId: ID;
  solicitudId: ID;

  nombre: string;
  apellidos: string;
  telefono: string;
  parentesco: string;
  ocupacion?: string;

  // Verificación
  estadoVerificacion: string; //estadoVerificvaiconReferencia
    
  fechaContacto?: Timestamp;
  
  verificadoPorId?: ID;
  intentosContacto: number;

  // Resultado
  resultadoVerificacion?: string//ResultadoVerificacionReferencia;

  // Campos calculados
  nombreCompleto: string;
  esReferenciaConfiable: boolean;
  puntajeReferencia: Score;
}

export enum estadoVerificacionReferencia {
  PENDIENTE = 'pendiente',
  CONTACTADO = 'contactado',
  VERIFICADO = 'verificado',
  NO_CONTACTADO = 'no_contactado',
  RECHAZADO = 'rechazado',


}