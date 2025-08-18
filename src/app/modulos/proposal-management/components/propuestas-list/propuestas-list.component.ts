import { Component } from '@angular/core';
import { Propuesta, PropuestaService } from '../../services/propuesta.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EMPTY, Observable } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { EvaluacionDialogComponent } from '../evaluacion-dialog/evaluacion-dialog.component';
import {
  MatCardActions,
  MatCardContent,
  MatCardTitle,
  MatCardSubtitle,
  MatCardHeader,
  MatCard,
} from '@angular/material/card';
import { MatLabel, MatFormField } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { TitleCasePipe } from '@angular/common';
import { DecimalPipe } from '@angular/common';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-propuestas-list',
  standalone: true,
  imports: [
    MatDialogModule,
    MatSnackBarModule,
    MatIcon,
    MatCardActions,
    MatCardContent,
    MatCardTitle,
    MatCardSubtitle,
    MatCardHeader,
    MatCard,
    MatLabel,
    MatFormField,
    MatOption,
    MatSelect,
    DatePipe,
    NgIf,
    NgFor,
    TitleCasePipe,
    CommonModule,
    DecimalPipe,
    AsyncPipe,
  ],
  templateUrl: './propuestas-list.component.html',
  styleUrl: './propuestas-list.component.css',
})
export class PropuestasListComponent {
  propuestas$: Observable<Propuesta[]> =EMPTY ;
  filtroEstado: string = 'pendiente';

  constructor(
    
    private propuestaService: PropuestaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.propuestas$ = this.propuestaService.getPropuestas();
  }

  evaluarPropuesta(propuesta: Propuesta): void {
    const dialogRef = this.dialog.open(EvaluacionDialogComponent, {
      width: '600px',
      data: propuesta,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.procesarEvaluacion(
          propuesta.id,
          result.decision,
          result.comentarios
        );
      }
    });
  }

  private procesarEvaluacion(
    id: number,
    decision: 'aprobada' | 'rechazada',
    comentarios: string
  ): void {
    this.propuestaService
      .evaluarPropuesta(id, decision, comentarios)
      .subscribe({
        next: (success) => {
          if (success) {
            this.snackBar.open(
              `Propuesta ${decision} correctamente`,
              'Cerrar',
              { duration: 3000 }
            );
          }
        },
        error: (error) => {
          this.snackBar.open('Error al evaluar propuesta', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }

  filtrarPorEstado(propuestas: Propuesta[]): Propuesta[] {
    if (this.filtroEstado === 'todas') {
      return propuestas;
    }
    return propuestas.filter((p) => p.estado === this.filtroEstado);
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aprobada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'schedule';
      case 'aprobada':
        return 'check_circle';
      case 'rechazada':
        return 'cancel';
      default:
        return 'help';
    }
  }
}
