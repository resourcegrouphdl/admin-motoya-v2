import { Component, inject, OnInit } from '@angular/core';
import { ChatService, ChatUsuario, Mensaje } from '../../services/chat/chat.service';
import { collection, collectionData, Firestore, limit, orderBy, query } from '@angular/fire/firestore';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChatAreaComponent } from "../chat-area/chat-area.component";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgFor, NgIf, ChatAreaComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit{

selectedChatUid: string = "";
  _firestore = inject(Firestore);
  _chatService = inject(ChatService);

  imagenAvatar:string = "https://www.shutterstock.com/image-vector/splashing-biker-motorcycle-rider-600nw-369246098.jpg";

  chats: ChatUsuario[] = [];
  usuariosConChat: any[] = []; // Lista de tiendas o usuarios
  mensajes: Mensaje[] = [];
  mensaje: string = '';
  uidActual: string = 'Fd3TYGfD4dXVBipaPU06qe78mCP2';
  uidUsuarioActivo: string = '';

  ngOnInit(): void {
     this.cargarUsuariosConChat()
     
  }

  abrirChat(uid: string) {
  this.selectedChatUid = uid;
  }

  cargarUsuariosConChat() {
    this._chatService.getChatsActivos().subscribe(chats => {
      this.chats = chats;
    });
    console.log(this.chats);

  }

  seleccionarUsuario(uidTienda: string) {
    this.uidUsuarioActivo = uidTienda;
    this._chatService.listenToMessages(uidTienda).subscribe(mensajes => {
      this.mensajes = mensajes;
    });
  }

  enviarMensaje() {
    if (this.mensaje.trim()) {
      this._chatService.sendMessage(this.uidUsuarioActivo, this.mensaje).then(() => {
        this.mensaje = '';
      });
    }
  }

  obtenerIniciales(nombre: string): string {
    return nombre?.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2) || 'US';
  }

 

  

}


