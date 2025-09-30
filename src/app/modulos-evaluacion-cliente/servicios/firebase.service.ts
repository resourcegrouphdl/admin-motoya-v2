import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  CollectionReference,
  DocumentReference,
  getDocs,
  QueryConstraint,
  DocumentData,
} from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private firestore = inject(Firestore);

  /**
   * Obtiene todos los documentos de una colección en tiempo real
   */
  getAllWithMeta<T>(collectionName: string): Observable<(T & { id: string; createdAt?: Date; updatedAt?: Date })[]> {
    const ref = collection(this.firestore, collectionName);

    return from(getDocs(ref)).pipe(
      map(snapshot =>
        snapshot.docs.map(docSnap => {
          const data = docSnap.data() as T;

          return {
            ...data,
            id: docSnap.id,
            // metadata nativa de Firestore
            createdAt: (docSnap as any).createTime?.toDate?.() ?? null,
            updatedAt: (docSnap as any).updateTime?.toDate?.() ?? null
          };
        })
      ),
      catchError(err => {
        console.error(`[FirebaseService] Error en getAllWithMeta(${collectionName}):`, err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene documentos filtrados por condición
   */
  getWhere<T>(collectionName: string, constraints: QueryConstraint[]): Observable<T[]> {
    const ref = collection(this.firestore, collectionName);
    const q = query(ref, ...constraints);
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T))),
      catchError(err => {
        console.error(`[FirebaseService] Error en getWhere(${collectionName}):`, err);
        return of([] as T[]);
      })
    );
  }

  /**
   * Obtiene un documento por id en tiempo real
   */
  getById<T>(collectionName: string, id: string): Observable<T | null> {
    const ref = doc(this.firestore, `${collectionName}/${id}`);
    return docData(ref, { idField: 'id' }).pipe(
      map(data => (data ? (data as T) : null)),
      catchError(err => {
        console.error(`[FirebaseService] Error en getById(${collectionName}, ${id}):`, err);
        return of(null);
      })
    );
  }

  /**
   * Agrega un nuevo documento
   */
  add<T extends DocumentData>(collectionName: string, data: T): Observable<DocumentReference<T>> {
    const ref = collection(this.firestore, collectionName) as CollectionReference<T>;
    return from(addDoc(ref, data)).pipe(
      catchError(err => {
        console.error(`[FirebaseService] Error en add(${collectionName}):`, err);
        throw err;
      })
    );
  }

  /**
   * Crea o reemplaza un documento por id
   */
  set<T extends DocumentData>(collectionName: string, id: string, data: T): Observable<void> {
    const ref = doc(this.firestore, `${collectionName}/${id}`); // ❌ no tipamos a <T>
    return from(setDoc(ref, data)).pipe(
      catchError(err => {
        console.error(`[FirebaseService] Error en set(${collectionName}, ${id}):`, err);
        throw err;
      })
    );
  }

  /**
   * Actualiza parcialmente un documento
   */
  update<T extends DocumentData>(collectionName: string, id: string, data: Partial<T>): Observable<void> {
    const ref = doc(this.firestore, `${collectionName}/${id}`); // ❌ dejamos DocumentData
    return from(updateDoc(ref, data as any)).pipe(
      catchError(err => {
        console.error(`[FirebaseService] Error en update(${collectionName}, ${id}):`, err);
        throw err;
      })
    );
  }

  /**
   * Elimina un documento
   */
  delete(collectionName: string, id: string): Observable<void> {
    const ref = doc(this.firestore, `${collectionName}/${id}`);
    return from(deleteDoc(ref)).pipe(
      catchError(err => {
        console.error(`[FirebaseService] Error en delete(${collectionName}, ${id}):`, err);
        throw err;
      })
    );
  }
}