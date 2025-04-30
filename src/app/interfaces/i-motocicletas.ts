export interface IMotocicleta {
  // Identificador:
  id?: string; // Se genera automáticamente (opcional en inserción)

  // Información General del Producto:
  categoria: string;         // Ej: "Deportiva", "Touring", "Urbana"
  nombre: string;            // Nombre/modelo (ej: "CBR500R")
  marca: string;             // Ej: "Honda", "Yamaha"
  precio: number;            // Precio de venta

  anio: number;              // Año de fabricación
  version?: string;          // Especificación o variante del modelo (opcional)




  // Especificaciones Técnicas:
  cilindrada: number;        // En cc (ej: 500)
  color: string;             // Color principal (ej: "Rojo", "Negro")
  combustible: "gasolina" | "electrico" | "hibrido" | string; 
                           // Tipo de combustible (se puede ampliar con un enum en el futuro)
  capacidadCombustible: number;  
                           // Capacidad del tanque en litros (ej: 15)

  potencia?: number;         // Potencia en horsepower (opcional)
  tipoMotor?: string;        // Ej: "monocilíndrico", "bicilíndrico" (opcional)
  torque?: string;           // Torque (valor y unidad) (opcional)

  sistemaRefrigeracion: string;  
                           // Ej: "líquido", "aire", "aceite"
  transmision: "manual" | "automatico" | string;  
                           // Se puede ampliar con tipos fijos para mantener consistencia
  alturaAsiento?: number;    // Altura en centímetros (opcional)
  peso: number;              // Peso en kilogramos


  
  // Medios Visuales y Complementarios:
  imgPrincipal?: string;     // URL de la imagen principal
  imagenes?: string[];       // Lista de URLs de imágenes adicionales
  accesorios?: string[];     // Opcional: Lista de accesorios incluidos o compatibles

  // Estado y Control de Inventario:
  disponibilidad: boolean;   // Indica si la moto está en stock
  stock: number;             // Cantidad de unidades disponibles
  seminuevo: boolean;        // Estado: true si es seminuevo, false si es nuevo

  // Destacados en el Sitio:
  slider?: boolean;          // Se usará para determinar si se muestra en el slider principal
  destacado?: boolean;       // Destacada en listados o promociones

  // Descripción:
  descripcion: string;       // Breve descripción o información clave del modelo
}
