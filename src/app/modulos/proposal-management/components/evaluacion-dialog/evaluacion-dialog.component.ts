import { Component, Inject } from '@angular/core';
import { Propuesta } from '../../services/propuesta.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatError, MatLabel, MatFormField, MatHint } from "@angular/material/form-field";
import { NgIf } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-evaluacion-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatIcon,
    MatProgressSpinner,
    MatFormField,
    MatError,
    MatLabel,
    MatHint,
    MatDialogModule,
    ReactiveFormsModule,
    MatDialogModule,
    NgIf,
    MatSnackBarModule,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './evaluacion-dialog.component.html',
  styleUrl: './evaluacion-dialog.component.css'
})
export class EvaluacionDialogComponent {
evaluacionForm: FormGroup;
  isProcessing = false;

  constructor(
    public dialogRef: MatDialogRef<EvaluacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Propuesta,
    private fb: FormBuilder
  ) {
    this.evaluacionForm = this.fb.group({
      comentarios: ['', [Validators.maxLength(500)]]
    });
  }

  onAprobar(): void {
    if (this.evaluacionForm.valid && !this.isProcessing) {
      this.isProcessing = true;
      setTimeout(() => {
        this.dialogRef.close({
          decision: 'aprobada',
          comentarios: this.evaluacionForm.value.comentarios
        });
      }, 1000);
    }
  }

  onRechazar(): void {
    if (this.evaluacionForm.valid && !this.isProcessing) {
      this.isProcessing = true;
      setTimeout(() => {
        this.dialogRef.close({
          decision: 'rechazada',
          comentarios: this.evaluacionForm.value.comentarios
        });
      }, 1000);
    }
    }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
