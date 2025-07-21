export interface Tienda {
  id: string;
  razonSocial: string;
  direccion: string[];
  telefono: string;
  correo: string;
  imagen: string;
  contrasena: string;
  colaboradorId: string[];
  listaDeProductosPorFinanciar: PreciosPorTientda[];
}
export interface PreciosPorTientda {
  marca: string;
  modelo: string;
  precio: number;
  stock: number;
}
