import { Component, inject, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClienteMigrationService } from '../../servicios/cliente-migration.service';
import { FormularioFirebase } from '../tabla-de-solicitudes/tabla-de-solicitudes.component';
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/**
 * Interface para la respuesta del diálogo
 */
export interface RespuestaDialogoMigracion {
  exito: boolean;
  confirmado: boolean;
  mensaje?: string;
  codigoSolicitud?: string;
  idSolicitud?: string;
  error?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    MatButtonModule, 
    MatProgressBarModule, 
    CommonModule, 
    MatDialogModule, 
    MatIconModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent implements OnInit {

  private _clienteMigracionService = inject(ClienteMigrationService);
  private _snackBar = inject(MatSnackBar);

  // Estado del componente
  solicitudPadre: FormularioFirebase | null = null;
  idSemilla: string = '';
  
  // Estados de la operación
  cargandoSolicitud: boolean = false;
  solicitudCargada: boolean = false;
  errorCarga: boolean = false;
  mensajeError: string = '';
  
  // Estado de la migración
  ejecutandoMigracion: boolean = false;
  migracionCompletada: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string }
  ) {}

  async ngOnInit(): Promise<void> {
    this.idSemilla = this.data.id;
    await this.cargarSolicitudPadre();
  }

  /**
   * Carga la solicitud padre desde Firebase
   */
  private async cargarSolicitudPadre(): Promise<void> {
    try {
      this.cargandoSolicitud = true;
      this.errorCarga = false;
      this.mensajeError = '';
      
      console.log(`Cargando solicitud con ID: ${this.data.id}`);
      
      const solicitud = await this._clienteMigracionService.obtenerSolicitudDeCredito(this.data.id);
      
      if (solicitud) {
        this.solicitudPadre = solicitud;
        this.solicitudCargada = true;
        console.log('Solicitud cargada exitosamente:', solicitud);
      } else {
        throw new Error('No se encontró la solicitud especificada');
      }
      
    } catch (error: any) {
      console.error('Error al cargar solicitud padre:', error);
      this.errorCarga = true;
      this.mensajeError = error.message || 'Error desconocido al cargar la solicitud';
      this.mostrarError('Error al cargar la solicitud: ' + this.mensajeError);
    } finally {
      this.cargandoSolicitud = false;
    }
  }

  /**
   * Cancela la operación y cierra el diálogo sin ejecutar la migración
   */
  onCancel(): void {
    const respuesta: RespuestaDialogoMigracion = {
      exito: false,
      confirmado: false,
      mensaje: 'Operación cancelada por el usuario'
    };
    
    this.dialogRef.close(respuesta);
  }

  /**
   * Confirma la operación y ejecuta la migración
   */
  async onConfirm(): Promise<void> {
    if (!this.solicitudPadre) {
      this.mostrarError('No hay solicitud cargada para migrar');
      return;
    }

    if (this.ejecutandoMigracion) {
      return; // Evitar múltiples ejecuciones simultáneas
    }

    await this.ejecutarMigracion();
  }

  /**
   * Ejecuta la migración completa de la solicitud
   */
  private async ejecutarMigracion(): Promise<void> {
    try {
      this.ejecutandoMigracion = true;
      
      console.log('Iniciando proceso de migración...');
      
      if (!this.solicitudPadre) {
        throw new Error('No hay solicitud padre cargada');
      }

      // Ejecutar la migración y obtener el resultado
      const resultado = await this._clienteMigracionService.crearSolicitudDeCreditoEnBD(
        this.solicitudPadre, 
        this.idSemilla
      );

      if (resultado.exito) {
        this.migracionCompletada = true;
        
        console.log('✅ Migración completada exitosamente:', resultado);
        
        this.mostrarExito(
          `Solicitud migrada exitosamente. Código: ${resultado.codigoSolicitud}`
        );

        // Cerrar diálogo después de un breve delay para que el usuario vea el mensaje
        setTimeout(() => {
          const respuesta: RespuestaDialogoMigracion = {
            exito: true,
            confirmado: true,
            mensaje: resultado.mensaje,
            codigoSolicitud: resultado.codigoSolicitud,
            idSolicitud: resultado.idSolicitud
          };
          
          this.dialogRef.close(respuesta);
        }, 1500);

      } else {
        throw new Error(resultado.error || 'La migración no se completó correctamente');
      }

    } catch (error: any) {
      console.error('❌ Error en la migración:', error);
      
      this.mostrarError('Error en la migración: ' + (error.message || 'Error desconocido'));
      
      // Cerrar con respuesta de error
      const respuesta: RespuestaDialogoMigracion = {
        exito: false,
        confirmado: true,
        mensaje: 'Error durante la migración',
        error: error.message || 'Error desconocido'
      };
      
      setTimeout(() => {
        this.dialogRef.close(respuesta);
      }, 2000);

    } finally {
      this.ejecutandoMigracion = false;
    }
  }

  /**
   * Reintenta cargar la solicitud en caso de error
   */
  async reintentar(): Promise<void> {
    await this.cargarSolicitudPadre();
  }

  /**
   * Muestra mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    this._snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    this._snackBar.open(mensaje, 'Cerrar', {
      duration: 8000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Verifica si se puede confirmar la operación
   */
  get puedeConfirmar(): boolean {
    return this.solicitudCargada && 
           !this.ejecutandoMigracion && 
           !this.cargandoSolicitud && 
           !this.errorCarga &&
           !this.migracionCompletada &&
           !!this.solicitudPadre;
  }

  /**
   * Verifica si está en estado de carga
   */
  get estaCargando(): boolean {
    return this.cargandoSolicitud || this.ejecutandoMigracion;
  }

  /**
   * Obtiene el mensaje de estado actual
   */
  get mensajeEstado(): string {
    if (this.cargandoSolicitud) {
      return 'Cargando solicitud...';
    }
    if (this.ejecutandoMigracion) {
      return 'Migrando solicitud...';
    }
    if (this.migracionCompletada) {
      return 'Migración completada exitosamente';
    }
    if (this.errorCarga) {
      return `Error: ${this.mensajeError}`;
    }
    if (this.solicitudCargada) {
      return 'Solicitud lista para migrar';
    }
    return 'Preparando...';
  }
}