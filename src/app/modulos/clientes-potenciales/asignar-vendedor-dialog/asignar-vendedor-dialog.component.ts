import { Component, Inject } from '@angular/core';
import { MatFormField, MatError, MatFormFieldModule } from '@angular/material/form-field';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ClienteWeb, Vendedor } from '../models/clientes-web.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-asignar-vendedor-dialog',
  standalone: true,
  imports: [
    MatFormField,
    MatError,
    MatSelectModule,
    MatChipsModule,
    ReactiveFormsModule,
    MatChipsModule,
    MatChipsModule,
    NgIf,
    NgFor,
    CommonModule,
    MatIcon,

    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule
],
  templateUrl: './asignar-vendedor-dialog.component.html',
  styleUrl: './asignar-vendedor-dialog.component.css',
})
export class AsignarVendedorDialogComponent {
  form: FormGroup;
  vendedores: Vendedor[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AsignarVendedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { cliente: ClienteWeb; vendedores: Vendedor[] }
  ) {
    // ⭐ DEBUGGING - Ver qué datos llegan
    console.log('🔍 [AsignarVendedorDialog] Data recibida:', this.data);
    console.log('🔍 [AsignarVendedorDialog] Cliente:', this.data.cliente);
    console.log('🔍 [AsignarVendedorDialog] Vendedores:', this.data.vendedores);
    console.log('🔍 [AsignarVendedorDialog] Cantidad vendedores:', this.data.vendedores?.length || 0);

    // ⭐ ASIGNAR VENDEDORES
    this.vendedores = this.data.vendedores || [];
    
    if (this.vendedores.length === 0) {
      console.warn('⚠️ [AsignarVendedorDialog] No hay vendedores disponibles');
    } else {
      console.log('✅ [AsignarVendedorDialog] Vendedores cargados:', 
        this.vendedores.map(v => ({ id: v.id, nombre: v.nombre }))
      );
    }

    this.form = this.fb.group({
      vendedorId: [data.cliente.vendedorAsignado || '', Validators.required],
      notas: ['']
    });
  }

  asignar(): void {
    console.log('🔄 [AsignarVendedorDialog] Intentando asignar...');
    console.log('🔍 [AsignarVendedorDialog] Form value:', this.form.value);
    console.log('🔍 [AsignarVendedorDialog] Form valid:', this.form.valid);

    if (this.form.valid) {
      const vendedorId = this.form.value.vendedorId;
      const vendedorSeleccionado = this.vendedores.find(v => v.id === vendedorId);

      console.log('🔍 [AsignarVendedorDialog] Vendedor seleccionado:', vendedorSeleccionado);

      if (!vendedorSeleccionado) {
        console.error('❌ [AsignarVendedorDialog] No se encontró el vendedor seleccionado');
        return;
      }

      const resultado = {
        vendedorId: vendedorId,
        nombreVendedor: vendedorSeleccionado.nombre,
        notas: this.form.value.notas
      };

      console.log('✅ [AsignarVendedorDialog] Resultado:', resultado);
      this.dialogRef.close(resultado);
    } else {
      console.warn('⚠️ [AsignarVendedorDialog] Formulario inválido');
    }
  }

  cancelar(): void {
    console.log('❌ [AsignarVendedorDialog] Cancelado');
    this.dialogRef.close();
  }
}

// ⭐ TAMBIÉN VERIFICA EN TU COMPONENTE PRINCIPAL QUE LOS VENDEDORES SE PASEN CORRECTAMENTE
// dashboard-clientes.component.ts - MÉTODO asignarVendedor

