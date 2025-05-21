import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NgClass } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'motoyaapp';
  fadeState: 'none' | 'fade-in' | 'fade-out' = 'none';
  appVersion: string = '';

  constructor() {
    if (window && window['appVersion']) {
      this.appVersion = window['appVersion'].get();
    }
  }

 
  

  
}
