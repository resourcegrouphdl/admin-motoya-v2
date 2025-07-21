import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { UserType } from '../../modelos/enums';
import { AccessLevel, RiskLevel } from '../modelos/enums';
import { UserService } from '../services/user.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

// Define or import the CreateUserDialogData interface


export interface CreateUserDialogData {
  userTypes: any[];
}

export interface UserCreationResult {
  userType: UserType;
  profile: any;
  additionalData: any;
}



@Component({
  selector: 'app-crear',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinner
  ],
  templateUrl: './crear.component.html',
  styleUrl: './crear.component.css'
})
export class CrearComponent {
  typeForm!: FormGroup;
  profileForm!: FormGroup;
  specificForm!: FormGroup;
  
  selectedUserType: UserType | null = null;
  isCreating = false;
  typeUserOptions = [
    { value: UserType.ADMIN, label: 'Administrador' },
    { value: UserType.STORE, label: 'Tienda' },
    { value: UserType.VENDOR, label: 'Vendedor' },
    { value: UserType.ACCOUNTANT, label: 'Contable' },
    { value: UserType.FINANCIAL, label: 'Analista Financiero' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CrearComponent>,
    private userService: UserService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: CreateUserDialogData
  ) {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.typeForm = this.fb.group({
      userType: ['', Validators.required]
    });

    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      documentType: ['dni', Validators.required],
      documentNumber: ['', Validators.required]
    });

    this.specificForm = this.fb.group({
      // Campos dinámicos según el tipo de usuario
    });
  }

  selectUserType(userType: UserType): void {
    this.selectedUserType = userType;
    this.typeForm.patchValue({ userType });
    this.updateSpecificForm(userType);
  }

  private updateSpecificForm(userType: UserType): void {
    this.specificForm = this.fb.group(this.getFormControlsForUserType(userType));
  }

  private getFormControlsForUserType(userType: UserType): any {
    switch (userType) {
      case UserType.VENDOR:
        return {
          employeeId: ['', Validators.required],
          commissionRate: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
          territory: ['', Validators.required],
          storeId: [''],
        };

      case UserType.FINANCIAL:
        return {
          approvalLimit: [200000, [Validators.required, Validators.min(0)]],
          riskLevel: [RiskLevel.MEDIUM, Validators.required],
          specializations: [[]],
          department: ['', Validators.required],
        };

      case UserType.ACCOUNTANT:
        return {
          accessLevel: [AccessLevel.JUNIOR, Validators.required],
          department: ['', Validators.required],
          specializations: [[]],
        };

      case UserType.STORE:
        return {
          storeName: ['', Validators.required],
          storeCode: ['', Validators.required],
          maxInventory: [1000, [Validators.required, Validators.min(1)]],
          address: ['', Validators.required],
        };

      default:
        return {};
    }
  }

  async createUser(): Promise<void> {
    if (!this.canCreateUser() || this.isCreating) {
      return;
    }

    this.isCreating = true;

    try {
      const profile = {
        ...this.profileForm.value,
        createdBy: 'current-user-id' // TODO: obtener del auth service
      };

      const additionalData = this.buildAdditionalData();
      
      const user = await this.userService.createUser(
        this.selectedUserType!,
        profile,
        additionalData
      );

      this.snackBar.open(
        `Usuario ${user.getFullName()} creado exitosamente`, 
        'Cerrar', 
        { duration: 5000 }
      );

      this.dialogRef.close(user);

    } catch (error) {
      console.error('Error creating user:', error);
      this.snackBar.open(
        'Error al crear el usuario. Por favor, inténtelo nuevamente.', 
        'Cerrar', 
        { duration: 5000 }
      );
    } finally {
      this.isCreating = false;
    }
  }

  private buildAdditionalData(): any {
    const specificData = this.specificForm.value;
    
    switch (this.selectedUserType) {
      case UserType.VENDOR:
        return {
          vendorInfo: {
            employeeId: specificData.employeeId,
            commissionRate: specificData.commissionRate / 100,
            territory: specificData.territory,
            hireDate: new Date()
          },
          storeAssignments: specificData.storeId ? [{
            storeId: specificData.storeId,
            storeName: this.getStoreName(specificData.storeId),
            assignedAt: new Date(),
            assignedBy: 'current-user-id',
            isActive: true,
            permissions: ['read', 'create', 'update']
          }] : []
        };

      case UserType.FINANCIAL:
        return {
          financialInfo: {
            specializations: specificData.specializations || [],
            approvalLimit: specificData.approvalLimit,
            riskLevel: specificData.riskLevel,
            certifications: [],
            department: specificData.department,
            analysisTools: []
          }
        };

      case UserType.ACCOUNTANT:
        return {
          accountantInfo: {
            accessLevel: specificData.accessLevel,
            specializations: specificData.specializations || [],
            certifications: [],
            department: specificData.department,
            canApproveTransactions: specificData.accessLevel === AccessLevel.SENIOR
          }
        };

      case UserType.STORE:
        return {
          storeInfo: {
            storeId: this.generateStoreId(),
            storeName: specificData.storeName,
            storeCode: specificData.storeCode,
            address: {
              street: specificData.address,
              city: 'Lima',
              state: 'Lima',
              zipCode: '15001',
              country: 'Peru'
            },
            maxInventory: specificData.maxInventory
          }
        };

      default:
        return {};
    }
  }

  canCreateUser(): boolean {
    return this.typeForm.valid && this.profileForm.valid && this.specificForm.valid;
  }

  private getStoreName(storeId: string): string {
    const storeNames: Record<string, string> = {
      'store1': 'Tienda Lima Norte',
      'store2': 'Tienda Lima Sur', 
      'store3': 'Tienda Callao'
    };
    return storeNames[storeId] || 'Tienda Sin Nombre';
  }

  private generateStoreId(): string {
    return 'store_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}