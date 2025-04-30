import { Component } from '@angular/core';
import { IMenu, menu } from '../../interfaces/i-menu';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TransitionService } from '../../shared/transition.service';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  public list_modules: IMenu[] = menu;   

  constructor(private router: Router,
    private transitionService: TransitionService) { }


    async navigateWithTransition(route: string): Promise<void> {
      // Iniciar la animación de salida
      this.transitionService.startFadeOut();
  
      // Esperar 500ms para la animación
      await new Promise(resolve => setTimeout(resolve, 500));
  
      // Navegar
      await this.router.navigate([route]);
    }


}
