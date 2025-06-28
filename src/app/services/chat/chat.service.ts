import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { addDoc, collection, collectionData, doc, Firestore, getDoc, limit, orderBy, query, serverTimestamp, setDoc, Timestamp } from '@angular/fire/firestore';
import { combineLatest, map, Observable, of, switchMap, timestamp } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ChatService {

  _firestore = inject(Firestore);
  _auth = inject(Auth);

  
  constructor() { }


  getChatId(uid_usuario:string):string {
    return uid_usuario;
  }

 sendMessage(uid_usuario: string, contenido: string): Promise<void> {
  const chatId = this.getChatId(uid_usuario);
  const chatRef = doc(this._firestore, `chats/${chatId}`);
  const mensajesRef = collection(this._firestore, `chats/${chatId}/mensajes`);

  const remitenteID = this._auth.currentUser?.uid;
  if (!remitenteID) return Promise.reject('Usuario no autenticado');

  const mensaje = {
    remitenteID,
    contenido,
    timestamp: serverTimestamp(),
    leido: false
  };

  return getDoc(chatRef).then(chatSnap => {
    if (!chatSnap.exists()) {
      // Crear el chat con los participantes
      return setDoc(chatRef, {
        participantes: [remitenteID, uid_usuario]
      });
    }
    return;
  }).then(() => {
    // Agregar el mensaje a la subcolección
    return addDoc(mensajesRef, mensaje);
  }).then(() => {
    // Garantiza que la promesa devuelva void
    return;
  });
}

  listenToMessages(uidUsuario: string): Observable<any[]> {
    const chatId = uidUsuario
    const mensajesRef = collection(this._firestore, `chats/${chatId}/mensajes`);
    const mensajesQuery = query(mensajesRef, orderBy('timestamp'));
    return collectionData(mensajesQuery, { idField: 'id' });
  }


  //------ obtener lista de contactos del chat------

  
 getChatsActivos(): Observable<ChatUsuario[]> {
  const chatsRef = collection(this._firestore, 'chats');

  return collectionData(chatsRef, { idField: 'uid' }).pipe( // "uid" será el ID del doc
    switchMap((chats: any[]) => {
      if (!chats.length) return of([]);

      return combineLatest(
        chats.map(chat => {
          const chatId = chat.uid;
          const mensajesRef = collection(this._firestore, `chats/${chatId}/mensajes`);
          const ultimoMensajeQuery = query(mensajesRef, orderBy('timestamp', 'desc'), limit(1));

          return collectionData(ultimoMensajeQuery).pipe(
            map((mensajes: any[]) => {
              const ultimo = mensajes[0];

              return {
                uid: chatId,
                nombre: chatId, // puedes luego reemplazar por nombre real desde otra colección
                fotoUrl: 'https://icons.iconarchive.com/icons/papirus-team/papirus-status/512/avatar-default-icon.png',
                ultimoMensaje: ultimo?.contenido || '',
                horaUltimoMensaje: ultimo?.timestamp?.toDate?.() || null,
                noLeidos: mensajes.filter(m =>
                  !m.leido &&
                  m.remitenteID === chatId // si viene del usuario
                ).length
              } as ChatUsuario;
            })
          );
        })
      );
    })
  );
}
// ---- sen mensaje  --------//


}






export interface Mensaje {
  id?: string; // opcional, se asigna al obtener datos de Firestore
  remitenteID: string; // UID del que envía el mensaje
  contenido: string;
  timestamp: any; // puede ser `Timestamp` de Firestore
  leido: boolean;
}

export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
  fotoUrl?: string;
  // Otros campos personalizados
}
export interface Chat {
  id?: string; // ID del documento del chat, puede ser igual al UID del usuario
  participantes: string[]; // [uid_admin, uid_usuario]
}

export interface ChatUsuario {
  uid: string;
  nombre?: string; // Si luego quieres obtener desde otra colección
  fotoUrl?: string;
  ultimoMensaje?: string;
  horaUltimoMensaje?: Date;
  noLeidos: number;
}