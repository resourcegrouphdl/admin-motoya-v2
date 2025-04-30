import { inject, Injectable } from '@angular/core';
import { fichaTecnica } from '../../common_module/models/motocicleta';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FichaTecnicaService {

  private _firestore = inject(Firestore);
  tableName = "fichatecnica-producto";
  private _collectionRef = collection(this._firestore, "motocicleta-producto");


  constructor() { }


  async getFichaTecnica(id: string): Promise<any> {}

  async createFichaTecnica(fichaTecnica:fichaTecnica): Promise<string> {

     
        const motocicletasCollection = collection(this._firestore, this.tableName);
        const docRef =  await addDoc(motocicletasCollection, fichaTecnica);
        return docRef.id; // Retorna el ID del documento creado

  }















  async updateFichaTecnica(id: string, fichaTecnica: any): Promise<any> {}

  async deleteFichaTecnica(id: string): Promise<any> {}

  async getAllFichasTecnicas(): Promise<any[]> {
    return []; // Return an empty array as a placeholder
  }

}
