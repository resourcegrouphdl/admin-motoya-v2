import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  ClienteWeb,
  EstadoCliente,
  Vendedor,
} from '../models/clientes-web.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ClientesWebService } from '../services/clientes-web.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatCard } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AsignarVendedorDialogComponent } from '../asignar-vendedor-dialog/asignar-vendedor-dialog.component';
import { DetalleClienteDialogComponent } from '../detalle-cliente-dialog/detalle-cliente-dialog.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-dashboard-clientes',
  standalone: true,
  imports: [
    MatProgressSpinner,
    MatIcon,
    MatPaginator,
    MatMenu,
    MatCard,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSort,
    NgIf,
    NgFor,
    NgClass,
    MatTableModule,
    MatMenuModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatListModule,
    MatDividerModule,
    MatTabsModule,
    MatStepperModule,
  ],
  templateUrl: './dashboard-clientes.component.html',
  styleUrl: './dashboard-clientes.component.css',
})
export class DashboardClientesComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  datosYaMigrados = true;
  dataSource = new MatTableDataSource<ClienteWeb>([]);
  displayedColumns: string[] = [
    'nombre',
    'email',
    'telefono',
    'interes', // ⭐ NUEVA COLUMNA
    'fechaRegistro',
    'estado',
    'vendedorAsignado',
    'acciones',
  ];

  // Controles de filtros
  filtroNombre = new FormControl('');
  filtroEstado = new FormControl('');
  filtroVendedor = new FormControl('');

  // Estados y datos
  clientes: ClienteWeb[] = [];
  vendedores: Vendedor[] = [];
  estadosCliente = Object.values(EstadoCliente);
  cargando = true;
  estadisticas: any = {};

  private destroy$ = new Subject<void>();

  constructor(
    private clientesService: ClientesWebService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🚀 [DashboardComponent] Iniciando componente...');

    // Verificar conexión primero
    this.clientesService
      .verificarConexionFirebase()
      .then(() => {
        console.log(
          '✅ [DashboardComponent] Conexión verificada, cargando datos...'
        );
        this.cargarDatos();
      })
      .catch((error) => {
        console.error('❌ [DashboardComponent] Error de conexión:', error);
        this.mostrarMensaje('Error de conexión a Firebase', true);
      });

    this.configurarFiltros();
    this.verificarMigracion();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    this.cargando = true;

    // Cargar clientes
    this.clientesService
      .getClientesWeb()
      .pipe(takeUntil(this.destroy$))
      .subscribe((clientes) => {
        this.clientes = clientes;
        this.dataSource.data = clientes;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.cargando = false;
      });

    // Cargar vendedores
    console.log('👥 [DashboardComponent] Cargando vendedores...');
    this.clientesService
      .getVendedores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vendedores) => {
          console.log(
            '✅ [DashboardComponent] Vendedores recibidos:',
            vendedores
          );
          this.vendedores = vendedores;

          if (vendedores.length === 0) {
            console.warn(
              '⚠️ [DashboardComponent] No se encontraron vendedores'
            );
          }
        },
        error: (error) => {
          console.error(
            '❌ [DashboardComponent] Error cargando vendedores:',
            error
          );
          this.mostrarMensaje('Error al cargar vendedores', true);
          this.vendedores = []; // Asegurar que sea array vacío
        },
      });

    // Cargar estadísticas
    this.clientesService
      .getEstadisticas()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stats) => {
        this.estadisticas = stats;
      });
  }

  configurarFiltros(): void {
    // Filtro por nombre
    this.filtroNombre.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.aplicarFiltros());

    // Filtro por estado
    this.filtroEstado.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.aplicarFiltros());

    // Filtro por vendedor
    this.filtroVendedor.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.aplicarFiltros());
  }

  aplicarFiltros(): void {
    let datosFiltrados = [...this.clientes];

    // Filtro por nombre
    const nombre = this.filtroNombre.value?.toLowerCase() || '';
    if (nombre) {
      datosFiltrados = datosFiltrados.filter(
        (cliente) =>
          cliente.nombre!.toLowerCase().includes(nombre) ||
          cliente.email!.toLowerCase().includes(nombre)
      );
    }

    // Filtro por estado
    const estado = this.filtroEstado.value;
    if (estado) {
      datosFiltrados = datosFiltrados.filter(
        (cliente) => cliente.estado === estado
      );
    }

    // Filtro por vendedor
    const vendedor = this.filtroVendedor.value;
    if (vendedor) {
      datosFiltrados = datosFiltrados.filter(
        (cliente) => cliente.vendedorAsignado === vendedor
      );
    }

    this.dataSource.data = datosFiltrados;
  }

  limpiarFiltros(): void {
    this.filtroNombre.setValue('');
    this.filtroEstado.setValue('');
    this.filtroVendedor.setValue('');
  }

  asignarVendedor(cliente: ClienteWeb): void {
    console.log('🔄 [DashboardComponent] Abriendo diálogo asignar vendedor...');
    console.log('🔍 [DashboardComponent] Cliente:', cliente);
    console.log(
      '🔍 [DashboardComponent] Vendedores disponibles:',
      this.vendedores.length
    );

    // ⭐ VERIFICAR QUE HAY VENDEDORES
    if (!this.vendedores || this.vendedores.length === 0) {
      console.error('❌ [DashboardComponent] No hay vendedores cargados');
      this.mostrarMensaje('No hay vendedores disponibles para asignar', true);
      return;
    }

    const dialogRef = this.dialog.open(AsignarVendedorDialogComponent, {
      width: '500px',
      data: {
        cliente: cliente,
        vendedores: this.vendedores, // ⭐ ASEGURAR QUE SE PASE
      },
    });

    console.log('🔍 [DashboardComponent] Datos enviados al diálogo:', {
      cliente: cliente.nombre,
      vendedoresCount: this.vendedores.length,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      console.log(
        '🔄 [DashboardComponent] Diálogo cerrado con resultado:',
        resultado
      );

      if (resultado) {
        console.log('✅ [DashboardComponent] Asignando vendedor...');
        this.clientesService
          .asignarVendedor(
            cliente.id!,
            resultado.vendedorId,
            resultado.nombreVendedor
          )
          .then(() => {
            this.mostrarMensaje('Vendedor asignado correctamente');
            if (resultado.notas) {
              this.clientesService.agregarNotas(cliente.id!, resultado.notas);
            }
          })
          .catch((error) => {
            console.error('Error:', error);
            this.mostrarMensaje('Error al asignar vendedor', true);
          });
      }
    });
  }

  verDetalle(cliente: ClienteWeb): void {
    this.dialog.open(DetalleClienteDialogComponent, {
      width: '600px',
      data: { cliente },
    });
  }

  cambiarEstado(cliente: ClienteWeb, nuevoEstado: EstadoCliente): void {
    this.clientesService
      .actualizarEstado(cliente.id!, nuevoEstado)
      .then(() => {
        this.mostrarMensaje('Estado actualizado correctamente');
      })
      .catch((error) => {
        this.mostrarMensaje('Error al actualizar estado', true);
      });
  }

  exportarDatos(): void {
    // Implementar exportación a CSV/Excel
    const csv = this.convertirACSV(this.dataSource.data);
    this.descargarCSV(csv, 'clientes-web.csv');
  }

  private convertirACSV(datos: ClienteWeb[]): string {
    const headers = [
      'Nombre',
      'Email',
      'Teléfono',
      'Fecha Registro',
      'Estado',
      'Vendedor',
    ];
    const csvContent = [
      headers.join(','),
      ...datos.map((cliente) =>
        [
          cliente.nombre,
          cliente.email,
          cliente.telefono,
          new Date(cliente.fechaRegistro).toLocaleDateString(),
          cliente.estado,
          cliente.nombreVendedor || 'Sin asignar',
        ].join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  private descargarCSV(csvContent: string, nombreArchivo: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private mostrarMensaje(mensaje: string, esError: boolean = false): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: esError ? ['error-snackbar'] : ['success-snackbar'],
    });
  }

  // Métodos de utilidad para la vista
  getColorEstado(estado: EstadoCliente): string {
    const colores = {
      [EstadoCliente.NUEVO]: 'bg-blue-100 text-blue-800',
      [EstadoCliente.ASIGNADO]: 'bg-yellow-100 text-yellow-800',
      [EstadoCliente.CONTACTADO]: 'bg-orange-100 text-orange-800',
      [EstadoCliente.EN_NEGOCIACION]: 'bg-purple-100 text-purple-800',
      [EstadoCliente.CAPTADO]: 'bg-green-100 text-green-800',
      [EstadoCliente.DESCARTADO]: 'bg-red-100 text-red-800',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  }

  getClienteInfo(cliente: ClienteWeb): string {
    const parts = [];
    if (cliente.edad) parts.push(`${cliente.edad} años`);
    if (cliente.genero) parts.push(cliente.genero);
    return parts.join(' • ');
  }
  // ⭐ Método para mostrar el interés/mensaje
  getInteres(cliente: ClienteWeb): string {
    return cliente.mensaje || 'Sin mensaje';
  }

  // ⭐ Método para contactar cliente según su preferencia
  contactarCliente(cliente: ClienteWeb): void {
    console.log('📞 [DashboardComponent] Contactando cliente:', {
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      preferencia: cliente.preferenciaContacto,
      email: cliente.email,
    });

    if (cliente.preferenciaContacto === 'WhatsApp' && cliente.telefono) {
      const mensaje = encodeURIComponent(
        `Hola ${cliente.nombres?.trim()}, me comunico desde [Tu Empresa] respecto a tu consulta: "${cliente.mensaje?.substring(
          0,
          100
        )}..."`
      );

      console.log(
        '📱 [DashboardComponent] Abriendo WhatsApp con mensaje:',
        mensaje
      );
      window.open(
        `https://wa.me/51${cliente.telefono}?text=${mensaje}`,
        '_blank'
      );

      // Marcar como contactado
      this.marcarComoContactado(cliente);
    } else {
      const subject = encodeURIComponent(
        'Respuesta a tu consulta de motocicleta'
      );
      const body = encodeURIComponent(
        `Hola ${cliente.nombres?.trim()},\n\nGracias por contactarnos respecto a: "${
          cliente.mensaje
        }"\n\nNos pondremos en contacto contigo pronto.\n\nSaludos,\n[Tu Empresa]`
      );

      console.log('📧 [DashboardComponent] Abriendo email');
      window.open(
        `mailto:${cliente.email}?subject=${subject}&body=${body}`,
        '_blank'
      );

      // Marcar como contactado
      this.marcarComoContactado(cliente);
    }
  }

  private marcarComoContactado(cliente: ClienteWeb): void {
    if (cliente.id) {
      console.log(
        '✅ [DashboardComponent] Marcando cliente como contactado:',
        cliente.id
      );
      this.clientesService
        .marcarComoContactado(cliente.id)
        .then(() => {
          this.mostrarMensaje(
            `Cliente ${cliente.nombres} marcado como contactado`
          );
        })
        .catch((error) => {
          console.error('Error al marcar como contactado:', error);
        });
    }
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '';

    let date: Date;
    if (fecha instanceof Date) {
      date = fecha;
    } else if (fecha?.toDate) {
      date = fecha.toDate();
    } else {
      date = new Date(fecha);
    }

    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
  verificarMigracion(): void {
    this.clientesService
      .getClientesWeb()
      .pipe(takeUntil(this.destroy$))
      .subscribe((clientes) => {
        // Verificar si hay clientes sin estado (necesitan migración)
        const clientesSinEstado = clientes.filter((c) => !c.estado);
        this.datosYaMigrados = clientesSinEstado.length === 0;
      });
  }
  migrarDatos(): void {
    this.cargando = true;
    this.mostrarMensaje('Iniciando migración de datos...');

    this.clientesService
      .inicializarClientesParaAdmin()
      .then(() => {
        this.mostrarMensaje('Migración completada exitosamente');
        this.datosYaMigrados = true;

        // Recargar datos para ver los cambios
        setTimeout(() => {
          this.cargarDatos();
        }, 1000);
      })
      .catch((error) => {
        console.error('Error en migración:', error);
        this.mostrarMensaje('Error durante la migración', true);
        this.cargando = false;
      });
  }
}
