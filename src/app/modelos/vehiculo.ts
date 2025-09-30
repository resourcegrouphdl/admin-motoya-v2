import { ID, Moneda } from './tipes';

export interface Vehiculo {

  id: ID;
  codigoSolicitud: string;

  marca: string;
  modelo: string;
  anio: number;
  color: string;
  categoria: string;
  cilindraje: string;
  precioReferencial: Moneda;
  condicion: string;
  // Estado
  disponibleStock: boolean;
  tiempoEntregaEstimado: number; // días
  // Características
  garantiaMeses: number;
  seguroIncluido: boolean;
  tramiteDocumentario: boolean;
  // Campos calculados
  descripcionCompleta: string;
  
}


export enum estadoDelVehiculo {
  
  NUEVO = 'Nuevo',
  USADO = 'Usado',
  REPARADO = 'Reparado',

}