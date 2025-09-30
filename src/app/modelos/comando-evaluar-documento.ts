import { ChecklistEvaluacion } from "./checklist-evaluacion";
import { DatosPersonales } from "./datos-personales";
import { EstadoSolicitud } from "./estado-solicitud";
import { ID, Timestamp } from "./tipes";

export interface ComandoEvaluarDocumento {
    readonly documentoId: ID;
  readonly evaluadorId: ID;
  readonly resultado: 'aprobado' | 'observado' | 'rechazado';
  readonly observaciones?: string;
  readonly checklist?: ChecklistEvaluacion;
}

export interface ComandoActualizarPersona {
  readonly personaId: ID;
  readonly datosPersonales: Partial<DatosPersonales>;
  readonly actualizadoPorId: ID;
}

export interface ComandoCambiarEstadoSolicitud {
  readonly solicitudId: ID;
  readonly nuevoEstado: EstadoSolicitud;
  readonly realizadoPorId: ID;
  readonly observaciones?: string;
}

// Eventos (cosas que han pasado)
export interface EventoDocumentoEvaluado {
  readonly documentoId: ID;
  readonly personaId: ID;
  readonly solicitudId: ID;
  readonly evaluadorId: ID;
  readonly resultado: 'aprobado' | 'observado' | 'rechazado';
  readonly fecha: Timestamp;
}

export interface EventoSolicitudCambioEstado {
  readonly solicitudId: ID;
  readonly estadoAnterior: EstadoSolicitud;
  readonly estadoNuevo: EstadoSolicitud;
  readonly realizadoPorId: ID;
  readonly fecha: Timestamp;
}

export interface EventoPersonaActualizada {
  readonly personaId: ID;
  readonly solicitudId: ID;
  readonly cambios: readonly string[];
  readonly actualizadoPorId: ID;
  readonly fecha: Timestamp;
}