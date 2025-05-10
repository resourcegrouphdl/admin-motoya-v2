import { Injectable } from '@angular/core';

import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {

  constructor(private auth:Auth) { 

  }

  async crearUsuarioConEmail(email: string, password: string): Promise<any| null> {
    try {
      const usuario = await createUserWithEmailAndPassword(this.auth, email, password);
      return usuario.user.uid;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error; // puedes manejarlo en tu componente
    }
  }


  

}
