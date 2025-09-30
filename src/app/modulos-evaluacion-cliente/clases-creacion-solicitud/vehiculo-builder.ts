import { Vehiculo } from '../../modelos/vehiculo';
import { FormularioFirebase } from '../componentes/tabla-de-solicitudes/tabla-de-solicitudes.component';

export class VehiculoBuilder {
  private vehiculo: Vehiculo;

  constructor() {
    this.vehiculo = {
      id: '',
      codigoSolicitud: '',
      marca: '',
      modelo: '',
      anio: 0,
      color: '',
      categoria: '',
      cilindraje: '',
      precioReferencial: 0,
      condicion: '',
      disponibleStock: false,
      tiempoEntregaEstimado: 0,
      garantiaMeses: 0,
      seguroIncluido: false,
      tramiteDocumentario: false,
      descripcionCompleta: '',
    };
  }

  crearInstanciaDeVehiculo(
    vehiculo: FormularioFirebase,
    id: string,
    codigoSolicitud: string
  ) {
    this.vehiculo.id = id;
    this.vehiculo.codigoSolicitud = codigoSolicitud;
    this.vehiculo.marca = vehiculo.formularioVehiculo.marcaVehiculo;
    this.vehiculo.modelo = vehiculo.formularioVehiculo.modeloVehiculo;
    this.vehiculo.color = vehiculo.formularioVehiculo.colorVehiculo;
    return this;
  }
  build(): Vehiculo {
    return this.vehiculo;
  }
}
