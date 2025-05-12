import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { ImagenesDelSlide } from '../../web_config_module/front-config/front-config.component';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class SlidesService {

    private _firestore = inject(Firestore);
    private slidesCache$ = new BehaviorSubject<ImagenesDelSlide[] | null>(null);

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

}
