import { DatosFinancieros } from "../../modelos/datos-financieros";
import { FormularioFirebase } from "../componentes/tabla-de-solicitudes/tabla-de-solicitudes.component";

export class DatosFinancierosBuilder {
    private datosFinancieros: DatosFinancieros;
  
    constructor() {
      this.datosFinancieros = {
        id: '',
        codigoSolicitud: '',
        precioVehiculo: '',
        montoInicial: '',
        montoCuota: '',
        numeroCuotas: '',
        tasaInteresAnual: '',
        montoFinanciado: '',
        totalAPagar: '',
      };
    }
  
    generarDatosFinancieros(objeto:FormularioFirebase,codigosSolicitud:string, idGenerado:string){
       this.datosFinancieros.id = idGenerado;
       this.datosFinancieros.codigoSolicitud = codigosSolicitud;
       this.datosFinancieros.precioVehiculo = objeto.formularioVehiculo.precioCompraMoto;
       this.datosFinancieros.montoInicial = objeto.formularioVehiculo.inicialVehiculo;
       this.datosFinancieros.montoCuota = objeto.formularioVehiculo.montotDeLaCuota;
       this.datosFinancieros.numeroCuotas = objeto.formularioVehiculo.numeroQuincenas;
      return this;
    }

    build(): DatosFinancieros {
      return this.datosFinancieros;
    }
  
  
}