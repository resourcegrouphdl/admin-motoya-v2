import {Component, OnInit} from '@angular/core';

import {MatIcon} from "@angular/material/icon";
import {MatProgressBar} from "@angular/material/progress-bar";
import {MatTooltip} from "@angular/material/tooltip";
import { Router, NavigationEnd } from '@angular/router';
import {ClientesmotoyaService} from "../../services/products/clientesmotoya.service";
import {ClientesAnalisis} from "../../common_module/models/clienteanalisis";

@Component({
  selector: 'app-reportes-clientes',
  standalone: true,
    imports: [
        MatIcon,
        MatProgressBar,
        MatTooltip
    ],
  templateUrl: './reportes-clientes.component.html',
  styleUrl: './reportes-clientes.component.css'
})
export class ReportesClientesComponent implements OnInit {

  isloading = true;

  clientesAnalises: ClientesAnalisis[] = [];
  modeloMasVendido: { [modelo: string]: number } = {};
  modeloMasVendidoArray: { puntoventa: string; marca: string; modelo: string; cantidad: number }[] = [];

  constructor( private clienteReporteService: ClientesmotoyaService, private router:Router) { }

    ngOnInit(): void {
      this.loadProducts();
      this.contarModelosVendidos();

      // Escuchar eventos de navegación
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.loadProducts();
          this.contarModelosVendidos();// Recargar los datos al regresar al componente
        }
      });
    }

  loadProducts() {
    this.isloading = true;
    this.clienteReporteService.getAllClienteAnalisis().subscribe(data => {
      this.clientesAnalises = data;
      this.contarModelosVendidos();
      this.isloading = false;
    });
  }


  contarModelosVendidos() {
    const conteo: { [clave: string]: {puntoventa: string; modelo: string; marca: string; cantidad: number } } = {};

    for (const item of this.clientesAnalises) {
      let puntoventa = item.formularioVehiculo?.puntoDeVenta;
      let modelo = item.formularioVehiculo?.modeloVehiculo;
      let marca = item.formularioVehiculo?.marcaVehiculo;

      if (modelo && marca && puntoventa) {
        puntoventa = normalizar(puntoventa);
        modelo = normalizar(modelo);
        marca = normalizar(marca);
        const clave = `${puntoventa}||${marca}||${modelo}`; // usamos esta clave compuesta




        if (!conteo[clave]) {
          conteo[clave] = { puntoventa,modelo, marca, cantidad: 1 };
        } else {
          conteo[clave].cantidad++;
        }
      }
    }

    // Ordenar primero por marca, luego por modelo
    this.modeloMasVendidoArray = Object.values(conteo).sort((a, b) => {
      const comparePunto = a.puntoventa.localeCompare(b.puntoventa);
      if (comparePunto !== 0) return comparePunto;

      const compareMarca = a.marca.localeCompare(b.marca);
      if (compareMarca !== 0) return compareMarca;

      return a.modelo.localeCompare(b.modelo);
    });
  }


}
function normalizar(texto: string): string {
  return texto.trim().toLowerCase();
}
