export interface FormularioFirebaseRaw {
  id?: string;

  formTitular: {
    documentType: string;
    documentNumber: string;
    nombre: string;
    apellido: string;
    estadoCivil: string;
    email: string;
    fechaNacimiento: string;
    departamento: string;
    provincia: string;
    distrito: string;
    direccion: string;
    telefono1: string;
    telefono2?: string;

    licenciaStatus: string;
    licenciaConducir?: string;

    // Mantener typos de Firebase
    serlfieURL: string;
    dniFrenteuRL: string;
    dniReversoURL: string;
    reciboDeServicioURL: string;
    licConducirFrenteURL?: string;
    licConducirReversoURL?: string;
    fotoCasaURL: string;
  };

  formularioFiador?: {
    documentTypeFiador: string;
    documentNumberFiador: string;
    nombreFiador: string;
    apellidoFiador: string;
    estadoCivilFiador: string;
    emailFiador: string;
    fechaNacimientoFiador: string;
    departamentoFiador: string;
    provinciaFiador: string;
    distritoFiador: string;
    direccionFiador: string;
    telefonoPriFiador: string;
    telefonoSegFiador?: string;

    dniFrenteuRLfiador: string;
    dniReversoURLfiador: string;
    fotoCasaURLfiador: string;
  };

  formularioVehiculo: {
    priNombreReferenciaTitular: string;
    priApellidoReferenciaTitular: string;
    priTelefonoReferenciaTitular: string;
    priParentescoReferenciaTitular: string;

    segNombreReferenciaTitular: string;
    segApellidoReferenciaTitular: string;
    segTelefonoReferenciaTitular: string;
    segParentescoReferenciaTitular: string;

    terNombreReferenciaTitular: string;
    terApellidoReferenciaTitular: string;
    terTelefonoReferenciaTitular: string;
    terParentescoReferenciaTitular: string;

    marcaVehiculo: string;
    modeloVehiculo: string;
    colorVehiculo: string;

    precioCompraMoto: number | string;
    inicialVehiculo: number | string;
    numeroQuincenas: string;
    montotDeLaCuota: string | number;

    nombreDelVendedor: string;
    puntoDeVenta: string;
    mensajeOpcional?: string;
    archivos?: string[];
  };

  createdAt?: any;
  updatedAt?: any;
  vendedorId?: string;
}
