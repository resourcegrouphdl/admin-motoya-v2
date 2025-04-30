export interface IformProducto {
  label: string;
  inputType: string;
  formControlName: string;
  placeholder: string;
  required: boolean;
  options?: string[];
  type: string;
  value?: string;
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  id?: string;
}

export const informacionGeneral: IformProducto[] = [
  // Campo oculto para el ID (si se desea mostrar en casos de edición)
  {
    label: 'ID',
    inputType: 'hidden',
    formControlName: 'id',
    placeholder: '',
    required: false,
    type: 'string',
    hidden: true,
    value: '',
  },
  // Información General del Producto
  {
    label: 'Categoría',
    inputType: 'text',
    formControlName: 'categoria',
    placeholder: 'Ej: Deportiva, Touring, Urbana',
    required: true,
    type: 'string',
    value: '',
  },
  {
    label: 'Nombre / Modelo',
    inputType: 'text',
    formControlName: 'nombre',
    placeholder: 'Ej: CBR500R',
    required: true,
    type: 'string',
    value: '',
  },
  {
    label: 'Marca',
    inputType: 'text',
    formControlName: 'marca',
    placeholder: 'Ej: Honda, Yamaha',
    required: true,
    type: 'string',
    value: '',
  },
  {
    label: 'Precio',
    inputType: 'number',
    formControlName: 'precio',
    placeholder: 'Ingrese el precio de venta',
    required: true,
    type: 'number',
    value: '',
  },
  {
    label: 'Año de Fabricación',
    inputType: 'number',
    formControlName: 'anio',
    placeholder: 'Ej: 2020',
    required: true,
    type: 'number',
    value: '',
  },
  {
    label: 'Versión',
    inputType: 'text',
    formControlName: 'version',
    placeholder: 'Opcional: Ingrese la versión o variante del modelo',
    required: false,
    type: 'string',
    value: '',
  },
];

export const especificacionesTecnicas: IformProducto[] = [
  {
    label: 'Cilindrada (cc)',
    inputType: 'number',
    formControlName: 'cilindrada',
    placeholder: 'Ingrese la cilindrada en cc',
    required: true,
    type: 'number',
    value: '',
  },
  {
    label: 'Color',
    inputType: 'text',
    formControlName: 'color',
    placeholder: 'Ej: Rojo, Negro',
    required: true,
    type: 'string',
    value: '',
  },
  {
    label: 'Combustible',
    inputType: 'select',
    formControlName: 'combustible',
    placeholder: 'Seleccione el tipo de combustible',
    required: true,
    type: 'string',
    options: ['gasolina', 'electrico', 'hibrido'],
    value: '',
  },
  {
    label: 'Capacidad del Tanque (L)',
    inputType: 'number',
    formControlName: 'capacidadCombustible',
    placeholder: 'Ingrese la capacidad en litros',
    required: true,
    type: 'number',
    value: '',
  },
  {
    label: 'Potencia (hp)',
    inputType: 'number',
    formControlName: 'potencia',
    placeholder: 'Opcional: Ingrese la potencia en hp',
    required: false,
    type: 'number',
    value: '',
  },
  {
    label: 'Tipo de Motor',
    inputType: 'text',
    formControlName: 'tipoMotor',
    placeholder: 'Opcional: Ej: Monocilíndrico, Bicilíndrico',
    required: false,
    type: 'string',
    value: '',
  },
  {
    label: 'Torque',
    inputType: 'text',
    formControlName: 'torque',
    placeholder: 'Opcional: Ingresa el torque (valor y unidad)',
    required: false,
    type: 'string',
    value: '',
  },
  {
    label: 'Sistema de Refrigeración',
    inputType: 'text',
    formControlName: 'sistemaRefrigeracion',
    placeholder: 'Ej: Líquido, Aire, Aceite',
    required: true,
    type: 'string',
    value: '',
  },
  {
    label: 'Transmisión',
    inputType: 'text',
    formControlName: 'transmision',
    placeholder: 'Seleccione la transmisión',
    required: true,
    type: 'string',
    options: ['manual', 'automatico'],
    value: '',
  },
  {
    label: 'Altura del Asiento (cm)',
    inputType: 'number',
    formControlName: 'alturaAsiento',
    placeholder: 'Opcional: Ingrese la altura en centímetros',
    required: false,
    type: 'number',
    value: '',
  },
  {
    label: 'Peso (kg)',
    inputType: 'number',
    formControlName: 'peso',
    placeholder: 'Ingrese el peso en kilogramos',
    required: true,
    type: 'number',
    value: '',
  },
];
export const mediosVisuales: IformProducto[] = [
  {
    label: 'Imagen Principal (URL)',
    inputType: 'text',
    formControlName: 'imgPrincipal',
    placeholder: 'Ingrese la URL de la imagen principal',
    required: false,
    type: 'imagen',
    value: '',
  },
  {
    label: 'Otras Imágenes (URLs)',
    inputType: 'textarea',
    formControlName: 'imagenes',
    placeholder: 'Ingrese URLs adicionales separadas por comas',
    required: false,
    type: 'string',
    value: '',
  },
  {
    label: 'Accesorios',
    inputType: 'textarea',
    formControlName: 'accesorios',
    placeholder:
      'Opcional: Ingrese accesorios compatibles, separados por comas',
    required: false,
    type: 'string',
    value: '',
  },
];

export const estadoInventario: IformProducto[] = [
  {
    label: 'Disponibilidad',
    inputType: 'checkbox',
    formControlName: 'disponibilidad',
    placeholder: '',
    required: true,
    type: 'boolean',
    value: '',
  },
  {
    label: 'Stock',
    inputType: 'number',
    formControlName: 'stock',
    placeholder: 'Ingrese la cantidad de unidades disponibles',
    required: true,
    type: 'number',
    value: '',
  },
  {
    label: 'Seminuevo',
    inputType: 'checkbox',
    formControlName: 'seminuevo',
    placeholder: '',
    required: true,
    type: 'boolean',
    value: '',
  },
];
export const destacados: IformProducto[] = [
  {
    label: 'Mostrar en Slider',
    inputType: 'checkbox',
    formControlName: 'slider',
    placeholder: '',
    required: false,
    type: 'boolean',
    value: '',
  },
  {
    label: 'Destacado',
    inputType: 'checkbox',
    formControlName: 'destacado',
    placeholder: '',
    required: false,
    type: 'boolean',
    value: '',
  },
];
export const descripcion: IformProducto[] = [
  {
    label: 'Descripción',
    inputType: 'textarea',
    formControlName: 'descripcion',
    placeholder: 'Ingrese una breve descripción del modelo',
    required: true,
    type: 'string',
    value: '',
  },
];
