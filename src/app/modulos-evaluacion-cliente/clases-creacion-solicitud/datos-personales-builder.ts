import { serverTimestamp } from "@angular/fire/firestore";
import { DatosPersonales } from "../../modelos/datos-personales";

export class DatosPersonalesBuiler {
    
  private datosPersonales: DatosPersonales;

  constructor() {
    this.datosPersonales = {
      numeroDeSolicitud: '',
      id: '',
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      tipoDocumento: '',
      numeroDocumento: '',
      fechaNacimiento: '',
      email: '',
      telefono1: '',
      telefono2: '',
      estadoCivil: '',
      ocupacion: '',
      rangoIngresos: '',
      direccion: '',
      licencia: '',
      nombreCompleto: '',
      edad: 0,
      create_at: serverTimestamp(),
      update_at: serverTimestamp(),
    };
  }


  conNumeroDeSolicitud(numeroDeSolicitud: string): DatosPersonalesBuiler {
    this.datosPersonales.numeroDeSolicitud = numeroDeSolicitud;
    return this;
  }
  conId(id: string): DatosPersonalesBuiler {
    this.datosPersonales.id = id;
    return this;
  }
  conNombres(nombres: string): DatosPersonalesBuiler {
    this.datosPersonales.nombres = nombres;
    return this;
  }

  conApellidoPaterno(apellidoPaterno: string): DatosPersonalesBuiler {
    this.datosPersonales.apellidoPaterno = apellidoPaterno;
    return this;
  }
  conApellidoMaterno(apellidoMaterno: string): DatosPersonalesBuiler {
    this.datosPersonales.apellidoMaterno = apellidoMaterno;
    return this;
  }
  conTipoDocumento(tipoDocumento: string): DatosPersonalesBuiler {
    this.datosPersonales.tipoDocumento = tipoDocumento;
    return this;
  } 
  conNumeroDocumento(numeroDocumento: string): DatosPersonalesBuiler {
    this.datosPersonales.numeroDocumento = numeroDocumento;
    return this;
  }
  conFechaNacimiento(fechaNacimiento: string): DatosPersonalesBuiler {
    this.datosPersonales.fechaNacimiento = fechaNacimiento; 
    return this;
  }
  conEmail(email: string): DatosPersonalesBuiler {
    this.datosPersonales.email = email;
    return this;
  }
  conTelefono1(telefono1: string): DatosPersonalesBuiler {
    this.datosPersonales.telefono1 = telefono1;
    return this;
  }
  conTelefono2(telefono2: string): DatosPersonalesBuiler {
    this.datosPersonales.telefono2 = telefono2;
    return this;
  }
  conEstadoCivil(estadoCivil: string): DatosPersonalesBuiler {
    this.datosPersonales.estadoCivil = estadoCivil;
    return this;
  }
  conOcupacion(ocupacion: string): DatosPersonalesBuiler {
    this.datosPersonales.ocupacion = ocupacion;
    return this;
  }
  conRangoIngresos(rangoIngresos: string): DatosPersonalesBuiler {
    this.datosPersonales.rangoIngresos = rangoIngresos;
    return this;
  }
  conDireccion(direccion: string): DatosPersonalesBuiler {
    this.datosPersonales.direccion = direccion;
    return this;
  }
  conLicencia(licencia: string): DatosPersonalesBuiler {
    this.datosPersonales.licencia = licencia;
    return this;
  }

  conNombreCompleto(nombreCompleto: string): DatosPersonalesBuiler {
    this.datosPersonales.nombreCompleto = nombreCompleto;
    return this;
  }
  conEdad(edad: number): DatosPersonalesBuiler {
    this.datosPersonales.edad = edad;
    return this;
  }

  build(): DatosPersonales {
    return this.datosPersonales;
  }

}