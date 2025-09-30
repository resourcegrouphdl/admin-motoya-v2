import { ID, Timestamp } from './tipes';
import { DatosPersonales } from './datos-personales';
import { Documento } from './documento';
import { EvaluacionPersona } from './evaluacion-persona';
import { EstadoPersonaCalculado } from './estado-persona-calculado';
import { ValidacionesExternas } from './validaciones-externas';
import { TipoPersona } from './estado-solicitud';

export interface Persona {
  id: ID;
  tipo: ID//TipoPersona;
  solicitudId: ID;

  // Datos personales
  datosPersonales: ID // DatosPersonales;

  // Documentos
  documentos: string[] //Documento[];

  // Evaluación
  evaluacion: ID//EvaluacionPersona;

  // Validaciones externas
  validacionesExternas: ID// ValidacionesExternas;

  // Estado calculado
  estadoCalculado: ID//EstadoPersonaCalculado;

  // Metadatos
  create_at: Timestamp;
  update_at: Timestamp;
}
