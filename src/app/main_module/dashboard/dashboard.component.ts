import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {  MatIconModule } from '@angular/material/icon';
import { MENU } from '../../interfaces/i-menu';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule,MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  ResumenDelMOdulo : string = " modulo  de gestion de clientes"

  menuItems: any[] = MENU;


}
