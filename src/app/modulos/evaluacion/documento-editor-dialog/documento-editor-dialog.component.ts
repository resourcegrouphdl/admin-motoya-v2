import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoDocumento, EstadoDocumento } from '../../admin-clientes/modelos/modelos-solicitudes';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";



export interface DocumentoEvaluadorData {
  tipoDocumento: TipoDocumento;
  nombreDocumento: string;
  urlDocumento: string;
  estadoActual: EstadoDocumento;
  clienteId: string;
  solicitudId: string;
  clienteNombre: string;
  readonly?: boolean;
}

export interface EvaluacionDocumento {
  tipoDocumento: TipoDocumento;
  estado: EstadoDocumento;
  observaciones?: string;
  checklistDNI?: {
    textoLegible: boolean;
    fotoClara: boolean;
    datosCompletos: boolean;
    documentoIntegro: boolean;
    sinAlteraciones: boolean;
  };
}



@Component({
  selector: 'app-documento-editor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
      
  ],
  templateUrl: './documento-editor-dialog.component.html',
  styleUrl: './documento-editor-dialog.component.css'
})
export class DocumentoEditorDialogComponent implements OnInit {
  
    evaluacionForm: FormGroup;
  guardando = false;
  cargandoImagen = true;
  errorCargaImagen = false;

  constructor(
    public dialogRef: MatDialogRef<DocumentoEditorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentoEvaluadorData,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.evaluacionForm = this.fb.group({
      estado: [this.data.estadoActual, Validators.required],
      observaciones: [''],
      textoLegible: [false],
      fotoClara: [false],
      datosCompletos: [false],
      documentoIntegro: [false],
      sinAlteraciones: [false]
    });
  }

  ngOnInit() {
    this.configurarValidadores();
  }

  private configurarValidadores() {
    this.evaluacionForm.get('estado')?.valueChanges.subscribe(estado => {
      const observacionesControl = this.evaluacionForm.get('observaciones');
      
      if (estado === 'aprobado') {
        observacionesControl?.clearValidators();
        observacionesControl?.setValue('');
      } else {
        observacionesControl?.setValidators([Validators.required, Validators.minLength(10)]);
      }
      observacionesControl?.updateValueAndValidity();
    });
  }

  onImageLoad() {
    this.cargandoImagen = false;
    this.errorCargaImagen = false;
  }

  onImageError() {
    this.cargandoImagen = false;
    this.errorCargaImagen = true;
  }

  recargarImagen() {
    this.cargandoImagen = true;
    this.errorCargaImagen = false;
    
    // Forzar recarga de la imagen agregando timestamp
    const img = document.querySelector('.documento-imagen') as HTMLImageElement;
    if (img) {
      const url = new URL(this.data.urlDocumento);
      url.searchParams.set('t', Date.now().toString());
      img.src = url.toString();
    }
  }

  abrirEnNuevaTab() {
    window.open(this.data.urlDocumento, '_blank');
  }

  async descargarImagen() {
    try {
      const response = await fetch(this.data.urlDocumento);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.data.tipoDocumento}_${this.data.clienteId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      this.mostrarError('Error al descargar la imagen');
    }
  }

  esDocumentoDNI(): boolean {
    return this.data.tipoDocumento === 'dniFrente' || this.data.tipoDocumento === 'dniReverso';
  }

  requiereObservaciones(): boolean {
    const estado = this.evaluacionForm.get('estado')?.value;
    return estado === 'observado' || estado === 'rechazado';
  }

  validarChecklistDNI(): boolean {
    const valores = this.evaluacionForm.value;
    return valores.textoLegible && valores.fotoClara && 
           valores.datosCompletos && valores.documentoIntegro && 
           valores.sinAlteraciones;
  }

  puedeGuardar(): boolean {
    const formValido = this.evaluacionForm.valid;
    
    if (this.esDocumentoDNI() && this.evaluacionForm.value.estado === 'aprobado') {
      return formValido && this.validarChecklistDNI();
    }
    
    return formValido;
  }

  obtenerIconoDocumento(): string {
    const iconos: { [key: string]: string } = {
      dniFrente: 'badge',
      dniReverso: 'badge',
      reciboServicio: 'receipt',
      fachada: 'home',
      selfie: 'photo_camera',
      licenciaConducir: 'credit_card',
      constanciaTrabajo: 'work',
      recibosIngresos: 'attach_money'
    };
    return iconos[this.data.tipoDocumento] || 'description';
  }

  onEstadoChange() {
    // Los validadores se manejan automáticamente
  }

  async guardarEvaluacion() {
    if (!this.puedeGuardar()) return;
    
    this.guardando = true;
    
    try {
      const evaluacion: EvaluacionDocumento = {
        tipoDocumento: this.data.tipoDocumento,
        estado: this.evaluacionForm.value.estado,
        observaciones: this.evaluacionForm.value.observaciones
      };

      // Agregar checklist DNI si aplica
      if (this.esDocumentoDNI() && this.evaluacionForm.value.estado === 'aprobado') {
        evaluacion.checklistDNI = {
          textoLegible: this.evaluacionForm.value.textoLegible,
          fotoClara: this.evaluacionForm.value.fotoClara,
          datosCompletos: this.evaluacionForm.value.datosCompletos,
          documentoIntegro: this.evaluacionForm.value.documentoIntegro,
          sinAlteraciones: this.evaluacionForm.value.sinAlteraciones
        };
      }

      this.dialogRef.close(evaluacion);
      
    } catch (error) {
      this.mostrarError('Error al guardar la evaluación');
    } finally {
      this.guardando = false;
    }
  }

  cerrar() {
    this.dialogRef.close();
  }

  private mostrarError(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
  }
}