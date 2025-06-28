import { inject, Injectable } from '@angular/core';
import { addDoc,
  arrayUnion,
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { Tienda } from '../../common_module/models/tienda';
import { Vendedor } from '../../common_module/models/vendedor';

@Injectable({
  providedIn: 'root',
})
export class ColaboradoresService {
  private _firestore = inject(Firestore);
  private tiendasCache$ = new BehaviorSubject<Tienda[] | null>(null); // Caché en memoria de las motocicletas
  private vendedoresCache$ = new BehaviorSubject<Vendedor[] | null>(null); // Caché en memoria de las motocicletas
  idTienda: string = '';


  constructor() {}

  async seveFormularios(formulario: any, tableName: string): Promise<void> {
    const collecionFirebase = collection(this._firestore, tableName);
    await addDoc(collecionFirebase, formulario).then(() => {});
    this.refreshProducts(); // Actualizar la caché después de guardar un nuevo producto
  }

  async saveFormulariosconuid(formulario: any, tableName: string, uid: string): Promise<void> {
  const docRef = doc(this._firestore, tableName, uid); // referencia al documento con ID = uid

  await setDoc(docRef, formulario)
    .then(() => {
      this.refreshProducts(); // Actualizar caché después de guardar
    })
    .catch((error) => {
      console.error('Error al guardar el formulario:', error);
    });
}



  refreshProducts(): void {
    this.tiendasCache$.next(null);
  }

  getAllProducts(tableName: string): Observable<Tienda[]> {
    if (this.tiendasCache$.value) {
      return of(this.tiendasCache$.value);
    }

    return collectionData(collection(this._firestore, tableName), {
      idField: 'id',
    }).pipe(
      map((data) => data.map((doc) => doc as Tienda)), // Convertir a tipo Motocicleta
      tap((motocicletas) => {
        this.tiendasCache$.next(motocicletas); // Guardar en caché
      }),
      catchError((error) => {
        console.error('Error al cargar los productos', error);
        return of([]); // Evitar fallos en la app
      })
    );
  }

  getAllColaboradores(tableName: string): Observable<Vendedor[]> {
    if (this.vendedoresCache$.value) {
      return of(this.vendedoresCache$.value);
    }

    return collectionData(collection(this._firestore, tableName), {
      idField: 'id',
    }).pipe(
      map((data) => data.map((doc) => doc as Vendedor)), // Convertir a tipo Motocicleta
      tap((vendedor) => {
        this.vendedoresCache$.next(vendedor); // Guardar en caché
      }),
      catchError((error) => {
        console.error('Error al cargar los productos', error);
        return of([]); // Evitar fallos en la app
      })
    );
  }


   async seveFormularioDeVendedores(formulario: any, tableName: string): Promise<void> {
    const collecionFirebase = collection(this._firestore, tableName);
    await addDoc(collecionFirebase, formulario).then(() => {});
    this.refreshVendedores(); // Actualizar la caché después de guardar un nuevo producto
  }


  refreshVendedores(): void {
    this.vendedoresCache$.next(null);
  }

  setIdTienda(id:string){
    this.idTienda = id;
  }

  getIdTienda(){
    return this.idTienda;
  }

  getById(collectionName: string, id: string): Promise<any> {
    const docRef = doc(this._firestore, `${collectionName}/${id}`);
    return getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        } else {
          throw new Error('Documento no encontrado');
        }
      })
      .catch((error: any) => {
        console.error('Error al obtener documento:', error);
        alert('Error al obtener documento');
        throw error;
      });
  }

  agregarPrecioATienda(collectionName: string, idDoc: string, nuevoPrecio: any): Promise<void> {
    const docRef = doc(this._firestore, `${collectionName}/${idDoc}`);
    
    return updateDoc(docRef, {
      preciosPorTienda: arrayUnion(nuevoPrecio)
    })
    .then(() => {
      console.log('Elemento agregado correctamente');
    })
    .catch((error) => {
      console.error('Error al agregar el precio:', error);
      alert('Error al agregar el precio');
      throw error;
    });
  }

  getById$(collectionName: string, id: string): Observable<any> {
    const docRef = doc(this._firestore, `${collectionName}/${id}`);
    return docData(docRef, { idField: 'id' }); // Incluye el ID del documento como campo "id"
  }

  
}


