import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../services/products/product.service';
import { MotocicletaProduct } from '../../common_module/models/motocicleta';
import { routes } from '../../app.routes';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import {MatTableModule} from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [MatIconModule, RouterLink, MatTableModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {

  isloading = true;
 
  productos: MotocicletaProduct[] = [];

  constructor( private productService: ProductService, private router:Router,private sanitizer: DomSanitizer ) { }

  ngOnInit(): void {

  

    this.loadProducts();

    // Escuchar eventos de navegación
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadProducts(); // Recargar los datos al regresar al componente
      }
    });
    
  }

  loadProducts() {
    this.isloading = true;
    this.productService.getAllProducts().subscribe(data => {
      this.productos = data;
      this.isloading = false;
    });
  }

  actualizarLista() {
    this.productService.refreshProducts();
    this.productService.getAllProducts().subscribe(data => {
      this.productos = data;
    });
  }
  
  editarProducto(id: string) {
    this.router.navigate(['/inventario/crear'], { queryParams: { id } });
    
  }

  eliminarProducto(id: string) {
    this.productService.deleteMotocicleta(id);
    this.actualizarLista();
  }
  

  agregarProducto() {
    this.router.navigate(['/inventario/crear']);
  }

  sanitizeImage(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  navigateToFichaTecnica(id: string) {
    this.router.navigate(['/inventario/crear-ficha-tecnica'], { queryParams: { id } });
  }

  

}