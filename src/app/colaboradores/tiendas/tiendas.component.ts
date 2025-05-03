import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Direccion } from '../../common_module/models/direccion';
import { Tienda } from '../../common_module/models/tienda';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { ColaboradoresService } from '../../services/colaboradores/colaboradores.service';

@Component({
  selector: 'app-tiendas',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatIcon, MatCardModule],
  templateUrl: './tiendas.component.html',
  styleUrl: './tiendas.component.css',
})
export class TiendasComponent implements OnInit {
  // Define the list of stores with their details
  puntosDeVenta: Tienda[] = [];
  mock = 'https://material.angular.io/assets/img/examples/shiba2.jpg';

  constructor(
    private router: Router,
    private colaboradoresServices: ColaboradoresService
  ) {}
  ngOnInit(): void {
    this.getAlltiendas();
  }

  // Define the list of addresses with their details
  navegar() {
    this.router.navigate(['colaboradores/crear-colaborador']);
    console.log('Editing product with ID:');
  }
  navegarVendedores() {
    this.router.navigate(['colaboradores/list-aliados']);
    console.log('Editing product with ID:');
  }

  async getAlltiendas() {
    await this.colaboradoresServices.getAllProducts('tienda').subscribe(
      (data) => {
        this.puntosDeVenta = data;
      },
      (error) => {
        console.error('Error fetching stores:', error);
      }
    );
  }

  verDetalles(id: string): void {
    // Implement the logic to view details of a specific store
    console.log('Viewing details for store with ID:', id);
  }
}
