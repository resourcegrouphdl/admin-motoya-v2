import { Component, inject, OnInit } from '@angular/core';
import { SlidesService } from '../../services/webConfig/slides.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { StorageService } from '../../services/products/storage.service';

export interface ImagenesDelSlide {
  id: string ;
  inicio: string;
}

export interface ImagenesDelBaner {
  id: string;
  baner: string;
}

export interface imgBaner {
  baner: string;
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
  modalOpen2 = false;
  isLoading: boolean = false;
  isLoading2: boolean = false;
  slides: ImagenesDelSlide[] = [] ;
  idISlider:string = '';

  modalOpenBaner = false;
  idBaner:string = '';
  baners: ImagenesDelBaner[] = [] ;


  imagenPrincipal: string | ArrayBuffer | null = '';
  banerPrincipal: string | ArrayBuffer | null = '';



  ngOnInit(): void {
    this.getAllSlides();
    this.getAllbaners();
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

  // logica para e baner

  openModalBaner(id:string) {
    this.modalOpenBaner = true;
    this.idBaner = id;
  }

  

  getAllbaners() {

    this.isLoading2 = true;
      try{
        this._configService.getAllBaners().subscribe((baners) => {
          this.baners = baners;
          console.log(this.baners);
        });
      }catch(error){
        console.error('Error al obtener las baners:', error);
      }finally{
        this.isLoading2 = false;
      }
   
       
  }
  
  cerrarModalBaner() {
    this.modalOpenBaner = false;
  }

  borrarBaner(){
    this._configService.borrarSlide(this.idBaner)
   

  }

  onBanerSelected(event: Event): void {

    const input2 = event.target as HTMLInputElement;
    if (input2.files && input2.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.banerPrincipal = e.target?.result ?? null;
      };
      reader.readAsDataURL(input2.files[0]);
    }
  }
  

    removeBanerPrincipal(): void {
    this.banerPrincipal = null;
    }



  
async guardarBanerPublicitario(){
    this.isLoading2 = true;
    try{
      const img = await this._storageService.subirImagenAlStorage(this.banerPrincipal);
      if(!img) return;
      const slideIMagen: imgBaner = {
              baner: img,
      }
      this._configService.guardarBanerEnBaseDeDatos(slideIMagen,'baners');

      this.cerrarModalBaner();
      this.banerPrincipal = null,
      this.getAllbaners();

    }catch(error){}finally{
      this.isLoading2 = false;
    }

  }

  BorrarBaner(){
      this._configService.borraBaner(this.idBaner)
      this.cerrarModalBaner();
      this.getAllbaners();       

  }

}




