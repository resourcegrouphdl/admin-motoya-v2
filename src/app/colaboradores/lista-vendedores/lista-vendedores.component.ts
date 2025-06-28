import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ColaboradoresService } from '../../services/colaboradores/colaboradores.service';
import { Vendedor } from '../../common_module/models/vendedor';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-lista-vendedores',
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
  templateUrl: './lista-vendedores.component.html',
  styleUrl: './lista-vendedores.component.css',
})
export class ListaVendedoresComponent  implements OnInit{
  
  lisTofAliados:Vendedor[] = [];

  constructor(private router: Router,private firebaseService:ColaboradoresService) {
    
  }
  ngOnInit(): void {
    this.obtenerAliados();
  }

  navegarPuntodeVenta() {
    this.router.navigate(['colaboradores/list-colaboradores']);
  }

  agregarVendedor() {
    this.router.navigate(['colaboradores/crear-aliado']);
  }

  async obtenerAliados() {
    this.firebaseService.getAllColaboradores('aliadosComerciales').subscribe(
      (data) => {
        this.lisTofAliados = data;
      },
      (error) => {
        console.error('Error fetching stores:', error);
      }
    );
  }
  


  eliminarProducto(id:string){}

  navigateToFichaTecnica(id:string){}

  editarProducto(id:string){}

}
