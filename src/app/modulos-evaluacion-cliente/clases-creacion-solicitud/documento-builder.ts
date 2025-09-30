import { serverTimestamp } from '@angular/fire/firestore';
import { Documento } from '../../modelos/documento';
import { EstadoDocumento, TipoDocumento } from '../../modelos/estado-solicitud';
import { FormularioFirebase } from '../componentes/tabla-de-solicitudes/tabla-de-solicitudes.component';
import { EvaluacionDocumento } from '../../modelos/evaluacion-documento';


export class DocumentoBuilder {

  private documento: Documento;

  constructor() {
    this.documento = {
      id: '',
      tipo: '',
      personaId: '',
      solicitudId: '',
      // Archivo
      archivo: '',//url
      // Estado y evaluación
      estado: '',
      evaluacion: '',
      // Validaciones automáticas
      validacionOCR: '',
      validacionML: '',
      // Configuración
      configuracion: '',
      // Historial
      historial: [],
      // Metadatos
      create_at: serverTimestamp(),
      update_at: serverTimestamp(),
    };
  }

  
   
  public crearDocumentoDNIFrente(url:string, idgenerado:string, id_persona:string, codiggoSolicitud:string): DocumentoBuilder {
    this.documento.tipo = TipoDocumento.DNI_FRENTE;
    this.documento.archivo = url;
    this.documento.estado = EstadoDocumento.EN_EVALUACION;
    this.documento.id = idgenerado;
    this.documento.personaId= id_persona;
    this.documento.solicitudId = codiggoSolicitud;
    return this;
  }

  public crearDocumentoDNIReverso(url:string, idgenerado:string, id_persona:string, codiggoSolicitud:string) :DocumentoBuilder {
    this.documento.tipo = TipoDocumento.DNI_REVERSO;
    this.documento.archivo = url;
    this.documento.estado = EstadoDocumento.EN_EVALUACION;
    this.documento.id = idgenerado;
    this.documento.personaId= id_persona;
    this.documento.solicitudId = codiggoSolicitud;
    return this;
  }
  public crearDocumentoLicenciaFrente(url:string, idgenerado:string, id_persona:string, codiggoSolicitud:string){
    this.documento.tipo = TipoDocumento.LICENCIA_CONDUCIR;
    this.documento.archivo = url;
    this.documento.estado = EstadoDocumento.EN_EVALUACION;
    this.documento.id = idgenerado;
    this.documento.personaId= id_persona;
    this.documento.solicitudId = codiggoSolicitud;
    return this;
  }

  public crearDocumentoLicenciaReverso(url:string, idgenerado:string, id_persona:string, codiggoSolicitud:string){
    this.documento.tipo = TipoDocumento.LICENCIA_CONDUCIR;
    this.documento.archivo = url;
    this.documento.estado = EstadoDocumento.EN_EVALUACION;
    this.documento.id = idgenerado;
    this.documento.personaId= id_persona;
    this.documento.solicitudId = codiggoSolicitud;
    return this;
  }

  public crearDocumentoReciboServicioUrl(url:string, idgenerado:string, id_persona:string, codiggoSolicitud:string){
    this.documento.tipo = TipoDocumento.RECIBO_SERVICIO;
    this.documento.archivo = url;
    this.documento.estado = EstadoDocumento.EN_EVALUACION;
    this.documento.id = idgenerado;
    this.documento.personaId= id_persona;
    this.documento.solicitudId = codiggoSolicitud;
    return this;
  }  

  public crearDocumentoSelfiUrl(url:string, idgenerado:string, id_persona:string, codiggoSolicitud:string){
    this.documento.tipo = TipoDocumento.SELFIE;
    this.documento.archivo = url;
    this.documento.estado = EstadoDocumento.EN_EVALUACION;
    this.documento.id = idgenerado;
    this.documento.personaId= id_persona;
    this.documento.solicitudId = codiggoSolicitud;
    return this;
  }

  public crearDocumentoFotCasaUrl(url:string, idgenerado:string, id_persona:string, codiggoSolicitud:string){
    this.documento.tipo = TipoDocumento.FACHADA_VIVIENDA;
    this.documento.archivo = url;
    this.documento.estado = EstadoDocumento.EN_EVALUACION;
    this.documento.id = idgenerado;
    this.documento.personaId= id_persona;
    this.documento.solicitudId = codiggoSolicitud;
    return this;
  }

  public crearDocumetoExtras(url:string, idgenerado:string, id_persona:string, codiggoSolicitud:string){
    this.documento.tipo = TipoDocumento.OTROS;
    this.documento.archivo = url;
    this.documento.estado = EstadoDocumento.EN_EVALUACION;
    this.documento.id = idgenerado;
    this.documento.personaId= id_persona;
    this.documento.solicitudId = codiggoSolicitud;
    return this;
  }

  public build(): Documento {
    return this.documento;
  }







}
