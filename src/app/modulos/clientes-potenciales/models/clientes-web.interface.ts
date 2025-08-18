export interface ClienteWeb {
  id?: string;
  
  // ⭐ HACER OPCIONALES LOS CAMPOS QUE NO EXISTEN EN FIREBASE INICIALMENTE
  nombre?: string;  // Se genera combinando nombres + apellidos
  email?: string;   // Existe en Firebase
  telefono?: string; // Existe en Firebase
  fechaRegistro?: Date | any;
  interes?: string;
  estado?: EstadoCliente; // ⭐ OPCIONAL porque no existe inicialmente
  vendedorAsignado?: string;
  nombreVendedor?: string;
  notas?: string;
  origen?: string;
  ultimoContacto?: Date | any;
  fechaAsignacion?: Date | any;
  ultimaActualizacion?: Date | any;
  
  // CAMPOS QUE SÍ EXISTEN EN TU FIREBASE
  apellidos?: string;
  nombres?: string;
  edad?: number;
  genero?: string;
  horarioContacto?: string;
  mensaje?: string;
  numeroDocumento?: string;
  preferenciaContacto?: string;
  producto?: string;
  tipoDocumento?: string;
}
export enum EstadoCliente {
  NUEVO = 'NUEVO',
  ASIGNADO = 'ASIGNADO',
  CONTACTADO = 'CONTACTADO',
  EN_NEGOCIACION = 'EN_NEGOCIACION',
  CAPTADO = 'CAPTADO',
  DESCARTADO = 'DESCARTADO'
}

export interface Vendedor {
  id?: string;
  nombre: string;
  email: string;
  telefono: string;
  clientesAsignados: number;
  activo: boolean;
}