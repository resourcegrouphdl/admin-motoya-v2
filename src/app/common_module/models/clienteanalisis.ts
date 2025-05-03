export interface ClientesAnalisis {
  id: string;
  formTitular?: FormTitular;
  formularioFiador?: FormularioFiador;
  formularioVehiculo?: FormularioVehiculo;
}

export interface FormTitular {
  nombre?:string;
  apellido?:string;
  distrito?: string;
  documentNumber?:string;
}

export interface FormularioFiador {
  distritoFiador?: string;
}

export interface FormularioVehiculo {
  marcaVehiculo?: string;
  modeloVehiculo?: string;
  nombreDelVendedor?:string;
  numeroQuincenas?:string;
  puntoDeVenta?:string;

}
