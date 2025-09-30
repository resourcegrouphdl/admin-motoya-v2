import { Moneda, Porcentaje } from './tipes';

export interface DatosFinancieros {
  id: string;
  codigoSolicitud: string;
  precioVehiculo: string;
  montoInicial: string;
  montoCuota: string;
  numeroCuotas: string;
  tasaInteresAnual: string;
  // Campos calculados
  montoFinanciado: string; // precioVehiculo - montoInicial
  totalAPagar: string; // montoCuota * numeroCuotas
}
