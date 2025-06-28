import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Direccion } from '../../common_module/models/direccion';
import { Tienda } from '../../common_module/models/tienda';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { ColaboradoresService } from '../../services/colaboradores/colaboradores.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-tiendas',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatIcon, MatCardModule,MatProgressBarModule],
  templateUrl: './tiendas.component.html',
  styleUrl: './tiendas.component.css',
})
export class TiendasComponent implements OnInit {
  // Define the list of stores with their details
  puntosDeVenta: Tienda[] = [];
  mock = 'https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqALXWh9Sle31a1DOIKXsI3b5lstRqrgFwRYdR2nsIu_bMYEbs8TWlr9V5sJTegIdSMF-ukEPoZay00vn5QF0v9DHLUsknX21b1WWSJFfFW7jnl-cPRsVFnotBV5XLOKZye9gl2rQ=w408-h544-k-no';
  isLoading:boolean = true

  constructor(
    private router: Router,
    private colaboradoresServices: ColaboradoresService
  ) {}
  ngOnInit(): void {
    this.getAlltiendas();
  }

  // Define the list of addresses with their details
  navegar() {
    this.router.navigate(['dashboard/tiendas/crear-tienda']);
    console.log('Editing product with ID:');
  }
 

  async getAlltiendas() {
    await this.colaboradoresServices.getAllProducts('tienda').subscribe(
      (data) => {
        this.puntosDeVenta = data;
        this.isLoading = false;
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

  detallesComponentNavegar(id:string){
    this.colaboradoresServices.setIdTienda(id);
    this.router.navigate(['dashboard/tiendas/info-tienda']);

  }
}
