import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '@angular/fire/auth';
import {
  MatCard,
  MatCardSubtitle,
  MatCardTitle,
  MatCardContent,
  MatCardHeader,
} from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { UserType } from '../../modelos/enums';

@Component({
  selector: 'app-user-type-selection',
  standalone: true,
  imports: [
    MatCard,
    MatCardSubtitle,
    MatCardTitle,
    MatCardContent,
    MatIcon,
    MatCardHeader,
  ],
  templateUrl: './user-type-selection.component.html',
  styleUrl: './user-type-selection.component.scss',
})
export class UserTypeSelectionComponent {
  @Input() selectedUserType: UserType | null = null;
  @Output() userTypeSelected = new EventEmitter<UserType>();

  // Definir las opciones localmente en el componente
  typeUserOptions = [
    { value: UserType.ADMIN, label: 'Administrador' },
    { value: UserType.STORE, label: 'Tienda' },
    { value: UserType.VENDOR, label: 'Vendedor' },
    { value: UserType.ACCOUNTANT, label: 'Contable' },
    { value: UserType.FINANCIAL, label: 'Analista Financiero' },
  ];

  selectUserType(userType: UserType) {
    this.userTypeSelected.emit(userType);
  }
}
