import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
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
import { ColaboradoresService } from '../../services/colaboradores/colaboradores.service';
import { Router } from '@angular/router';
import { TransitionService } from '../../shared/transition.service';
import { AutenticacionService } from '../../services/auth/autenticacion.service';

@Component({
  selector: 'app-crear-colaboradores',
  standalone: true,
  imports: [
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
  templateUrl: './crear-colaboradores.component.html',
  styleUrl: './crear-colaboradores.component.css',
})
export class CrearColaboradoresComponent implements OnInit {
  private _authService = inject(AutenticacionService);

  isSavingForm: boolean = false;

  direccionMaps: string = '';
  formularioDeColaboradores: FormGroup;
  isUploading: boolean = false; // Controla el estado del loader

  constructor(
    private fb: FormBuilder,
    private colaboradoresServices: ColaboradoresService,
    private router: Router,
    private transitionService: TransitionService,
    private auth: AutenticacionService
  ) {
    this.formularioDeColaboradores = this.fb.group({
      razonSocial: [''],
      direccion: [''],
      telefono: [''],
      correo: [''],
      contrasena: [''],
      imagen: [''],
      uidFirebase: [''],
      rolesId: ['tienda'],
    });
  }
  ngOnInit(): void {}

  async onSubmit() {
    if (this.isSavingForm) return; // Previene múltiples envíos simultáneos
    this.isSavingForm = true;

    try {
      if (this.formularioDeColaboradores.invalid) {
        console.warn('Formulario inválido');
        return;
      }

      

      const uuidUsuario = await this.crearCuenta();
      this.formularioDeColaboradores.patchValue({
        uidFirebase: uuidUsuario,
      });

      // Intent
      this.isUploading = true;
      // amos guardar los datos de colaboradores
      await this.colaboradoresServices.saveFormulariosconuid(
        this.formularioDeColaboradores.value,
        'tienda',uuidUsuario
      );
      console.log(
        'Datos enviados correctamente:',
        this.formularioDeColaboradores.value
      );
      //this.router.navigate(['ashboard/tiendas/list-tiendas'])
    } catch (error) {
      // Capturamos y mostramos el error en caso de fallo
      console.error('Error al enviar los datos:', error);
    } finally {
      this.transitionService.startFadeOut();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.router.navigate(['dashboard/tiendas/list-tiendas']);
      this.formularioDeColaboradores.reset();
      this.isUploading = false;
    }
  }

  buscarUbicacion() {}

  navegarPuntodeVenta() {
    this.router.navigate(['dashboard/tiendas/list-tiendas']);
  }

  async crearCuenta() {
    return await this.auth.crearUsuarioConEmail(
      this.formularioDeColaboradores.value.correo,
      this.formularioDeColaboradores.value.contrasena
    );
  }
}
