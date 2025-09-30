import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import {
  BaseProfile,
  UserType,
} from '../../adminusuarios/enums/user-type.types';
import { VendedorService } from '../services/vendedor.service';

export interface AsesorSeleccionado {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

@Component({
  selector: 'app-selector-asesor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './selector-asesor-dialog.component.html',
  styleUrl: './selector-asesor-dialog.component.css',
})
export class SelectorAsesorDialogComponent {
  asesores: BaseProfile[] = [];
  asesoresFiltrados: BaseProfile[] = [];
  asesorSeleccionado: BaseProfile | null = null;
  filtro: string = '';
  cargando: boolean = false;
  error: string | null = null;

  _vendedorService = inject(VendedorService);

  constructor(
    private dialogRef: MatDialogRef<SelectorAsesorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log('SelectorAsesorDialogComponent - Constructor iniciado');
    console.log('Data recibida en el diálogo:', this.data);
  }

  ngOnInit(): void {
    console.log('SelectorAsesorDialogComponent - ngOnInit iniciado');
    this.cargarAsesores();
  }

  async cargarAsesores(): Promise<void> {
    console.log('cargarAsesores() - INICIO');
    this.cargando = true;
    this.error = null;

    try {
      console.log('Verificando cache de usuarios...');
      
      // Primero intentar obtener del cache usando el método seguro
      let usuariosCache: BaseProfile[] = [];
      
      if (this._vendedorService.getUsersFromCache) {
        usuariosCache = this._vendedorService.getUsersFromCache();
        console.log('Usuarios del cache:', {
          existe: !!usuariosCache,
          esArray: Array.isArray(usuariosCache),
          cantidad: usuariosCache?.length || 0
        });
      }

      if (usuariosCache && usuariosCache.length > 0) {
        console.log('Usando datos del cache');
        this.procesarUsuarios(usuariosCache);
      } else {
        console.log('Cache vacío, cargando desde Firestore...');
        
        if (!this._vendedorService.getAllAdministrativeUsers) {
          console.error('El método getAllAdministrativeUsers() no existe en VendedorService');
          throw new Error('Método getAllAdministrativeUsers no disponible');
        }

        console.log('Cargando usuarios desde Firestore...');
        const usuariosFirestore = await this._vendedorService.getAllAdministrativeUsers();
        
        console.log('Usuarios de Firestore:', {
          existe: !!usuariosFirestore,
          esArray: Array.isArray(usuariosFirestore),
          cantidad: usuariosFirestore?.length || 0
        });

        this.procesarUsuarios(usuariosFirestore || []);
      }
    } catch (err) {
      console.error('Error en cargarAsesores():', err);
      this.error = 'Error al cargar la lista de usuarios administrativos';
    } finally {
      console.log('cargarAsesores() - FINALIZANDO');
      this.cargando = false;
    }
  }

  private procesarUsuarios(usuarios: BaseProfile[]): void {
    console.log('procesarUsuarios() - INICIO');
    
    // Validación defensiva para asegurar que usuarios es un array
    const usuariosArray = Array.isArray(usuarios) ? usuarios : [];
    
    console.log('Datos recibidos para procesar:', {
      existe: !!usuarios,
      esArray: Array.isArray(usuarios),
      cantidad: usuariosArray.length,
      tiposDeUsuarios: usuariosArray.map(u => u?.userType).filter((v, i, a) => v && a.indexOf(v) === i)
    });

    if (usuariosArray.length > 0) {
      console.log('Filtrando usuarios activos...');
      
      // Filtrar usuarios activos con validación adicional
      this.asesores = usuariosArray.filter(
        (usuario) => usuario && usuario.isActive !== false && usuario.uid && usuario.firstName
      );

      console.log('Usuarios después del filtro:', {
        cantidadOriginal: usuariosArray.length,
        cantidadFiltrada: this.asesores.length
      });

      this.asesoresFiltrados = [...this.asesores];

      if (this.asesores.length === 0) {
        console.warn('No se encontraron usuarios activos después del filtro');
        this.error = 'No se encontraron usuarios administrativos disponibles';
      } else {
        console.log('Usuarios cargados exitosamente:', this.asesores.length);
      }
    } else {
      console.warn('No hay datos de usuarios para procesar');
      this.error = 'No hay datos de usuarios disponibles';
      this.asesores = [];
      this.asesoresFiltrados = [];
    }

    console.log('procesarUsuarios() - FIN');
  }

  filtrarAsesores(): void {
    console.log('filtrarAsesores() - Filtro aplicado:', this.filtro);
    
    if (!this.filtro.trim()) {
      this.asesoresFiltrados = [...this.asesores];
      console.log('Filtro vacío, mostrando todos los usuarios:', this.asesoresFiltrados.length);
      return;
    }

    const filtroLower = this.filtro.toLowerCase();
    this.asesoresFiltrados = this.asesores.filter(
      (asesor) =>
        asesor.firstName?.toLowerCase().includes(filtroLower) ||
        asesor.email?.toLowerCase().includes(filtroLower) ||
        asesor.userType?.toLowerCase().includes(filtroLower)
    );

    console.log('Resultado del filtro:', {
      filtroAplicado: filtroLower,
      usuariosOriginales: this.asesores.length,
      usuariosFiltrados: this.asesoresFiltrados.length
    });
  }

  onSelectionChange(event: any): void {
    console.log('onSelectionChange() - Evento:', event);
    
    if (event.options && event.options.length > 0) {
      this.asesorSeleccionado = event.options[0].value;
      console.log('Usuario seleccionado:', {
        uid: this.asesorSeleccionado?.uid,
        nombre: this.asesorSeleccionado?.firstName,
        email: this.asesorSeleccionado?.email,
        tipo: this.asesorSeleccionado?.userType
      });
    } else {
      this.asesorSeleccionado = null;
      console.log('Selección cancelada');
    }
  }

  confirmar(): void {
    console.log('confirmar() - INICIO');
    
    if (this.asesorSeleccionado) {
      const resultado: AsesorSeleccionado = {
        id: this.asesorSeleccionado.uid,
        nombre: `${this.asesorSeleccionado.firstName} ${
          this.asesorSeleccionado.lastName || ''
        }`.trim(),
        email: this.asesorSeleccionado.email,
        rol: this.asesorSeleccionado.userType || 'N/A',
      };
      console.log('Asesor seleccionado para asignar:', resultado, this.data.solicitudId);
      this._vendedorService.asignarAsesor(resultado, this.data.solicitudId);

      console.log('Resultado que se enviará:', resultado);
      this.dialogRef.close(resultado);
    } else {
      console.warn('No hay usuario seleccionado para confirmar');
    }
  }

  cancelar(): void {
    console.log('cancelar() - Diálogo cancelado');
    this.dialogRef.close(null);
  }

  // Método para recargar manualmente si es necesario
  async recargarDesdeFirestore(): Promise<void> {
    console.log('recargarDesdeFirestore() - INICIO');
    this.cargando = true;
    this.error = null;

    try {
      console.log('Forzando carga desde Firestore...');
      const usuarios = await this._vendedorService.getAllAdministrativeUsers();
      console.log('Usuarios recargados desde Firestore:', usuarios?.length || 0);
      this.procesarUsuarios(usuarios || []);
    } catch (err) {
      console.error('Error al recargar usuarios:', err);
      this.error = 'Error al recargar la lista de usuarios';
    } finally {
      this.cargando = false;
      console.log('recargarDesdeFirestore() - FIN');
    }
  }
}