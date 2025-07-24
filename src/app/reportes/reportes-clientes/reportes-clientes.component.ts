import {Component, OnInit} from '@angular/core';

import {MatIcon} from "@angular/material/icon";
import {MatProgressBar} from "@angular/material/progress-bar";
import {MatTooltip} from "@angular/material/tooltip";
import { Router, NavigationEnd } from '@angular/router';
import {ClientesmotoyaService} from "../../services/products/clientesmotoya.service";
import {ClientesAnalisis} from "../../common_module/models/clienteanalisis";
import {ChartComponent} from "ng-apexcharts";

@Component({
  selector: 'app-reportes-clientes',
  standalone: true,
  imports: [
    MatIcon,
    MatProgressBar,
    MatTooltip,
    ChartComponent
  ],
  templateUrl: './reportes-clientes.component.html',
  styleUrl: './reportes-clientes.component.css'
})
export class ReportesClientesComponent implements OnInit {

  resumenPorDistrito: { nombre: string; total: number }[] = [];
  chartSeries: any[] = [];
  chartOptions: any = {};

  resumenPorMarcas: { nombre: string; total: number }[] = [];
  chartSeriesMarcas: any[] = [];
  chartOptionsMarcas: any = {};

  isloading = true;

  clientesAnalises: ClientesAnalisis[] = [];
  modeloMasVendido: { [modelo: string]: number } = {};
  modeloMasVendidoArray: { distrito: string; marca: string;  cantidad: number }[] = [];

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

  contarVentasPorDistrito() {
    const conteo: { [distrito: string]: number } = {};

    for (const item of this.modeloMasVendidoArray) {
      const distrito = item.distrito;
      const cantidad = item.cantidad;

      if (conteo[distrito]) {
        conteo[distrito] += cantidad;
      } else {
        conteo[distrito] = cantidad;
      }
    }

    this.resumenPorDistrito = Object.entries(conteo)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  }

  contarVentasPorMarcas() {
    const conteo: { [marca: string]: number } = {};

    for (const item of this.modeloMasVendidoArray) {
      const marca = item.marca;
      const cantidad = item.cantidad;

      if (conteo[marca]) {
        conteo[marca] += cantidad;
      } else {
        conteo[marca] = cantidad;
      }
    }

    this.resumenPorMarcas = Object.entries(conteo)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  }




  contarModelosVendidos() {
    const conteo: { [clave: string]: { distrito: string; marca: string; cantidad: number } } = {};

    for (const item of this.clientesAnalises) {
      let distrito = item.formTitular?.distrito;
      let marca = item.formularioVehiculo?.marcaVehiculo;

      if ( marca && distrito) {
        distrito = normalizar(distrito);
        marca = normalizar(marca);
        const clave = `${distrito}||${marca}`; // usamos esta clave compuesta
        if (!conteo[clave]) {
          conteo[clave] = {  distrito, marca, cantidad: 1 };
        } else {
          conteo[clave].cantidad++;
        }
      }
    }

    // Ordenar primero por marca, luego por modelo
    this.modeloMasVendidoArray = Object.values(conteo).sort((a, b) => {
      const comparePunto = a.distrito.localeCompare(b.distrito);
      if (comparePunto !== 0) return comparePunto;
      return a.marca.localeCompare(b.marca);
    });

    this.contarVentasPorDistrito();
    this.contarVentasPorMarcas();
    this.chartSeries = [
      {
        name: 'Ventas',
        data: this.resumenPorDistrito.map(x => x.total)
      }
    ];

    this.chartOptions = {
      chart: {
        type: 'bar',
        height: 450,
        toolbar: { show: false },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '70%'
        }
      },
      xaxis: {
        categories: this.resumenPorDistrito.map(x => x.nombre),
        labels: {
          style: {
            colors: '#ffffff',
            fontSize: '13px'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#ffffff',
            fontSize: '13px'
          }
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#000']
        }
      },
      tooltip: {
        theme: 'dark'
      },
      colors: ['#3b82f6'], // azul brillante
      grid: {
        borderColor: '#4B5563'
      }
    };

    this.chartSeriesMarcas = [
      {
        name: 'Ventas',
        data: this.resumenPorMarcas.map(x => x.total)
      }
    ];

    this.chartOptionsMarcas = {
      chart: {
        type: 'bar',
        height: 450,
        toolbar: { show: false },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '70%'
        }
      },
      xaxis: {
        categories: this.resumenPorMarcas.map(x => x.nombre),
        labels: {
          style: {
            colors: '#ffffff',
            fontSize: '13px'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#ffffff',
            fontSize: '13px'
          }
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#000']
        }
      },
      tooltip: {
        theme: 'dark'
      },
      colors: ['#f6563a'], // azul brillante
      grid: {
        borderColor: '#4B5563'
      }
    };



  }



}
function normalizar(texto: string): string {
  return texto.trim().toLowerCase();
}

