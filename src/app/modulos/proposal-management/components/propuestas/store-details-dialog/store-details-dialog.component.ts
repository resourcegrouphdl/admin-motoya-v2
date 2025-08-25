import { Component, inject, Input, signal } from '@angular/core';
import { StoreData, StoreService } from '../../../../../services/tienda/store.service';

@Component({
  selector: 'app-store-details-dialog',
  standalone: true,
  imports: [],
  templateUrl: './store-details-dialog.component.html',
  styleUrl: './store-details-dialog.component.css'
})
export class StoreDetailsDialogComponent {
  private storeService = inject(StoreService);
  
  // Inputs desde el componente padre
  @Input() uid: string = '';
  @Input() onClose: () => void = () => {};
  
  // Signals
  public storeData = signal<StoreData | null>(null);
  public isLoading = signal<boolean>(true);
  public error = signal<string | null>(null);

  ngOnInit(): void {
    if (this.uid) {
      this.loadStoreData();
    } else {
      this.error.set('UID de tienda no proporcionado');
      this.isLoading.set(false);
    }
  }

  async loadStoreData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const data = await this.storeService.getStoreByUID(this.uid);
      
      if (data) {
        this.storeData.set(data);
      } else {
        this.error.set('No se encontraron datos para esta tienda');
      }
    } catch (err) {
      console.error('Error cargando datos de tienda:', err);
      this.error.set('Error al cargar los datos de la tienda');
    } finally {
      this.isLoading.set(false);
    }
  }

  closeDialog(): void {
    this.onClose();
  }

  hasAdditionalInfo(): boolean {
    const data = this.storeData();
    if (!data) return false;
    
    return !!(data.email || data.telefono || data.direccion || 
             data.nit || data.contacto || data.fechaRegistro);
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      return dateString;
    }
  }

}
