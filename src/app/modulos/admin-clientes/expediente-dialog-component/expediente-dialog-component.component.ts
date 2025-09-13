import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TablaGeneralComponent  } from '../tabla-general/tabla-general.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { SolicitudCredito } from '../modelos/modelos-solicitudes';

@Component({
  selector: 'app-expediente-dialog-component',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  templateUrl: './expediente-dialog-component.component.html',
  styleUrl: './expediente-dialog-component.component.css'
})
export class ExpedienteDialogComponentComponent {
   constructor(@Inject(MAT_DIALOG_DATA) public data: SolicitudCredito) {}

}
