import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule, } from '@angular/material/chips';;
import { UserType, DocumentType } from '../enums/user-type.types';

import { UserFactoryService } from '../services/user-factory.service';
import { Auth } from '@angular/fire/auth';
import { FirebaseUserService } from '../services/firebase-user.service';
import { ErrorHandlerService } from '../services/error-handler.service';


// Interfaces locales
export interface CreateUserDialogData {
  userTypes?: any[];
  preselectedType?: UserType;
}



@Component({
  selector: 'app-crear',
  standalone: true, // Componente Standalone de Angular 17
  imports: [
    // Angular Common
    CommonModule,
    ReactiveFormsModule,
    // Angular Material
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
],
  templateUrl: './crear.component.html',
  styleUrl: './crear.component.css', // styleUrl en lugar de styleUrls (Angular 17)
})
export class CrearComponent  {

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CrearComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private userFactory = inject(UserFactoryService);
  private firebaseUserService = inject(FirebaseUserService);
  private snackBar = inject(MatSnackBar);
  private auth = inject(Auth);

  userTypeForm!: FormGroup;
  basicDataForm!: FormGroup;
  specificDataForm!: FormGroup;
  
  selectedUserType: string = '';
  isCreating = false;

  userTypes = [
    { value: UserType.COMERCIAL, label: 'Comercial', description: 'Ventas, marketing' },
    { value: UserType.LOGISTICA, label: 'Logística', description: 'Inventarios, almacén' },
    { value: UserType.FINANZAS, label: 'Finanzas', description: 'Contabilidad, tesorería, bancos, créditos y cobranzas' },
    { value: UserType.GERENCIA, label: 'Gerencia', description: 'EE.FF., Auditoría, Costos, Accesos' },
    { value: UserType.CONTABILIDAD, label: 'Contabilidad', description: 'Facturación, Libro de compras, Ventas, kardex, libros electrónicos' },
    { value: UserType.ADMINISTRACION, label: 'Administración', description: 'Empresas, proveedores, productos, categorías, precios' },
    { value: UserType.RECURSOS_HUMANOS, label: 'Recursos Humanos', description: 'Contratos, control de personal, capacitación, evaluación de desempeño' }
  ];

  documentTypes = [
    { value: DocumentType.DNI, label: 'DNI' },
    { value: DocumentType.RUC, label: 'RUC' },
    { value: DocumentType.CARNET_EXTRANJERIA, label: 'Carnet de Extranjería' },
    { value: DocumentType.PASAPORTE, label: 'Pasaporte' }
  ];

  constructor() {
    this.initializeForms();
  }

  initializeForms(): void {
    this.userTypeForm = this.fb.group({
      userType: ['', Validators.required]
    });

    this.basicDataForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      documentType: ['', Validators.required],
      documentNumber: ['', Validators.required],
      password: ['' ]
    });

    this.specificDataForm = this.fb.group({});
  }

  onUserTypeChange(userType: string): void {
    this.selectedUserType = userType;
    this.buildSpecificDataForm(userType);
  }

  buildSpecificDataForm(userType: string): void {
    const controls: any = {};

    switch (userType) {
      case UserType.COMERCIAL:
        controls.salesTeam = [''];
        controls.salesTarget = [''];
        break;
      
      case UserType.LOGISTICA:
        controls.inventoryLevel = ['basic'];
        break;
      
      case UserType.FINANZAS:
        controls.accountingAccess = [false];
        controls.treasuryAccess = [false];
        controls.bankAccess = [false];
        controls.creditAccess = [false];
        break;
      
      case UserType.GERENCIA:
        controls.auditAccess = [false];
        controls.costsAccess = [false];
        controls.financialStatementsAccess = [false];
        controls.systemAccessLevel = ['restricted'];
        break;
      
      case UserType.CONTABILIDAD:
        controls.billingAccess = [false];
        controls.purchaseBooksAccess = [false];
        controls.salesBooksAccess = [false];
        controls.kardexAccess = [false];
        controls.electronicBooksAccess = [false];
        break;
      
      case UserType.ADMINISTRACION:
        controls.companyManagement = [false];
        controls.supplierManagement = [false];
        controls.productManagement = [false];
        controls.categoryManagement = [false];
        controls.priceManagement = [false];
        break;
      
      case UserType.RECURSOS_HUMANOS:
        controls.contractsAccess = [false];
        controls.personnelControlAccess = [false];
        controls.trainingAccess = [false];
        controls.performanceEvaluationAccess = [false];
        break;
    }

    this.specificDataForm = this.fb.group(controls);
  }

  getSelectedUserTypeLabel(): string {
    const userType = this.userTypes.find(type => type.value === this.selectedUserType);
    return userType ? userType.label : '';
  }

  async createUser(): Promise<void> {
    if (!this.isFormsValid()) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.isCreating = true;

    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const userData = {
        ...this.basicDataForm.value,
        userType: this.userTypeForm.value.userType,
        specificData: this.specificDataForm.value
      };

      const newUserUid = await this.firebaseUserService.createUser(userData, currentUser.uid);

      this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
        duration: 3000
      });

      this.dialogRef.close({ success: true, userUid: newUserUid });

    } catch (error: any) {
      console.error('Error creating user:', error);
      this.snackBar.open(
        error.message || 'Error al crear usuario', 
        'Cerrar', 
        { duration: 5000 }
      );
    } finally {
      this.isCreating = false;
    }
  }

  private isFormsValid(): boolean {
    return this.userTypeForm.valid && 
           this.basicDataForm.valid && 
           this.specificDataForm.valid;
  }

  close(): void {
    this.dialogRef.close();
  }
}