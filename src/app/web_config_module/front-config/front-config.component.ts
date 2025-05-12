import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SlidesService } from '../../services/webConfig/slides.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { StorageService } from '../../services/products/storage.service';

export interface ImagenesDelSlide {
  id: string;
  inicio: string;
}

@Component({
  selector: 'app-front-config',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './front-config.component.html',
  styleUrl: './front-config.component.css',
})

export class FrontConfigComponent implements OnInit {

  private _configService = inject(SlidesService);
  private _storageService = inject(StorageService);

  modalOpen = false;
  isLoading: boolean = false;
  slides: ImagenesDelSlide[] = [] ;
  idISlider:string = '';

  imagenPrincipal: string | ArrayBuffer | null = '';


  ngOnInit(): void {
    this.getAllSlides();
  }

  getAllSlides() {
    this.isLoading = true;
    try {
      this._configService.getAllSlides().subscribe((slides) => {
        this.slides = slides;
      });
    } catch (error) {
      console.error('Error al obtener las slides:', error);
    } finally {
      this.isLoading = false;
    }
  }

  Borrarslide(){
      this._configService.borrarSlide(this.idISlider)
      this.cerrarModal();
      this.getAllSlides();       

  }

  

  openModal(id:string) {
    this.modalOpen = true;
    this.idISlider = id;
  }

  cerrarModal() {
    this.modalOpen = false;
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

  removeImageprincipal(): void {
    this.imagenPrincipal = null;
  }

  async guardarImagenDelCarrucel(){
    this.isLoading = true;
    try{
      const img = await this._storageService.subirImagenAlStorage(this.imagenPrincipal);
      if(!img) return;
      const slideIMagen:ImagenesDelSlide = {
        id: '',
        inicio: img,
      }
      this._configService.guardarSlideEnDB(slideIMagen,'carrucel');
      this.cerrarModal();
      this.imagenPrincipal = null,
      this.getAllSlides();

    }catch(error){}finally{
      this.isLoading = false;
    }

  }

 



  

}




