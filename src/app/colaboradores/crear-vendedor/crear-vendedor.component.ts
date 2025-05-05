import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { ColaboradoresService } from '../../services/colaboradores/colaboradores.service';

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

  isSAveForm:boolean = false;
  tableName:string = 'aliadosComerciales';

  formularioDeColaboradores: FormGroup;
  
    constructor(private router: Router, private fb: FormBuilder,private firebaseService: ColaboradoresService) {
      
      this.formularioDeColaboradores = this.fb.group({
        nombre: [''],
        apellido: [''],
        telefono1: [''],
        telefono2: [''],
        correo: [''],
        direccion: [''],
        puntoDeVentaAsociado: [''],
        imgenPerfil: [''],
        listaPreciosAsociada: [''],
      });
    }

    async onSubmit(){
      try{
        this.isSAveForm = true;
        this.firebaseService.seveFormularios(this.formularioDeColaboradores.value, this.tableName).then(() => {
          this.isSAveForm = false;
          this.volverALista();
        });
        

      }catch(error){
        console.error(error);
        
      }

    }

    volverALista(){
      this.router.navigate(['colaboradores/list-aliados']);
    }

    
}
