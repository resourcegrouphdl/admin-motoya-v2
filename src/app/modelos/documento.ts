import { ArchivoDocumento } from "./archivo-documento";
import { CambioDocumento } from "./cambio-documento";
import { ConfiguracionDocumento } from "./configuracion-documento";
import { EstadoDocumento, TipoDocumento } from "./estado-solicitud";
import { EvaluacionDocumento } from "./evaluacion-documento";
import { ID, Timestamp } from "./tipes";
import { ValidacionML } from "./validacion-ml";
import { ValidacionOCR } from "./validacion-ocr";


export interface Documento {
   id: ID;
   tipo: string//TipoDocumento;
   personaId: ID;
   solicitudId: ID;

  // Archivo
   archivo?: string//ArchivoDocumento;

  // Estado y evaluación
   estado: string//EstadoDocumento;
   evaluacion?: ID//EvaluacionDocumento;

  // Validaciones automáticas
   validacionOCR?:string //ValidacionOCR;
   validacionML?: string//ValidacionML;

  // Configuración
   configuracion:string// ConfiguracionDocumento;

  // Historial
   historial:  CambioDocumento[];

  // Metadatos
  
   create_at: Timestamp;
   update_at: Timestamp,
          
}
