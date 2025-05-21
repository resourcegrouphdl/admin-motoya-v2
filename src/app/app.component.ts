import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatIconModule, NgClass, MatTooltipModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'motoyaapp';
  fadeState: 'none' | 'fade-in' | 'fade-out' = 'none';

  constructor(private router: Router) {}

  navegar(string: string) {
    console.log(string);

    this.router.navigate([string]);
  }

  
}
