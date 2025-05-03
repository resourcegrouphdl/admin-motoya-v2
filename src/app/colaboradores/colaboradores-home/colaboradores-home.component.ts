import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-colaboradores-home',
  standalone: true,
  imports: [RouterOutlet,MatButtonModule],
  templateUrl: './colaboradores-home.component.html',
  styleUrl: './colaboradores-home.component.css'
})
export class ColaboradoresHomeComponent {

}
