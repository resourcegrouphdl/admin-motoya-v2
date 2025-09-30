import { DatosFinancieros } from "./datos-financieros";
import { DecisionCredito } from "./decision-credito";
import { EstadoSolicitud, Prioridad } from "./estado-solicitud";
import { EstadoSolicitudCalculado } from "./estado-solicitud-calculado";
import { EvaluacionSolicitud } from "./evaluacion-solicitud";
import { ID, Timestamp } from "./tipes";

export interface Solicitud {

   id: ID;    // identificador  
   idSemilla: string;
   numero: string;  // numero de solicitud
   estado: EstadoSolicitud; // estado de la solicitud
   prioridad: Prioridad; // prioridad de la solicitud


  // Referencias
   titularId: ID;  
   fiadorId?: ID;
   vehiculoId: ID;
   vendedorId: ID;
   tienda:ID;
   referencias:[];

  // Datos financieros
   datosFinancieros: ID // DatosFinancieros;

  // Asignaciones
   asesorAsignadoId?: ID;
   evaluadorActualId?: ID;

  // Fechas
   fechaCreacion: Timestamp;
   fechaActualizacion: Timestamp;
   fechaAsignacion?: Timestamp;
   fechaLimiteEvaluacion?: Timestamp;

  // Evaluación
   evaluacion: ID //EvaluacionSolicitud;

  // Decision
   decision?: ID //DecisionCredito;

  // Documentos del proceso
   certificadoGenerado: boolean;
   urlCertificado?: string;
   contratoGenerado: boolean;
   urlContrato?: string;
   evidenciasGeneradas: boolean;
   urlEvidencias?: string[];



  // Entrega
   entregaCompletada: boolean;
   fechaEntregaReal?: Timestamp;

  // Estado calculado ( porque se calcula)
   estadoCalculado: ID // EstadoSolicitudCalculado;

  create_at?: Timestamp;
  update_at?: Timestamp;
}
