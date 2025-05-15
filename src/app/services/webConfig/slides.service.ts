import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { ImagenesDelBaner, ImagenesDelSlide } from '../../web_config_module/front-config/front-config.component';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class SlidesService {

    private _firestore = inject(Firestore);
    private slidesCache$ = new BehaviorSubject<ImagenesDelSlide[] | null>(null);
    private banersCache$ = new BehaviorSubject<ImagenesDelBaner[] | null>(null);

  constructor() { }

  getAllSlides(): Observable<ImagenesDelSlide[]> {
    if (this.slidesCache$.value) {
      return of(this.slidesCache$.value);
    }
    return collectionData(collection(this._firestore, 'carrucel'), { idField: 'id' }).pipe(
      map((data) => data.map((doc) => doc as ImagenesDelSlide)),
      tap((slides) => {
        this.slidesCache$.next(slides);
      }),
      catchError((error) => {
        console.error('Error al cargar las slides', error);
        return of([]);
      })
    );
  }

  refreshSlides(): void {
    this.slidesCache$.next(null);
  }

  async borrarSlide(id:string):Promise<void>{
    try{
      const docRef = doc(this._firestore, `carrucel/${id}`);
      await deleteDoc(docRef);
      console.log(`Documento con ID ${id} eliminado correctamente.`);
      this.refreshSlides();

    }catch(error){
      console.error('Error al eliminar el documento:', error);
      throw error;
    }
  }

  async guardarSlideEnDB(slide:any,tableName:string):Promise<void>{
    const slidesCollection = collection(this._firestore, tableName);
    addDoc(slidesCollection, slide).then(() => {});
    this.refreshSlides();
  }



  getAllBaners(): Observable<ImagenesDelBaner[]> {
    if (this.banersCache$.value) {
      return of(this.banersCache$.value);
    }
    return collectionData(collection(this._firestore, 'baners'), { idField: 'id' }).pipe(
      map((data) => data.map((doc) => doc as ImagenesDelBaner)),
      tap((baners) => {
        this.banersCache$.next(baners);
      }),
      catchError((error) => {
        console.error('Error al cargar las baners', error);
        return of([]);
      })
    );
  }

  async borraBaner(id:string):Promise<void>{
    try{
      const docRef = doc(this._firestore, `baners/${id}`);
      await deleteDoc(docRef);
      console.log(`Documento con ID ${id} eliminado correctamente.`);
      this.refreshSlides();

    }catch(error){
      console.error('Error al eliminar el documento:', error);
      throw error;
    }
  }

  async guardarBanerEnBaseDeDatos(slide:any,tableName:string):Promise<void>{
    const slidesCollection = collection(this._firestore, tableName);
    addDoc(slidesCollection, slide).then(() => {});
    this.refreshSlides();
  }

   refreshBaner(): void {
    this.banersCache$.next(null);
  }

}
