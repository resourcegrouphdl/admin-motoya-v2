import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { SolicitudCredito, Vehiculo } from '../../admin-clientes/modelos/modelos-solicitudes';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, NgIf } from '@angular/common';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface SeccionVehiculo {
  id: string;
  titulo: string;
  icono: string;
  completada: boolean;
}

interface DetalleFinanciero {
  concepto: string;
  valor: number | string;
  tipo: 'dinero' | 'texto' | 'porcentaje';
  destacado?: boolean;
  descripcion?: string;
}

interface EspecificacionTecnica {
  nombre: string;
  valor: string;
  icono: string;
  categoria: 'basico' | 'tecnico' | 'adicional';
}


@Component({
  selector: 'app-vehiculo-detalle',
  standalone: true,
  imports: [NgIf, MatIconModule, MatCardModule, MatChipsModule,
    MatExpansionModule, CommonModule, MatProgressBarModule
  ],
  templateUrl: './vehiculo-detalle.component.html',
  styleUrl: './vehiculo-detalle.component.css'
})
export class VehiculoDetalleComponent implements OnInit, OnChanges {
@Input() vehiculo!: Vehiculo;
  @Input() solicitud!: SolicitudCredito;

  // Secciones del vehículo
  secciones: SeccionVehiculo[] = [];
  
  // Datos procesados
  especificaciones: EspecificacionTecnica[] = [];
  detallesFinancieros: DetalleFinanciero[] = [];
  
  // Estado de la UI
  seccionExpandida = 'informacion-basica';
  mostrarCalculadoraFinanciera = false;

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.inicializarComponente();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['vehiculo'] || changes['solicitud']) && !changes['vehiculo']?.firstChange) {
      this.inicializarComponente();
    }
  }
  calcularDiferenciaPrecio(): number {
  if (!this.vehiculo.precioReferencial || !this.solicitud.precioCompraMoto) {
    return 0;
  }
  return Math.abs(this.solicitud.precioCompraMoto - this.vehiculo.precioReferencial);
}

// También puedes agregar un método para determinar si es ahorro o sobrecosto
esAhorro(): boolean {
  if (!this.vehiculo.precioReferencial || !this.solicitud.precioCompraMoto) {
    return false;
  }
  return this.solicitud.precioCompraMoto < this.vehiculo.precioReferencial;
}

  // ======================================
  // INICIALIZACIÓN
  // ======================================

  private inicializarComponente(): void {
    this.validarDatos();
    this.inicializarSecciones();
    this.procesarEspecificaciones();
    this.procesarDetallesFinancieros();
  }

  private validarDatos(): void {
    if (!this.vehiculo) {
      console.warn('VehiculoDetalleComponent: No se recibió información del vehículo');
      return;
    }
    
    if (!this.solicitud) {
      console.warn('VehiculoDetalleComponent: No se recibió información de la solicitud');
      return;
    }

    // Validar campos esenciales
    if (!this.vehiculo.marca || !this.vehiculo.modelo) {
      console.warn('VehiculoDetalleComponent: Faltan datos básicos del vehículo');
    }
  }

  private inicializarSecciones(): void {
    this.secciones = [
      {
        id: 'informacion-basica',
        titulo: 'Información Básica',
        icono: 'two_wheeler',
        completada: this.evaluarSeccionBasica()
      },
      {
        id: 'especificaciones-tecnicas',
        titulo: 'Especificaciones Técnicas',
        icono: 'settings',
        completada: this.evaluarSeccionTecnica()
      },
      {
        id: 'informacion-financiera',
        titulo: 'Información Financiera',
        icono: 'attach_money',
        completada: this.evaluarSeccionFinanciera()
      },
      {
        id: 'documentacion-vehiculo',
        titulo: 'Documentación',
        icono: 'description',
        completada: this.evaluarSeccionDocumentacion()
      }
    ];
  }

  private procesarEspecificaciones(): void {
    this.especificaciones = [];

    // Especificaciones básicas (siempre presentes)
    this.especificaciones.push(
      {
        nombre: 'Marca',
        valor: this.vehiculo.marca || 'No especificada',
        icono: 'business',
        categoria: 'basico'
      },
      {
        nombre: 'Modelo',
        valor: this.vehiculo.modelo || 'No especificado',
        icono: 'label',
        categoria: 'basico'
      },
      {
        nombre: 'Año',
        valor: this.vehiculo.anio?.toString() || 'No especificado',
        icono: 'calendar_today',
        categoria: 'basico'
      },
      {
        nombre: 'Color',
        valor: this.vehiculo.color || 'No especificado',
        icono: 'palette',
        categoria: 'basico'
      }
    );

    // Especificaciones técnicas (opcionales)
    if (this.vehiculo.categoria) {
      this.especificaciones.push({
        nombre: 'Categoría',
        valor: this.formatearCategoria(this.vehiculo.categoria),
        icono: 'category',
        categoria: 'tecnico'
      });
    }

    if (this.vehiculo.cilindraje) {
      this.especificaciones.push({
        nombre: 'Cilindraje',
        valor: this.vehiculo.cilindraje,
        icono: 'speed',
        categoria: 'tecnico'
      });
    }

    if (this.vehiculo.condicion) {
      this.especificaciones.push({
        nombre: 'Condición',
        valor: this.formatearCondicion(this.vehiculo.condicion),
        icono: 'verified',
        categoria: 'tecnico'
      });
    }

    // Especificaciones adicionales
    if (this.vehiculo.garantiaMeses) {
      this.especificaciones.push({
        nombre: 'Garantía',
        valor: `${this.vehiculo.garantiaMeses} meses`,
        icono: 'shield',
        categoria: 'adicional'
      });
    }

    if (this.vehiculo.numeroSerie) {
      this.especificaciones.push({
        nombre: 'Número de Serie',
        valor: this.vehiculo.numeroSerie,
        icono: 'qr_code',
        categoria: 'adicional'
      });
    }

    if (this.vehiculo.numeroMotor) {
      this.especificaciones.push({
        nombre: 'Número de Motor',
        valor: this.vehiculo.numeroMotor,
        icono: 'engineering',
        categoria: 'adicional'
      });
    }

    if (this.vehiculo.placas) {
      this.especificaciones.push({
        nombre: 'Placas',
        valor: this.vehiculo.placas,
        icono: 'credit_card',
        categoria: 'adicional'
      });
    }
  }

  private procesarDetallesFinancieros(): void {
    this.detallesFinancieros = [
      {
        concepto: 'Precio del Vehículo',
        valor: this.solicitud.precioCompraMoto,
        tipo: 'dinero',
        destacado: true,
        descripcion: 'Precio de venta del vehículo'
      },
      {
        concepto: 'Pago Inicial',
        valor: this.solicitud.inicial,
        tipo: 'dinero',
        descripcion: `${this.calcularPorcentajeInicial().toFixed(1)}% del precio total`
      },
      {
        concepto: 'Monto Financiado',
        valor: this.solicitud.montoFinanciado,
        tipo: 'dinero',
        descripcion: 'Cantidad a financiar'
      },
      {
        concepto: 'Cuota Quincenal',
        valor: this.solicitud.montoCuota,
        tipo: 'dinero',
        descripcion: 'Pago cada 15 días'
      },
      {
        concepto: 'Plazo de Financiamiento',
        valor: `${this.solicitud.plazoQuincenas} quincenas`,
        tipo: 'texto',
        descripcion: `${this.convertirQuincenasAMeses(this.solicitud.plazoQuincenas)} meses`
      },
      {
        concepto: 'Total a Pagar',
        valor: this.solicitud.totalAPagar,
        tipo: 'dinero',
        destacado: true,
        descripcion: 'Suma total de todas las cuotas + inicial'
      }
    ];

    // Agregar información adicional si está disponible
    if (this.vehiculo.precioReferencial && this.vehiculo.precioReferencial !== this.solicitud.precioCompraMoto) {
      this.detallesFinancieros.unshift({
        concepto: 'Precio Referencial',
        valor: this.vehiculo.precioReferencial,
        tipo: 'dinero',
        descripcion: 'Precio de mercado sugerido'
      });
    }
  }

  // ======================================
  // EVALUACIÓN DE COMPLETITUD
  // ======================================

  private evaluarSeccionBasica(): boolean {
    return !!(this.vehiculo.marca && 
             this.vehiculo.modelo && 
             this.vehiculo.anio && 
             this.vehiculo.color);
  }

  private evaluarSeccionTecnica(): boolean {
    return !!(this.vehiculo.categoria && 
             this.vehiculo.cilindraje && 
             this.vehiculo.condicion);
  }

  private evaluarSeccionFinanciera(): boolean {
    return !!(this.solicitud.precioCompraMoto && 
             this.solicitud.inicial && 
             this.solicitud.montoCuota && 
             this.solicitud.plazoQuincenas);
  }

  private evaluarSeccionDocumentacion(): boolean {
    // En un caso real, verificaría documentos del vehículo
    return !!(this.vehiculo.numeroSerie || 
             this.vehiculo.numeroMotor || 
             this.vehiculo.placas);
  }

  // ======================================
  // CÁLCULOS Y FORMATEO
  // ======================================

  private calcularPorcentajeInicial(): number {
    if (!this.solicitud.precioCompraMoto || this.solicitud.precioCompraMoto === 0) {
      return 0;
    }
    return (this.solicitud.inicial / this.solicitud.precioCompraMoto) * 100;
  }

  private convertirQuincenasAMeses(quincenas: number): string {
    const meses = quincenas / 2;
    return meses % 1 === 0 ? meses.toString() : meses.toFixed(1);
  }

  private formatearCategoria(categoria: string): string {
    const categorias: { [key: string]: string } = {
      'motoneta': 'Motoneta',
      'motocicleta': 'Motocicleta',
      'trimoto': 'Trimoto'
    };
    return categorias[categoria] || categoria;
  }

  formatearCondicion(condicion: string): string {
    const condiciones: { [key: string]: string } = {
      'nuevo': 'Nuevo',
      'seminuevo': 'Semi-nuevo',
      'usado': 'Usado'
    };
    return condiciones[condicion] || condicion;
  }

  // ======================================
  // MÉTODOS PÚBLICOS PARA TEMPLATE
  // ======================================

  expandirSeccion(seccionId: string): void {
    this.seccionExpandida = this.seccionExpandida === seccionId ? '' : seccionId;
  }

  estaSeccionExpandida(seccionId: string): boolean {
    return this.seccionExpandida === seccionId;
  }

  toggleCalculadoraFinanciera(): void {
    this.mostrarCalculadoraFinanciera = !this.mostrarCalculadoraFinanciera;
  }

  formatearMoneda(monto: number): string {
    if (typeof monto !== 'number' || isNaN(monto)) {
      return 'S/ 0.00';
    }
    
    try {
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
      }).format(monto);
    } catch (error) {
      return `S/ ${monto.toFixed(2)}`;
    }
  }

  formatearValor(detalle: DetalleFinanciero): string {
    if (detalle.tipo === 'dinero' && typeof detalle.valor === 'number') {
      return this.formatearMoneda(detalle.valor);
    }
    return detalle.valor.toString();
  }

  obtenerEspecificacionesPorCategoria(categoria: 'basico' | 'tecnico' | 'adicional'): EspecificacionTecnica[] {
    return this.especificaciones.filter(esp => esp.categoria === categoria);
  }

  obtenerColorCondicion(): 'primary' | 'accent' | 'warn' {
    if (!this.vehiculo.condicion) return 'accent';
    
    switch (this.vehiculo.condicion) {
      case 'nuevo': return 'primary';
      case 'seminuevo': return 'accent';
      case 'usado': return 'warn';
      default: return 'accent';
    }
  }

  obtenerEdadVehiculo(): number {
    if (!this.vehiculo.anio) return 0;
    return new Date().getFullYear() - this.vehiculo.anio;
  }

  obtenerDescripcionCompleta(): string {
    const partes = [
      this.vehiculo.marca,
      this.vehiculo.modelo,
      this.vehiculo.cilindraje,
      this.vehiculo.anio?.toString(),
      this.vehiculo.color
    ].filter(parte => parte && parte.trim() !== '');

    return partes.join(' ');
  }

  calcularDepreciacion(): number {
    if (!this.vehiculo.precioReferencial || !this.vehiculo.anio) {
      return 0;
    }

    const edadVehiculo = this.obtenerEdadVehiculo();
    if (edadVehiculo === 0) return 0;

    const depreciacionAnual = 0.15; // 15% anual
    const factorDepreciacion = Math.pow(1 - depreciacionAnual, edadVehiculo);
    const valorDepreciado = this.vehiculo.precioReferencial * factorDepreciacion;
    
    return this.vehiculo.precioReferencial - valorDepreciado;
  }

  obtenerValorActualEstimado(): number {
    if (!this.vehiculo.precioReferencial) {
      return this.solicitud.precioCompraMoto;
    }

    const depreciacion = this.calcularDepreciacion();
    return this.vehiculo.precioReferencial - depreciacion;
  }

  esVehiculoNuevo(): boolean {
    return this.vehiculo.condicion === 'nuevo' || this.obtenerEdadVehiculo() === 0;
  }

  tieneDocumentacionCompleta(): boolean {
    return !!(this.vehiculo.numeroSerie && 
             this.vehiculo.numeroMotor);
  }

  // ======================================
  // ACCIONES
  // ======================================

  verImagenesVehiculo(): void {
    // TODO: Implementar galería de imágenes
    this.mostrarInfo('Galería de imágenes próximamente disponible');
  }

  descargarFichaVehiculo(): void {
    // TODO: Implementar descarga de ficha técnica
    this.mostrarInfo('Descarga de ficha técnica en desarrollo');
  }

  compararPrecios(): void {
    // TODO: Implementar comparador de precios
    this.mostrarInfo('Comparador de precios próximamente disponible');
  }

  // ======================================
  // GETTERS PARA TEMPLATE
  // ======================================

  get porcentajeCompletitudGeneral(): number {
    const seccionesCompletadas = this.secciones.filter(s => s.completada).length;
    return this.secciones.length > 0 ? (seccionesCompletadas / this.secciones.length) * 100 : 0;
  }

  get tieneInformacionAdicional(): boolean {
    return !!(this.vehiculo.accesoriosIncluidos?.length || 
             this.vehiculo.garantiaMeses || 
             this.vehiculo.seguroIncluido || 
             this.vehiculo.tramiteDocumentario);
  }

  get requiereMantenimiento(): boolean {
    return this.vehiculo.requiereMantenimiento === true;
  }

  get disponibilidadStock(): 'disponible' | 'agotado' | 'bajo_stock' {
    if (this.vehiculo.disponibleStock === false) return 'agotado';
    if (this.vehiculo.disponibleStock === true) return 'disponible';
    return 'bajo_stock';
  }

  get tiempoEstimadoEntrega(): string {
    if (!this.vehiculo.tiempoEntregaEstimado) {
      return 'No especificado';
    }
    
    const dias = this.vehiculo.tiempoEntregaEstimado;
    if (dias <= 7) return `${dias} días`;
    if (dias <= 30) return `${Math.ceil(dias / 7)} semanas`;
    return `${Math.ceil(dias / 30)} meses`;
  }

  // ======================================
  // NOTIFICACIONES
  // ======================================

  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }
}