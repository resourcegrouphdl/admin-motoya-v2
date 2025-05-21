import { Component, inject, OnInit } from '@angular/core';
import { IMenu, MENU } from '../../interfaces/i-menu';
import { Router, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TransitionService } from '../../shared/transition.service';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserCacheService } from '../../auth_module/services/user-cache.service';
import { UserModelResponse } from '../../auth_module/services/i-user';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, NgClass, RouterOutlet, RouterLink,MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  _router = inject(Router);
  _cacheUser = inject(UserCacheService);
  userActive: UserModelResponse | null = null;

  logo: string =
    'https://firebasestorage.googleapis.com/v0/b/motoya-form.appspot.com/o/logos%2F2%402x.png?alt=media&token=c07d5d20-382f-405b-aaa6-0eb2c82b1f64';
  title = 'motoyaapp';
  fadeState: 'none' | 'fade-in' | 'fade-out' = 'none';
  itemsDelMenu: IMenu[] = MENU;

  constructor(
    private router: Router,
    private transitionService: TransitionService
  ) {}
  ngOnInit(): void {
    this.secionActiva();
  }

  async navigateWithTransition(route: string): Promise<void> {
    // Iniciar la animación de salida
    this.transitionService.startFadeOut();

    // Esperar 500ms para la animación
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Navegar
    await this.router.navigate([route]);
  }

  navegar(string: string) {
    console.log(string);

    this.router.navigate([string]);
  }
  onActivate() {
    setTimeout(() => {
      this.transitionService.startFadeIn();
      setTimeout(() => {
        this.transitionService.clearFade();
      }, 500); // Duración de la animación de entrada
    }, 10);
  }

  secionActiva() {

   
      this.userActive = this._cacheUser.getUser();
    
    
  }
  navigate(ruta:string){
    this._router.navigate([ruta])
  }
}
