import { Component, inject, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientesWebService } from '../services/clientes-web.service';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ClienteWeb } from '../models/clientes-web.interface';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  ProductoInteresado,
  ProductoInteresService,
} from '../services/producto-interes.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-detalle-cliente-dialog',
  standalone: true,
  imports: [
    MatIcon,
    MatFormFieldModule,
    NgIf,
    NgClass,
    ReactiveFormsModule,
    NgClass,
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './detalle-cliente-dialog.component.html',
  styleUrl: './detalle-cliente-dialog.component.css',
})
export class DetalleClienteDialogComponent implements OnInit {
  _productoService = inject(ProductoInteresService);

  cliente: ClienteWeb;
  notasEditables: string;
  producto: ProductoInteresado = {
    id: '',
    precioWeb: '',
    imagen_principal: '',
    marca: '',
    modelo: '',
   
  };

  imagen_referencial!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { cliente: ClienteWeb },
    private dialogRef: MatDialogRef<DetalleClienteDialogComponent>,
    private clientesService: ClientesWebService,
    private snackBar: MatSnackBar
  ) {
    this.cliente = data.cliente;
    this.notasEditables = this.cliente.notas || '';
    this.getProductoInteresado();
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  async getProductoInteresado(): Promise<void> {
    try {
      if (!this.cliente.producto) {
        console.log('Producto obtenido:', this.producto);// Obtener el producto completo usando el ID del producto, no del cliente
      }else{
        console.log('ID del cliente no disponible para obtener producto, ', this.cliente.producto);
        const productoId = this.cliente.producto;
        this.producto = await this._productoService.getProductById(productoId);
      }
    } catch (error) {
      console.error('Error al obtener producto de interés:', error);
    }
  }

  // ⭐ MÉTODO getColorEstado CORREGIDO
  getColorEstado(estado: string | undefined): string {
    // Valor por defecto si no hay estado
    const estadoSeguro = estado || 'NUEVO';

    const colores: { [key: string]: string } = {
      NUEVO: 'bg-blue-100 text-blue-800',
      ASIGNADO: 'bg-yellow-100 text-yellow-800',
      CONTACTADO: 'bg-orange-100 text-orange-800',
      EN_NEGOCIACION: 'bg-purple-100 text-purple-800',
      CAPTADO: 'bg-green-100 text-green-800',
      DESCARTADO: 'bg-red-100 text-red-800',
    };

    return colores[estadoSeguro] || 'bg-gray-100 text-gray-800';
  }

  // ⭐ MÉTODO formatearFecha CORREGIDO
  formatearFecha(fecha: any): string {
    if (!fecha) return 'No registrado';

    try {
      let date: Date;
      if (fecha instanceof Date) {
        date = fecha;
      } else if (fecha?.toDate) {
        date = fecha.toDate();
      } else {
        date = new Date(fecha);
      }

      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  }

  // ⭐ OTROS MÉTODOS CORREGIDOS
  guardarNotas(): void {
    if (this.cliente.id) {
      this.clientesService
        .agregarNotas(this.cliente.id, this.notasEditables)
        .then(() => {
          this.cliente.notas = this.notasEditables;
          this.snackBar.open('Notas guardadas correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          this.snackBar.open('Error al guardar las notas', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        });
    }
  }

  marcarComoContactado(): void {
    if (this.cliente.id) {
      this.clientesService
        .marcarComoContactado(this.cliente.id)
        .then(() => {
          // ⭐ ACTUALIZAR EL ESTADO LOCAL
          this.cliente.estado = 'CONTACTADO' as any;
          this.cliente.ultimoContacto = new Date();

          this.snackBar.open('Cliente marcado como contactado', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          this.snackBar.open('Error al actualizar estado', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        });
    }
  }

  abrirWhatsApp(): void {
    // ⭐ VALIDAR QUE LOS DATOS EXISTAN
    if (!this.cliente.telefono) {
      this.snackBar.open('No hay número de teléfono registrado', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    const nombreCliente =
      this.cliente.nombres?.trim() || this.cliente.nombre || 'Cliente';
    const mensaje = encodeURIComponent(
      `Hola ${nombreCliente}, me comunico desde [Tu Empresa] respecto a tu consulta sobre: "${(
        this.cliente.mensaje || 'motocicletas'
      ).substring(
        0,
        100
      )}". ¿Cuándo podríamos coordinar una cita para mostrarte nuestras motocicletas?`
    );

    window.open(
      `https://wa.me/51${this.cliente.telefono}?text=${mensaje}`,
      '_blank'
    );

    // Marcar como contactado automáticamente
    this.marcarComoContactado();
  }

  copiarInformacion(): void {
    // ⭐ CREAR RESUMEN SEGURO DE LA INFORMACIÓN
    const nombreCompleto =
      this.cliente.nombre ||
      `${this.cliente.nombres || ''} ${this.cliente.apellidos || ''}`.trim() ||
      'Sin nombre';
    const documentoCompleto = this.cliente.numeroDocumento
      ? `${this.cliente.tipoDocumento || 'DOC'}: ${
          this.cliente.numeroDocumento
        }`
      : 'No especificado';

    const info = `
INFORMACIÓN DEL CLIENTE
========================
Nombre: ${nombreCompleto}
Email: ${this.cliente.email || 'No especificado'}
Teléfono: ${this.cliente.telefono || 'No especificado'}
Edad: ${this.cliente.edad || 'No especificada'}
Género: ${this.cliente.genero || 'No especificado'}
Documento: ${documentoCompleto}

CONTACTO
========
Preferencia: ${this.cliente.preferenciaContacto || 'No especificado'}
Horario: ${this.cliente.horarioContacto || 'No especificado'}

INTERÉS
=======
Producto: ${this.cliente.producto || 'No especificado'}
Mensaje: ${this.cliente.mensaje || 'Sin mensaje'}

ESTADO ACTUAL
=============
Estado: ${this.cliente.estado || 'NUEVO'}
Vendedor: ${this.cliente.nombreVendedor || 'Sin asignar'}
Fecha Registro: ${this.formatearFecha(this.cliente.fechaRegistro)}
Última Actualización: ${this.formatearFecha(this.cliente.ultimaActualizacion)}

NOTAS INTERNAS
==============
${this.cliente.notas || 'Sin notas'}
    `.trim();

    navigator.clipboard
      .writeText(info)
      .then(() => {
        this.snackBar.open('Información copiada al portapapeles', 'Cerrar', {
          duration: 2000,
          panelClass: ['success-snackbar'],
        });
      })
      .catch(() => {
        this.snackBar.open('Error al copiar información', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
