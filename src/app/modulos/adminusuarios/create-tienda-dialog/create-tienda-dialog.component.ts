import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { ExternalUserService } from '../services/external-user.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { Auth } from '@angular/fire/auth';
import { CreateTiendaRequest, DocumentType } from '../enums/user-type.types';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStep, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgIf } from '@angular/common';

import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-create-tienda-dialog',
  standalone: true,
  imports: [
    MatDividerModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatInputModule,
    MatStepperModule,
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatDialogModule,
    NgIf,
    MatStep,
    MatFormFieldModule,
    MatSelectModule,
    MatStepper,
  ],
  templateUrl: './create-tienda-dialog.component.html',
  styleUrl: './create-tienda-dialog.component.css',
})
export class CreateTiendaDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateTiendaDialogComponent>);
  private externalUsersService = inject(ExternalUserService);
  private errorHandler = inject(ErrorHandlerService);
  private auth = inject(Auth);

  representativeForm!: FormGroup;
  businessForm!: FormGroup;
  locationForm!: FormGroup;
  commercialForm!: FormGroup;
  additionalForm!: FormGroup;

  isCreating = false;

  documentTypes = [
    { value: DocumentType.DNI, label: 'DNI' },
    { value: DocumentType.RUC, label: 'RUC' },
    { value: DocumentType.CARNET_EXTRANJERIA, label: 'Carnet de Extranjería' },
    { value: DocumentType.PASAPORTE, label: 'Pasaporte' },
  ];

  

  cities = [
    'Lima',
    'Arequipa',
    'Trujillo',
    'Chiclayo',
    'Piura',
    'Iquitos',
    'Cusco',
    'Huancayo',
    'Chimbote',
    'Tacna',
    'Ica',
    'Juliaca',
    'Sullana',
    'Ayacucho',
    'Cajamarca',
    'Pucallpa',
    'Huánuco',
  ];

  paymentMethods = [
    'Transferencia Bancaria',
    'Depósito en Cuenta',
    'Billetera Digital',
    'Cheque',
    'Efectivo',
  ];

  constructor() {
    this.initializeForms();
  }

  initializeForms(): void {
    this.representativeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      documentType: ['', Validators.required],
      documentNumber: ['', [Validators.required, Validators.minLength(8)]],
      password: ['12345678', ],
    });

    this.businessForm = this.fb.group({
      businessName: ['', [Validators.required, Validators.minLength(3)]],
      taxId: [''],
      
    });

    this.locationForm = this.fb.group({
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],
      district: ['', [Validators.required, Validators.minLength(3)]],
      postalCode: [''],
      latitude: [''],
      longitude: [''],
    });

    this.commercialForm = this.fb.group({
      
      bankAccount: [''],
      contactPersonName: ['', [Validators.required, Validators.minLength(3)]],
      contactPersonPhone: [
        '',
        [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)],
      ],
    });

    this.additionalForm = this.fb.group({
      website: [''],
      facebook: [''],
      instagram: [''],
      whatsapp: [''],
      notes: [''],
    });
  }

  getRepresentativeName(): string {
    const firstName = this.representativeForm.get('firstName')?.value || '';
    const lastName = this.representativeForm.get('lastName')?.value || '';
    return `${firstName} ${lastName}`.trim();
  }

  async createTienda(): Promise<void> {
    if (!this.isFormsValid()) {
      this.errorHandler.showWarning(
        'Por favor complete todos los campos requeridos'
      );
      return;
    }

    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      this.errorHandler.handleError(
        new Error('Usuario no autenticado'),
        'CreateTienda'
      );
      return;
    }

    this.isCreating = true;

    try {
      const tiendaData: CreateTiendaRequest = {
        // Datos del representante
        ...this.representativeForm.value,

        // Datos del negocio
        ...this.businessForm.value,
        specializations: this.parseSpecializations(
          this.businessForm.get('specializations')?.value
        ),

        // Ubicación
        ...this.locationForm.value,
        coordinates: this.getCoordinates(),

        // Comercial
        ...this.commercialForm.value,

        // Adicional
        website: this.additionalForm.get('website')?.value,
        socialMedia: {
          facebook: this.additionalForm.get('facebook')?.value,
          instagram: this.additionalForm.get('instagram')?.value,
          whatsapp: this.additionalForm.get('whatsapp')?.value,
        },
        notes: this.additionalForm.get('notes')?.value,
      };

      console.log('🏪 Creando tienda con datos:', tiendaData);

      const result = await this.externalUsersService.createTienda(
        tiendaData,
        currentUser.uid
      );

      if (result.success) {
        this.errorHandler.showSuccess('Tienda creada exitosamente');
        this.dialogRef.close({ success: true, tiendaUid: result.uid });
      } else {
        this.errorHandler.handleError(new Error(result.error), 'CreateTienda');
      }
    } catch (error: any) {
      console.error('❌ Error en createTienda:', error);
      this.errorHandler.handleError(error, 'CreateTienda');
    } finally {
      this.isCreating = false;
    }
  }

  private isFormsValid(): boolean {
    const representativeValid = this.representativeForm.valid;
    const businessValid = this.businessForm.valid;
    const locationValid = this.locationForm.valid;
    const commercialValid = this.commercialForm.valid;

    // Marcar campos como touched para mostrar errores
    if (!representativeValid) this.representativeForm.markAllAsTouched();
    if (!businessValid) this.businessForm.markAllAsTouched();
    if (!locationValid) this.locationForm.markAllAsTouched();
    if (!commercialValid) this.commercialForm.markAllAsTouched();

    return (
      representativeValid && businessValid && locationValid && commercialValid
    );
  }

  private parseSpecializations(specializations: string): string[] {
    if (!specializations) return [];
    return specializations
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private getCoordinates(): { lat: number; lng: number } | undefined {
    const lat = this.locationForm.get('latitude')?.value;
    const lng = this.locationForm.get('longitude')?.value;

    if (lat && lng) {
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    return undefined;
  }

  close(): void {
    this.dialogRef.close();
  }
}
