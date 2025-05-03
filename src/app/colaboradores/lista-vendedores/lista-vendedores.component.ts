import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-vendedores',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './lista-vendedores.component.html',
  styleUrl: './lista-vendedores.component.css'
})
export class ListaVendedoresComponent {

  constructor(private router: Router) { }

  navegarPuntodeVenta(){
    this.router.navigate(['colaboradores/list-colaboradores']);
  }

  agregarVendedor(){}

}
