import { Component, OnInit } from '@angular/core';
import { MatInputModule} from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../services/products/product.service';
import { Router } from '@angular/router';
import { FichaTecnicaService } from '../../services/products/ficha-tecnica.service';
import { FormBuilder, FormGroup,ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { fichaTecnica } from '../../common_module/models/motocicleta';
import { map } from 'rxjs';

@Component({
  selector: 'app-crear-ficha-tecnica',
  standalone: true,
  imports: [MatInputModule, MatIconModule, ReactiveFormsModule, MatProgressBarModule],
  templateUrl: './crear-ficha-tecnica.component.html',
  styleUrl: './crear-ficha-tecnica.component.css'
})
export class CrearFichaTecnicaComponent implements OnInit {

  isloading = false;
  fichaTecnicaForm :FormGroup;
  productoId: string | null = null; // Variable para almacenar el ID del producto



  constructor( private route: ActivatedRoute, private fb: FormBuilder, private productService: ProductService, private router:Router, private fichaTecnicaService: FichaTecnicaService ) {

    this.fichaTecnicaForm = this.fb.group({
      cilindrada: [''],
      potencia: [''],
      torque: [''],
      combustible: [''],
      tanque: [''],
      rendimiento: [''],
      autonomia: [''],
      suspencionDelantera: [''],
      suspencionTrasera: [''],
      frenoDelantero: [''],
      frenoTrasero: [''],
      transmision: [''],
      peso: [''],
      velocidadMaxima: [''],
      dimenciones: [''],
       });

       

   }
  ngOnInit(): void {
    this.obtenerIdProducto()
   this.obtenerPRodcuto()


  }

   async onSubmit(): Promise<void>{

    this.isloading = true; // Cambiar el estado de carga a verdadero antes de guardar la ficha técnica

    const fichaTecnicaId = await this.guardarFichaTecnica();
    console.log(fichaTecnicaId);

    await this.actualizarIdProducto(); // Actualizar el ID del producto después de guardar la ficha técnica
    this.isloading = false; // Cambiar el estado de carga a falso después de guardar la ficha técnica
    this.router.navigate(['/inventario']);


   }



   async guardarFichaTecnica(): Promise<string> {

    const fichatecnicaId = await this.fichaTecnicaService.createFichaTecnica(this.fichaTecnicaForm.value);
    console.log(fichatecnicaId, 'aqui estamos:', fichatecnicaId);

    return fichatecnicaId;
  }

  async actualizarIdProducto(): Promise<void> {

    if (this.productoId) {
      await this.productService.updateMotocicleta(this.productoId, { fichaTecnica: this.fichaTecnicaForm.value });
      console.log(`Producto con ID ${this.productoId} actualizado con la ficha técnica ${this.fichaTecnicaForm.value}.`);
    } else {
      console.error('No se pudo actualizar el ID del producto porque no se proporcionó un ID válido.');
    }


  }

  obtenerIdProducto(): string  {
    this.route.queryParams.subscribe(params => {
      this.productoId = params['id'] || null; // Guardar el ID en la variable
      console.log('Producto ID capturado:', this.productoId);
    });
    return this.productoId || ''; // Retornar el ID del producto o una cadena vacía si no existe
  }
  
  obtenerPRodcuto(): void {
    if (!this.productoId) {
      console.error('No se encontró un ID de producto válido.');
      return;
    }
  
    this.productService.getById(this.productoId).subscribe((data) => {
      if (data.fichaTecnica) {
        // Si el campo fichaTecnica existe, rellenar el formulario con sus valores
        try {
          const fichaTecnica = typeof data.fichaTecnica === 'string' ? JSON.parse(data.fichaTecnica) : data.fichaTecnica;
          this.fichaTecnicaForm.patchValue(fichaTecnica);
        } catch (error) {
          console.error('Error parsing fichaTecnica:', error);
        }
        console.log('Ficha técnica cargada:', data.fichaTecnica);
      } else {
        console.warn('El producto no tiene una ficha técnica asociada.');
      }
    }, (error) => {
      console.error('Error al obtener el producto:', error);
    });
  }
  


}
