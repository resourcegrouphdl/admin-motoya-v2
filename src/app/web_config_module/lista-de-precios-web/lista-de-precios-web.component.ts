import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ListaDePreciosColaboradores } from '../../common_module/models/lista-de-precios-colaboradores';
import {MatTableModule} from '@angular/material/table';


@Component({
  selector: 'app-lista-de-precios-web',
  standalone: true,
  imports: [ MatIconModule,
      MatTableModule,
      MatInputModule,
      MatFormFieldModule,
      ReactiveFormsModule,
      MatIconModule,
      FormsModule,
      ReactiveFormsModule,
      CommonModule,
      MatFormFieldModule,
      MatSelectModule,
      MatButtonModule,
      MatProgressBarModule,],
  templateUrl: './lista-de-precios-web.component.html',
  styleUrl: './lista-de-precios-web.component.css'
})
export class ListaDePreciosWebComponent {

  listaDePrecios: ListaDePreciosColaboradores[] = [];

  dataSource = ELEMENT_DATA;
  columnsToDisplay = ['marca', 'modelo', 'precioPublico','actualizado','acciones'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: ListaDePreciosColaboradores | null | undefined;

  /** Checks whether an element is expanded. */
  isExpanded(element: ListaDePreciosColaboradores) {
    return this.expandedElement === element;
  }

  /** Toggles the expanded state of an element. */
  toggle(element: ListaDePreciosColaboradores) {
    this.expandedElement = this.isExpanded(element) ? null : element;
  }

}



const ELEMENT_DATA: ListaDePreciosColaboradores[] = [
  {
   marca: 'HONDA',
   modelo: 'CB190',
   precioPublico:'200000',
   tablaDeCuotas:[
    {
      inicial:'1200',
      montoPorCuotasTipoA:'1800',
      montoPorCuotasTipoB:'1700',
      montoPorCuotasTipoC:'1600',
      fechaDeCreacion:'23 enero',
      aliadoAsignado:[{
        idReerencial:'ssddsssdds',
        apellido:'aliado1'
      },
      {
        idReerencial:'ssddsssdds',
        apellido:'aliado2'
      }]
    },
    {
      inicial:'1200',
      montoPorCuotasTipoA:'1800',
      montoPorCuotasTipoB:'1700',
      montoPorCuotasTipoC:'1600',
      fechaDeCreacion:'23 enero',
      aliadoAsignado:[{
        idReerencial:'ssddsssdds',
        apellido:'aliado1'
      },
      {
        idReerencial:'ssddsssdds',
        apellido:'aliado2'
      }]
    }

   ],
 
   actualizado:'23 enero'
 
  },
  
  
   ];
