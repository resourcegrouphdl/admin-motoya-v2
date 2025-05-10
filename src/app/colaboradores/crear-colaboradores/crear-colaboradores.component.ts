import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
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

  

  direccionMaps: string = '';
  formularioDeColaboradores: FormGroup;
  isUploading: boolean = false; // Controla el estado del loader

  constructor(private fb: FormBuilder, private colaboradoresServices: ColaboradoresService ,private router: Router , private transitionService: TransitionService, private auth:AutenticacionService) {
    this.formularioDeColaboradores = this.fb.group({
      razonSocial: [''],
      direccion: [''],
      telefono: [''],
      correo: [''],
      contrasena: [''],
      horarioApertura: [''],
      horarioCierre: [''],
      imagen: [''],
    });
  }
  ngOnInit(): void {
   
  }

  async onSubmit() {
 
      try {
        // Intent
       this.isUploading = true;
       // amos guardar los datos de colaboradores
       await this.colaboradoresServices.seveFormularios(this.formularioDeColaboradores.value, 'tienda');
        console.log('Datos enviados correctamente:', this.formularioDeColaboradores.value);
        this.router.navigate(['/colaboradores'])

      } catch (error) {
        // Capturamos y mostramos el error en caso de fallo
        console.error('Error al enviar los datos:', error);
      }finally{
        this.transitionService.startFadeOut();
        await new Promise((resolve) => setTimeout(resolve, 500));
        await this.router.navigate(['/list-colaboradores']);
        this.formularioDeColaboradores.reset();
        this.isUploading = false;
      }
  }

  buscarUbicacion(){}

  navegarPuntodeVenta(){
    this.router.navigate(['colaboradores/list-colaboradores']);
  }

  async crearCuenta(email:string){
    const uuidUsuario = await this.auth.crearUsuarioConEmail(this.formularioDeColaboradores.value.email,this.formularioDeColaboradores.value.contrasena);   
  }
}
