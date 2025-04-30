export interface Iform {
  label: string;
  name: string;
  type: string;
  required: boolean;
  min?: number;
  max?: number;
  options?: string[];
  value?: string;
  placeholder?: string;
  multiple?: boolean;
  step?: number;
  rows?: number;
  cols?: number;
  disabled?: boolean;
  pattern?: string;
  title?: string;
  accept?: string;
}

export const formDataMotocicleta: Iform[] = [
  { label: 'Categoría', name: 'categoria', type: 'text', required: true },
  { label: 'Nombre', name: 'nombre', type: 'text', required: true },
  { label: 'Marca', name: 'marca', type: 'text', required: true },
  { label: 'Precio', name: 'precio', type: 'number', required: true, min: 0 },
  {
    label: 'Año de fabricación',
    name: 'anio',
    type: 'number',
    required: true,
    min: 1900,
    max: new Date().getFullYear(),
  },
  { label: 'Modelo', name: 'modelo', type: 'text', required: true },
  {
    label: 'Cilindrada',
    name: 'cilindrada',
    type: 'number',
    required: true,
    min: 0,
  },
  { label: 'Color', name: 'color', type: 'text', required: true },
  { label: 'Combustible', name: 'combustible', type: 'text', required: true },
  {
    label: 'Capacidad del tanque de combustible',
    name: 'capacidadCombustible',
    type: 'number',
    required: true,
    min: 0,
  },
  {
    label: 'Potencia',
    name: 'potencia',
    type: 'number',
    required: false,
    min: 0,
  },
  { label: 'Tipo de motor', name: 'tipoMotor', type: 'text', required: false },
  { label: 'Torque', name: 'torque', type: 'text', required: false },
  {
    label: 'Sistema de refrigeración',
    name: 'sistemaRefrigeracion',
    type: 'text',
    required: true,
  },
  { label: 'Transmisión', name: 'transmision', type: 'text', required: true },
  {
    label: 'Altura del asiento',
    name: 'alturaAsiento',
    type: 'text',
    required: true,
  },
  { label: 'Peso', name: 'peso', type: 'number', required: true, min: 0 },
  {
    label: 'Descripción',
    name: 'descripcion',
    type: 'textarea',
    required: true,
    rows: 4,
    cols: 50,
  },
  {
    label: 'Disponibilidad',
    name: 'disponibilidad',
    type: 'checkbox',
    required: true,
  },
  {
    label: 'Imágenes',
    name: 'imagenes',
    type: 'file',
    required: true,
    multiple: true,
    accept: 'image/*',
  },
  {
    label: 'Accesorios',
    name: 'accesorios',
    type: 'text',
    required: false,
    multiple: true,
  },
  {
    label: 'Valoración',
    name: 'valoracion',
    type: 'number',
    required: false,
    min: 0,
    max: 5,
  },
  {
    label: 'Más pedido',
    name: 'mas_pedido',
    type: 'checkbox',
    required: false,
  },
  {
    label: 'Imagen principal',
    name: 'imgPrincipal',
    type: 'file',
    required: false,
    accept: 'image/*',
  },
  { label: 'Seminuevo', name: 'seminuevo', type: 'checkbox', required: true },
  { label: 'Stock', name: 'stok', type: 'number', required: false, min: 0 },
  { label: 'Slider', name: 'slider', type: 'checkbox', required: false },
  { label: 'Destacado', name: 'destacado', type: 'checkbox', required: false },
];
