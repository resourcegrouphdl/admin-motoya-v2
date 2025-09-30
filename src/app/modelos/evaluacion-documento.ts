import { ChecklistEvaluacion } from "./checklist-evaluacion";
import { RolSistema } from "./estado-solicitud";
import { PuntuacionesEvaluacion } from "./puntuaciones-evaluacion";
import { ID, Timestamp } from "./tipes";

export interface EvaluacionDocumento {
    readonly evaluadorId: ID;
  readonly evaluadorNombre: string;
  readonly evaluadorRol: RolSistema;
  readonly fechaInicio: Timestamp;
  readonly fechaFin?: Timestamp;
  readonly duracionMinutos?: number;
  
  readonly resultado: 'aprobado' | 'observado' | 'rechazado';
  readonly observaciones?: string;
  readonly motivoRechazo?: string;
  
  // Checklist específico
  readonly checklist?: ChecklistEvaluacion;
  
  // Puntuaciones
  readonly puntuaciones: PuntuacionesEvaluacion;
  
  readonly requiereReevaluacion: boolean;
}
