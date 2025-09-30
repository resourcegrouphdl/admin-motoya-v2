import { DatosLicencia } from "./datos-licencia";
import { Direccion } from "./direccion";
import { Timestamp } from "./tipes";

export interface DatosPersonales {
   numeroDeSolicitud:string;
   id: string;
   
   nombres: string;
   apellidoPaterno: string;
   apellidoMaterno: string;
   tipoDocumento: string;
   numeroDocumento: string;
   fechaNacimiento: string;
   email: string;
   telefono1: string;
   telefono2?: string;
   estadoCivil: string;
   ocupacion: string;
   rangoIngresos: string;

  // Dirección
   direccion: string; //Direccion;

  // Licencia (opcional)
   licencia?:string //DatosLicencia;

  // Campos calculados
   nombreCompleto: string;
   edad: number;
   create_at: Timestamp;
   update_at: Timestamp;
}
