import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { IMenu } from './interfaces/i-menu';
import { menu } from './interfaces/i-menu';
import {MatIconModule} from '@angular/material/icon';
import { TransitionService } from './shared/transition.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatIconModule,NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'motoyaapp';
  fadeState: 'none' | 'fade-in' | 'fade-out' = 'none';
  menu_principal: IMenu[] = menu;

constructor(private router: Router ,private transitionService: TransitionService) {
  this.transitionService.fadeState$.subscribe(state => {
    this.fadeState = state;
  });
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



}
