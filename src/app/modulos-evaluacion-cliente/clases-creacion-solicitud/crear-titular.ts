import { serverTimestamp } from '@angular/fire/firestore';
import { TipoPersona } from '../../modelos/estado-solicitud';
import { Persona } from '../../modelos/persona';

export class CrearTitular {
  private titular: Persona;

  constructor() {
    this.titular = {
      id: '',
      tipo: '',
      solicitudId: '',
      datosPersonales: '',
      documentos: [],
      evaluacion: '',
      validacionesExternas: '',
      estadoCalculado: '',
      create_at: serverTimestamp(),
      update_at: serverTimestamp(),
    };
  }
  conId(id: string) {
    this.titular.id = id;
    return this;
  }
  conSolicitudId(id: string) {
    this.titular.solicitudId = id;
    return this;
  }
  conTipo(tipo: TipoPersona) {
    this.titular.tipo = tipo;
    return this;
  }
  conDatosPersonales(id: string) {
    this.titular.datosPersonales = id;
    return this;
  }
  conDocumentos(id: string[]) {
    this.titular.documentos = id;
    return this;
  }
  conEvaluacion(id: string) {
    this.titular.evaluacion = id;
    return this;
  }
  conValidacionesExternas(id: string) {
    this.titular.validacionesExternas = id;
    return this;
  }
  conEstadoCalculado(id: string) {
    this.titular.estadoCalculado = id;
    return this;
  }
  build(): Persona {
    return this.titular;
  }
}
