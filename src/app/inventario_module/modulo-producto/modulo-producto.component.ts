import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TransitionService } from '../../shared/transition.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-modulo-producto',
  standalone: true,
  imports: [RouterOutlet,NgClass],
  templateUrl: './modulo-producto.component.html',
  styleUrl: './modulo-producto.component.css'
})
export class ModuloProductoComponent {

  fadeState: 'none' | 'fade-in' | 'fade-out' = 'none';

  constructor(private transitionService: TransitionService) { 
    this.transitionService.fadeState$.subscribe(state => {
      this.fadeState = state;
    });
    
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
