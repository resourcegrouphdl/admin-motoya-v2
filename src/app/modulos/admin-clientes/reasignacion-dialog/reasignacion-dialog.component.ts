import { Component, computed, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { EvaluacionCreditosService } from '../services/evaluacion-creditos.service';
import { SolicitudCredito, TipoEvaluacion } from '../modelos/modelos-solicitudes';

interface EvaluadorDisponible {
  id: string;
  nombre: string;
  especialidad: TipoEvaluacion;
  cargaTrabajo: {
    solicitudesAsignadas: number;
    solicitudesPendientes: number;
    tiempoPromedioEvaluacion: number;
  };
  disponible: boolean;
}

@Component({
  selector: 'app-reasignacion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    ReactiveFormsModule
  ],
  templateUrl: './reasignacion-dialog.component.html',
  styleUrl: './reasignacion-dialog.component.css'
})
export class ReasignacionDialogComponent {
private readonly evaluacionService = inject(EvaluacionCreditosService);
  private readonly fb = inject(FormBuilder);

  // Signals para el estado del componente
  readonly cargandoEvaluadores = signal<boolean>(false);
  readonly evaluadoresDisponibles = signal<EvaluadorDisponible[]>([]);
  readonly evaluadorSeleccionado = signal<EvaluadorDisponible | null>(null);
  readonly procesando = signal<boolean>(false);

  // Formulario reactivo
  readonly reasignacionForm: FormGroup;

  // Computed properties
  readonly evaluadorActual = computed(() => {
    // TODO: Obtener nombre real del evaluador actual
    return this.data.solicitud.evaluadorActualId ? 
      `Evaluador ${this.data.solicitud.evaluadorActualId.slice(-4)}` : 
      null;
  });

  readonly puedeReasignar = computed(() => {
    return this.reasignacionForm.valid && 
           this.evaluadorSeleccionado() !== null &&
           !this.procesando();
  });

  constructor(
    public dialogRef: MatDialogRef<ReasignacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { solicitud: SolicitudCredito }
  ) {
    this.reasignacionForm = this.fb.group({
      tipoEvaluacion: ['', Validators.required],
      motivo: ['', Validators.required],
      observaciones: ['']
    });

    // Configurar validación condicional para observaciones
    this.reasignacionForm.get('motivo')?.valueChanges.subscribe(motivo => {
      const observacionesControl = this.reasignacionForm.get('observaciones');
      if (motivo === 'otro') {
        observacionesControl?.setValidators([Validators.required]);
      } else {
        observacionesControl?.clearValidators();
      }
      observacionesControl?.updateValueAndValidity();
    });

    // Pre-seleccionar tipo de evaluación basado en el estado actual
    this.preseleccionarTipoEvaluacion();
  }

  private preseleccionarTipoEvaluacion(): void {
    const estado = this.data.solicitud.estado;
    let tipoEvaluacion: TipoEvaluacion = 'documental';

    switch (estado) {
      case 'evaluacion_documental':
      case 'documentos_observados':
        tipoEvaluacion = 'documental';
        break;
      case 'evaluacion_garantes':
      case 'garante_rechazado':
        tipoEvaluacion = 'garantes';
        break;
      case 'entrevista_programada':
      case 'en_entrevista':
        tipoEvaluacion = 'entrevista';
        break;
      case 'en_decision':
        tipoEvaluacion = 'decision_final';
        break;
    }

    this.reasignacionForm.patchValue({ tipoEvaluacion });
    this.cargarEvaluadores();
  }

  async cargarEvaluadores(): Promise<void> {
    const tipoEvaluacion = this.reasignacionForm.get('tipoEvaluacion')?.value;
    if (!tipoEvaluacion) {
      this.evaluadoresDisponibles.set([]);
      return;
    }

    this.cargandoEvaluadores.set(true);
    this.evaluadorSeleccionado.set(null);

    try {
      // Obtener evaluadores por tipo
      const evaluadores = await this.evaluacionService.obtenerEvaluadoresPorTipo(tipoEvaluacion);
      
      // Obtener carga de trabajo para cada evaluador
      const evaluadoresConCarga = await Promise.all(
        evaluadores.map(async (evaluador) => {
          const cargaTrabajo = await this.evaluacionService.obtenerCargaTrabajoEvaluador(evaluador.id);
          
          return {
            ...evaluador,
            cargaTrabajo,
            disponible: cargaTrabajo.solicitudesPendientes < 10 // Máximo 10 solicitudes pendientes
          } as EvaluadorDisponible;
        })
      );

      // Ordenar por disponibilidad y carga de trabajo
      evaluadoresConCarga.sort((a, b) => {
        if (a.disponible !== b.disponible) {
          return a.disponible ? -1 : 1;
        }
        return a.cargaTrabajo.solicitudesPendientes - b.cargaTrabajo.solicitudesPendientes;
      });

      this.evaluadoresDisponibles.set(evaluadoresConCarga);
      
    } catch (error) {
      console.error('Error cargando evaluadores:', error);
      this.evaluadoresDisponibles.set([]);
    } finally {
      this.cargandoEvaluadores.set(false);
    }
  }

  seleccionarEvaluador(evaluador: EvaluadorDisponible): void {
    if (!evaluador.disponible) return;
    
    this.evaluadorSeleccionado.set(evaluador);
  }

  trackByEvaluadorId(index: number, evaluador: EvaluadorDisponible): string {
    return evaluador.id;
  }

  formatearEspecialidad(especialidad: TipoEvaluacion): string {
    const especialidades: { [key in TipoEvaluacion]: string } = {
      'revision_inicial': 'Revisión Inicial',
      'documental': 'Evaluación Documental',
      'garantes': 'Evaluación de Garantes',
      'entrevista': 'Entrevistas',
      'decision_final': 'Decisión Final'
    };
    return especialidades[especialidad];
  }

  calcularPorcentajeCarga(solicitudesAsignadas: number): number {
    const maxSolicitudes = 15; // Máximo recomendado
    return Math.min(100, (solicitudesAsignadas / maxSolicitudes) * 100);
  }

  async confirmarReasignacion(): Promise<void> {
    if (!this.puedeReasignar()) return;

    this.procesando.set(true);

    try {
      const evaluadorSeleccionado = this.evaluadorSeleccionado()!;
      const motivo = this.reasignacionForm.get('motivo')?.value;
      const observaciones = this.reasignacionForm.get('observaciones')?.value;

      // Construir mensaje de motivo
      let mensajeMotivo = this.formatearMotivoReasignacion(motivo);
      if (observaciones) {
        mensajeMotivo += `. Observaciones: ${observaciones}`;
      }

      // Realizar la reasignación
      await this.evaluacionService.asignarEvaluador(
        this.data.solicitud.id,
        evaluadorSeleccionado.id,
        evaluadorSeleccionado.nombre,
        'usuario_actual', // TODO: Obtener usuario actual
        'Usuario Actual'
      );

      // Cerrar diálogo con resultado exitoso
      this.dialogRef.close({
        success: true,
        evaluadorId: evaluadorSeleccionado.id,
        evaluadorNombre: evaluadorSeleccionado.nombre,
        motivo: mensajeMotivo
      });

    } catch (error) {
      console.error('Error reasignando solicitud:', error);
      // El error se manejará en el componente padre
      this.dialogRef.close({
        success: false,
        error: 'Error al reasignar la solicitud'
      });
    } finally {
      this.procesando.set(false);
    }
  }

  private formatearMotivoReasignacion(motivo: string): string {
    const motivos: { [key: string]: string } = {
      'carga_trabajo': 'Redistribución de carga de trabajo',
      'especialidad': 'Requiere especialización específica',
      'urgente': 'Solicitud marcada como urgente',
      'ausencia': 'Ausencia del evaluador anterior',
      'otro': 'Motivo específico'
    };
    return motivos[motivo] || motivo;
  }
}
