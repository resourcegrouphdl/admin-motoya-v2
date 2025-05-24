import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormArray,
} from '@angular/forms';
import { formDataMotocicleta, Iform } from '../models/iform';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/products/storage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../services/products/product.service';
import { TransitionService } from '../../shared/transition.service';
@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  templateUrl: './crear-producto.component.html',
  styleUrl: './crear-producto.component.css',
})
export class CrearProductoComponent implements OnInit {
  isFading = false;
  uploadProgress: number = 0; // Progreso de subida
  isUploading: boolean = false; // Controla el estado del loader
  productoId: string | null = null; // Variable para almacenar el ID del producto

  //private storage :Storage = inject( Storage);

  formularioDeMotocicletas: FormGroup;

  listaDeMarcas: string[] = [
    'JCH',
    'DUCONDA',
    'LIFAN',
    'BERA',
    'SSENDA',
    'POLUX',
    'HERO',
    'KTM',
    'YAMAHA',
    'HONDA',
    'SUZUKI',
    'KAWASAKI',
    'BAJAJ',
    'TVS',
    'CFMOTO',
    'ZONGSHEN',
    'RTM',
    'HERO',
    'LIFAN',
    'ZONGSHEN',
    'CFMOTO',
  ];

  listaDeCategorias: string[] = [
    'Pistera',
    'Naked',
    'Custom',
    'Scooter',
    'Cafe Racer',
    'Cub',
    'Utilitaria',
    'Urbana',
    'Enduro',
    'Touring',
  ];

  imagenPrincipal: string | ArrayBuffer | null = '';
  imagenesSecundarias: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private serviceStorage: StorageService,
    private router: Router,
    private snackBar: MatSnackBar,
    private savefirestore: ProductService,
    private transitionService: TransitionService
  ) {
    this.formularioDeMotocicletas = this.fb.group({
      id: [''],
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      categoria: ['', Validators.required],
      descripcion: [''],
      fichaTecnica: [''], //id de la ficha técnica en tra tabla
      imagen_principal: [''],
      imagenes: this.fb.array([]),
      precioWeb: [''],
      precioInicial: [''],
      precio: [''], //id del precio en la tabla de precios
      stock: [''], //id del stock en la tabla de stock
      destacado: [''],
      fechaCreacion: [''],
      promociones: [''], //id de las promociones en la tabla de promociones
    });
  }

  ngOnInit(): void {
    this.obtenerIdProducto();
    this.cargarFormulario();
  }

  async onSubmit(): Promise<void> {
    this.isUploading = true; // Mostrar el loader

    try {
      // 1. Subir imágenes al storage
      await this.uploadImageToStorage();

      // 2. Guardar en Firestore
      await this.savefirestore.seveMotocicletaProduct(
        this.formularioDeMotocicletas.value,
        'motocicleta-producto'
      );
      console.log('Producto guardado en Firestore');

      // 3. Iniciar transición de salida
      this.transitionService.startFadeOut();

      // 4. Esperar a que la animación de salida termine
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 5. Redirigir a la tabla
      await this.router.navigate(['/inventario']); // Ponemos await por claridad, aunque Router no siempre devuelve un promise real.

      // 6. Reiniciar el formulario después de la navegación
      this.formularioDeMotocicletas.reset();
    } catch (error) {
      console.error('Error durante la subida:', error);

      // Mostrar un mensaje de error
      this.snackBar.open(
        'Ocurrió un error al subir las imágenes. Inténtalo de nuevo.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    } finally {
      this.isUploading = false; // Ocultar el loader siempre, aunque haya error
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagenPrincipal = e.target?.result ?? null;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onSecondaryImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagenesSecundarias.push(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(item: string): void {
    const index = this.imagenesSecundarias.indexOf(item);
    if (index > -1) {
      this.imagenesSecundarias.splice(index, 1);
    }
  }
  removeImageprincipal(): void {
    this.imagenPrincipal = null;
  }

  async uploadImageToStorage() {
    try {
      // Esperar que suba la imagen principal
      const urlPrincipal = await this.serviceStorage.subirImagenAlStorage(
        this.imagenPrincipal
      );
      this.formularioDeMotocicletas.patchValue({
        imagen_principal: urlPrincipal,
      });
      console.log('Imagen principal subida:', urlPrincipal);

      // Esperar que suban las imágenes secundarias
      const urlsSecundarias =
        await this.serviceStorage.subirArraiDeImagenesAlStorage(
          this.imagenesSecundarias
        );

      // Aquí corregimos para llenar el FormArray
      const imagenesFormArray = this.formularioDeMotocicletas.get(
        'imagenes'
      ) as FormArray;
      imagenesFormArray.clear(); // Limpia primero
      urlsSecundarias.forEach((url) => {
        imagenesFormArray.push(this.fb.control(url)); // Agrega cada URL como FormControl
      });

      console.log('Imágenes secundarias subidas:', urlsSecundarias);
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      throw error; // relanza el error para que onSubmit lo capture
    }
  }

  obtenerIdProducto(): string {
    this.route.queryParams.subscribe((params) => {
      this.productoId = params['id'] || null; // Guardar el ID en la variable
      console.log('Producto ID capturado:', this.productoId);
    });
    return this.productoId || ''; // Retornar el ID del producto o una cadena vacía si no existe
  }

  cargarFormulario() {
    if (this.productoId) {
      this.savefirestore.getById(this.productoId).subscribe((data) => {
        this.formularioDeMotocicletas.patchValue(data);
        this.imagenPrincipal = data.imagen_principal || null; // Asignar la imagen principal
        this.imagenesSecundarias = data.imagenes || []; // Asignar las imágenes secundarias
        console.log('Datos del producto:', data);
      });
    } else {
      console.error('No se pudo obtener el ID del producto.');
    }
  }

  onUpdate() {
    this.isFading = true; // Iniciar la transición de salida
    // Crear un objeto con los valores del formulario, excluyendo los campos `imagenes` e `imagen_principal`
    const updatedData = { ...this.formularioDeMotocicletas.value };
    

    // Guardar los cambios en la base de datos
    this.savefirestore
      .updateMotocicleta(this.productoId!, updatedData) // Non-null assertion
      .then(() => {
        console.log('Producto actualizado correctamente.');
        this.isFading = true; // Iniciar la transición de salida
        this.router.navigate(['dashboard/motocicletas']); // Redirigir a la tabla
      })
      .catch((error) => {
        console.error('Error al actualizar el producto:', error);
      });

    this.router.navigate(['dashboard/motocicletas']);
  }
  
}
