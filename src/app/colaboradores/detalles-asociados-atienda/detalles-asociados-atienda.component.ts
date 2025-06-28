import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule,FormControlName } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { PreciosPorTiendaService } from '../../services/precios-por-tienda.service';
import { ColaboradoresService } from '../../services/colaboradores/colaboradores.service';
import { Router } from '@angular/router';
import { Tienda } from '../../common_module/models/tienda';

@Component({
  selector: 'app-detalles-asociados-atienda',
  standalone: true,
  imports: [ReactiveFormsModule,FormsModule,MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule,MatProgressBarModule],
  templateUrl: './detalles-asociados-atienda.component.html',
  styleUrl: './detalles-asociados-atienda.component.css'
})
export class DetallesAsociadosATiendaComponent implements OnInit {

  _preciosXtiendaService = inject(PreciosPorTiendaService);
  _tiedasServies = inject(ColaboradoresService);
  _roter = inject(Router);
  idTienda:string = '';
  objetoTienda: Tienda | null = null;
  
  formDataPrecios:FormGroup
  dataSource:preciosPorTientda[] = this.objetoTienda?.listaDeProductosPorFinanciar || [];
  isLoading = true;
 
  columnsToDisplay = ['marca', 'modelo', 'precio', 'stock'];
   columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: preciosPorTientda | null | undefined ;

  constructor(private fb:FormBuilder){
    this.formDataPrecios = this.fb.group({
      marca:[''],
      modelo:[''],
      precio:[''],
      stock:['']
    })
    

    
  }
  ngOnInit(): void {

    try {
      this.idTienda = this._tiedasServies.getIdTienda();
      console.log(this.idTienda)
      this.getList();
      this.isLoading = false;
     
    } catch (error) {
      this._roter.navigate(['dashboard/tiendas']);
    }

    
  }

  onSubmit(){
      this._tiedasServies.agregarPrecioATienda('tienda',this.idTienda,this.formDataPrecios.value);

  }

   isExpanded(element: preciosPorTientda) {
    return this.expandedElement === element;
  }

  toggle(element: preciosPorTientda) {
    this.expandedElement = this.isExpanded(element) ? null : element;
  }

 getList() {
  this._tiedasServies.getById$('tienda', this.idTienda).subscribe(
    data => {
      this.objetoTienda = data;
      this.dataSource = data.preciosPorTienda;
    },
    error => {
      console.error('Error al obtener tienda:', error);
      alert('Error al obtener datos de la tienda');
    }
  );
}


}


export interface preciosPorTientda {
  marca: string;
  modelo: string;
  precio: number;
  stock: number;
  
}

