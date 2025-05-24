export interface MotocicletaProduct {
  id: string;
  marca?: string;
  modelo?: string;
  categoria?: string;
  descripcion?: string;
  fichaTecnica: string; //id de la ficha técnica en tra tabla
  imagen_principal?: string;
  imagenes?: string[];
  precioWeb?: string; //id del precio en la tabla de precios
  precioInicial: string;
  precio?: string; //id del precio en la tabla de precios
  stock?: string; //id del stock en la tabla de stock
  destacado?: string;
  fechaCreacion?: string;
  promociones?: string[]; //id de las promociones en la tabla de promociones
}

export interface fichaTecnica {
  id?: string;
  cilindrada: string;
  potencia: string;
  torque: string;
  conbustible: string;
  tanque: string;
  rendimiento: string;
  autonomia: string;
  suspencionDelantera: string;
  suspencionTrasera: string;
  frenoDelantero: string;
  frenoTrasero: string;
  transmision: string;
  peso: string;
  velocidadMaxima: string;
  dimenciones: string;
}

export interface Precio {
  id?: string;
  precioBase: string;
  precioPublico: string;
  precioDescuento: string;
  precioFinanciado: string;
  precioContado: string;
}

export interface promociones {
  id?: string;
  nombre: string;
  titulo: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  descuento: string; //id del descuento en la tabla de descuentos
  stock: string; //id del stock en la tabla de stock
}

