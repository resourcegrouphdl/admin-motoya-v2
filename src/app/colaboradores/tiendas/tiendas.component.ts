import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import { Direccion } from '../../common_module/models/direccion';
import { Tienda } from '../../common_module/models/tienda';

@Component({
  selector: 'app-tiendas',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatIcon, MatCardModule],
  templateUrl: './tiendas.component.html',
  styleUrl: './tiendas.component.css'
})
export class TiendasComponent {
  // Define the list of stores with their details
  puntosDeVenta: Tienda[] =  [];
  mock = 'https://material.angular.io/assets/img/examples/shiba2.jpg';

  // Define the list of addresses with their details
  agregarNuevoPuntoDeVenta(): void {
    // Implement the logic to add a new point of sale
    console.log("Adding a new point of sale...");
  }


  verDetalles(id:string) : void {
    // Implement the logic to view details of a specific store
    console.log("Viewing details for store with ID:", id);
  }
}
