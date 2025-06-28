import { Component, inject, Input, OnInit } from '@angular/core';
import { ChatService, Mensaje } from '../../services/chat/chat.service';
import { TiendasService } from '../../services/colaboradores/tiendas.service';
import { ColaboradoresService } from '../../services/colaboradores/colaboradores.service';
import { Tienda } from '../../common_module/models/tienda';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, FormsModule],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.css',
})
export class ChatAreaComponent implements OnInit {
  @Input() uidUsuario: string = '';

  _chatService = inject(ChatService);
  _tiendaService = inject(ColaboradoresService);

  adminuid:string = 'Fd3TYGfD4dXVBipaPU06qe78mCP2';

  newMessage: string = '';
  mensajes: Mensaje[] = [];
  usuario: any = null;
  nuevoMensaje: string = '';
  defaultAvatar: string =
    'https://images.icon-icons.com/1378/PNG/512/avatardefault_92824.png';
  tiendaData: Tienda | null = null;

  ngOnInit(): void {
    this.cargarUsuario();
    console.log(this.uidUsuario);
    this.listenToMessages();
  }

  cargarUsuario(): void {
    this._tiendaService
      .getById('tienda', this.uidUsuario)
      .then((data: Tienda) => {
        this.tiendaData = data;
      })
      .catch((error) => {
        console.error('Error al obtener datos de la tienda:', error);
      });
  }

  /*escucharMensajes(): void {
    this._chatService.listenToMessages(this.uidUsuario).subscribe(mensajes => {
      this.mensajes = mensajes;
      console.log(mensajes);
      setTimeout(() => this.scrollToBottom(), 100); // autoscroll al final
    });
  } */

  private scrollToBottom(): void {
    const area = document.getElementById('messagesArea');
    if (area) {
      area.scrollTop = area.scrollHeight;
    }
  }

  listenToMessages(): void {
    if (this.uidUsuario) {
      console.log('Escuchando mensajes para UID:', this.uidUsuario);

      this._chatService.listenToMessages(this.uidUsuario).subscribe(
        (messages) => {
          console.log('Mensajes recibidos:', messages);
          this.mensajes = messages;
        },
        (error) => {
          console.error('Error al escuchar mensajes:', error);
        }
      );
    } else {
      console.error('Datos de la tienda no disponibles o UID no encontrado');
    }
  }

  sendMessage(): void {
    const contenido = this.newMessage.trim();

    if (!contenido) return; // evita enviar mensajes vacíos

    if (this.uidUsuario) {
      this._chatService
        .sendMessage(this.uidUsuario, contenido)
        .then(() => {
          console.log('Mensaje enviado correctamente');
          this.newMessage = ''; // limpia el input
          // Opcional: agregar el mensaje a un array de mensajes si lo estás mostrando en pantalla
          // this.messages.push({ text: contenido, sender: 'user' });
        })
        .catch((error) => {
          console.error('Error al enviar el mensaje:', error);
        });
    } else {
      console.error('Datos de la tienda no disponibles o UID no encontrado');
    }
  }

  enviarMensaje(): void {
    const texto = this.newMessage.trim();
    if (!texto || !this.uidUsuario) return;

    this._chatService
      .sendMessage(this.uidUsuario, texto)
      .then(() => {
        this.newMessage = '';
      })
      .catch((err) => {
        console.error('Error al enviar mensaje:', err);
      });
  }
}
