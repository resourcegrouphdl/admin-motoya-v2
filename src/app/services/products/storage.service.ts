import { Injectable,inject} from '@angular/core';
import { getDownloadURL, ref, Storage, uploadString } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private _storage = inject( Storage)
  constructor( ) { }

  
  async subirImagenAlStorage(imagen: string | ArrayBuffer | null): Promise<string | null> {
    
    if (imagen) {
      const storage = this._storage;
      const storageRef = ref(storage, 'imagenes/' + new Date().getTime() + '.jpg');
      try {
        const uploadResult = await uploadString(storageRef, imagen as string, 'data_url');
        const downloadURL = await getDownloadURL(uploadResult.ref);
        return downloadURL;
      } catch (error) {
        console.error('Error al subir la imagen:', error);
        return null;
      }
    } else {
      console.warn('No se seleccionó ninguna imagen.');
      return null;
    }
  }


  async subirArraiDeImagenesAlStorage(imagenes: string[]): Promise<string[]> {
    const storage = this._storage;
    const promises = imagenes.map(async (imagen) => {
      const storageRef = ref(storage, 'imagenes/' + new Date().getTime() + '.jpg');
      try {
        const uploadResult = await uploadString(storageRef, imagen, 'data_url');
        const downloadURL = await getDownloadURL(uploadResult.ref);
        return downloadURL;
      } catch (error) {
        console.error('Error al subir la imagen:', error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((url): url is string => url !== null); // Filtrar los resultados para eliminar los null
  }

}
