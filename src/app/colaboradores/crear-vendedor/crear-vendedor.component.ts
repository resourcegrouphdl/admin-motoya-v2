import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { inject, Injectable } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { ColaboradoresService } from '../../services/colaboradores/colaboradores.service';
import { AutenticacionService } from '../../services/auth/autenticacion.service';
import { promociones } from '../../common_module/models/motocicleta';
import { TransitionService } from '../../shared/transition.service';

@Component({
  selector: 'app-crear-vendedor',
  standalone: true,
  imports: [
    MatIconModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  templateUrl: './crear-vendedor.component.html',
  styleUrl: './crear-vendedor.component.css',
})
export class CrearVendedorComponent {
  private _authService = inject(AutenticacionService);
  private _transitionService = inject(TransitionService);

  isSavingForm: boolean = false;
  tableName: string = 'aliadosComerciales';

  isLoading: boolean = false;
 
  
  showSuccessMessage = false;
  showErrorMessage = false;
  email: string = '';
  contrasena: string = '';

  formularioDeColaboradores: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private firebaseService: ColaboradoresService
  ) {
    this.formularioDeColaboradores = this.fb.group({
      nombre: [''],
      apellido: [''],
      telefono1: [''],
      telefono2: [''],
      correo: [''],
      contrasena: [''],
      direccion: [''],
      puntoDeVentaAsociado: [''],
      imgenPerfil: [''],
      listaPreciosAsociada: [''],
 
    });
  }

  async onSubmit() {
  if (this.isSavingForm) return; // Previene múltiples envíos simultáneos

  this.isSavingForm = true;

  try {
    // Validar el formulario antes de continuar
    if (this.formularioDeColaboradores.invalid) {
      console.warn('Formulario inválido');
      return;
    }

    // Crear la cuenta y obtener el UUID
     const uuid= await this.crearCuenta();
     
    console.log(uuid)
    // Guardar los datos en Firebase
    await this.firebaseService.seveFormularioDeVendedores(
      this.formularioDeColaboradores.value,
      this.tableName
    );

    // Transición de salida antes de redirigir
    this._transitionService.startFadeOut();
    await this.delay(500); // Espera medio segundo para efecto visual

    // Navegación y reseteo de formulario
    await this.router.navigate(['/colaboradores/list-aliados']);
    this.formularioDeColaboradores.reset();

  } catch (error) {
    console.error('Error al guardar el formulario:', error);
  } finally {
    this.isSavingForm = false;
  }
}

  volverALista() {
    this.router.navigate(['colaboradores/list-aliados']);
  }

  async crearCuenta(): Promise<any> {
  const uid = await this._authService.crearUsuarioConEmail(
    this.formularioDeColaboradores.value.correo,
    this.formularioDeColaboradores.value.contrasena
  );

  return uid; // esto es clave
}

  private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  
}
