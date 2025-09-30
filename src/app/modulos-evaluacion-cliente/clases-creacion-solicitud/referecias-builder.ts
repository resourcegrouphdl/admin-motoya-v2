import { Timestamp } from '@angular/fire/firestore';
import { Referencia } from '../../modelos/referencia';
import { serverTimestamp } from '@firebase/firestore';
import { FormularioFirebase } from '../componentes/tabla-de-solicitudes/tabla-de-solicitudes.component';

export class ReferenciaBuilder {
  private referencia: Referencia;

  constructor() {
    this.referencia = {
      id: '',
      titularId: '',
      solicitudId: '',

      nombre: '',
      apellidos: '',
      telefono: '',
      parentesco: '',
      ocupacion: '',

      // Verificación
      estadoVerificacion: '',

      fechaContacto: serverTimestamp(),

      verificadoPorId: '',
      intentosContacto: 0,

      // Resultado
      resultadoVerificacion: '',

      // Campos calculados
      nombreCompleto: '',
      esReferenciaConfiable: false,
      puntajeReferencia: 0,
    };
  }

  public referenciaTitualr(
    objeto: FormularioFirebase,
    id: string,
    codigoDeSolicitud: string,
    idTitular: string
  ): ReferenciaBuilder {
    this.referencia.id = id;
    this.referencia.titularId = idTitular;
    this.referencia.solicitudId = codigoDeSolicitud;
    this.referencia.nombre =
      objeto.formularioVehiculo.priNombreReferenciaTitular;
    this.referencia.apellidos =
      objeto.formularioVehiculo.priApellidoReferenciaTitular;
    this.referencia.telefono =
      objeto.formularioVehiculo.priTelefonoReferenciaTitular;
    this.referencia.parentesco =
      objeto.formularioVehiculo.priParentescoReferenciaTitular;
    this.referencia.nombreCompleto =
      objeto.formularioVehiculo.priNombreReferenciaTitular +
      ' ' +
      objeto.formularioVehiculo.priApellidoReferenciaTitular;
    return this;
  }

  public referenciaTitualr2(
    objeto: FormularioFirebase,
    id: string,
    codigoDeSolicitud: string,
    idTitular: string
  ): ReferenciaBuilder {
    this.referencia.id = id;
    this.referencia.titularId = idTitular;
    this.referencia.solicitudId = codigoDeSolicitud;
    this.referencia.nombre =
      objeto.formularioVehiculo.segNombreReferenciaTitular;
    this.referencia.apellidos =
      objeto.formularioVehiculo.segApellidoReferenciaTitular;
    this.referencia.telefono =
      objeto.formularioVehiculo.segTelefonoReferenciaTitular;
    this.referencia.parentesco =
      objeto.formularioVehiculo.segParentescoReferenciaTitular;
    this.referencia.nombreCompleto =
      objeto.formularioVehiculo.segNombreReferenciaTitular +
      ' ' +
      objeto.formularioVehiculo.segApellidoReferenciaTitular;
    return this;
  }

  public referenciaTitualr3(
    objeto: FormularioFirebase,
    id: string,
    codigoDeSolicitud: string,
    idTitular: string
  ): ReferenciaBuilder {
    this.referencia.id = id;
    this.referencia.titularId = idTitular;
    this.referencia.solicitudId = codigoDeSolicitud;
    this.referencia.nombre =
      objeto.formularioVehiculo.terNombreReferenciaTitular;
    this.referencia.apellidos =
      objeto.formularioVehiculo.terApellidoReferenciaTitular;
    this.referencia.telefono =
      objeto.formularioVehiculo.terTelefonoReferenciaTitular;
    this.referencia.parentesco =
      objeto.formularioVehiculo.terParentescoReferenciaTitular;
    this.referencia.nombreCompleto =
      objeto.formularioVehiculo.terNombreReferenciaTitular +
      ' ' +
      objeto.formularioVehiculo.terApellidoReferenciaTitular;
    return this;
  }

  public build(): Referencia {
    return this.referencia;
  }
}
