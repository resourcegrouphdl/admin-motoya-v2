import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  UserType,
  DocumentType,
  CreateVendedorRequest,
} from '../enums/user-type.types';
import { Auth } from '@angular/fire/auth';
import { ErrorHandlerService } from '../services/error-handler.service';
import { ExternalUserService } from '../services/external-user.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStep, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MatDatepicker } from '@angular/material/datepicker';
import { NgFor, NgIf } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { CommonModule } from '@angular/common';

import { MatStepperModule } from '@angular/material/stepper';

import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatChipsModule } from '@angular/material/chips';

export interface CreateVendedorDialogData {
  preselectedTiendaId?: string;
}

@Component({
  selector: 'app-create-vendedor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatStepperModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    MatDialogModule,
    MatStep,
    MatFormFieldModule,
    MatOptionModule,
    MatSelect,
    MatDatepicker,
    MatStepper,
  ],
  templateUrl: './create-vendedor-dialog.component.html',
  styleUrl: './create-vendedor-dialog.component.css',
})
export class CreateVendedorDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateVendedorDialogComponent>);
  private data = inject(MAT_DIALOG_DATA) as CreateVendedorDialogData;
  private externalUsersService = inject(ExternalUserService);
  private errorHandler = inject(ErrorHandlerService);
  private auth = inject(Auth);

  personalForm!: FormGroup;
  tiendaForm!: FormGroup;
  laboralForm!: FormGroup;
  contactForm!: FormGroup;

  educationLevels: any[] = [];

  isCreating = false;
  availableTiendas: Array<{ value: string; label: string }> = [];
  selectedTiendaInfo: any = null;

  documentTypes = [
    { value: DocumentType.DNI, label: 'DNI' },
    { value: DocumentType.CARNET_EXTRANJERIA, label: 'Carnet de Extranjería' },
    { value: DocumentType.PASAPORTE, label: 'Pasaporte' },
  ];

  positions = [
    'Vendedor',
    'Vendedor Senior',
    'Supervisor de Ventas',
    'Cajero',
    'Asistente de Ventas',
    'Coordinador de Tienda',
    'Encargado de Sección',
    'Asesor Comercial',
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
  ];

  relationships = [
    'Padre/Madre',
    'Hermano/Hermana',
    'Esposo/Esposa',
    'Hijo/Hija',
    'Abuelo/Abuela',
    'Tío/Tía',
    'Primo/Prima',
    'Amigo/Amiga',
    'Vecino/Vecina',
    'Otro',
  ];

  constructor() {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadAvailableTiendas();
  }

  initializeForms(): void {
    this.personalForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      documentType: [DocumentType.DNI, Validators.required],
      documentNumber: ['', [Validators.required, Validators.minLength(8)]],
      birthDate: [''],
      gender: [''],
    });

    this.tiendaForm = this.fb.group({
      tiendaId: [this.data?.preselectedTiendaId || '', Validators.required],
      position: ['', Validators.required],
      employeeId: [''],
    });

    this.laboralForm = this.fb.group({
      commissionRate: [
        '',
        [Validators.required, Validators.min(0), Validators.max(50)],
      ],
      salesGoal: [''],
      experience: [''],
      education: [''],
      languages: [''],
      skills: [''],
    });

    this.contactForm = this.fb.group({
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],
      district: ['', [Validators.required, Validators.minLength(3)]],
      emergencyContactName: [
        '',
        [Validators.required, Validators.minLength(3)],
      ],
      emergencyContactPhone: [
        '',
        [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)],
      ],
      emergencyContactRelationship: ['', Validators.required],
      notes: [''],
    });

    // Si hay tienda preseleccionada, cargar su información
    if (this.data?.preselectedTiendaId) {
      this.onTiendaChange();
    }
  }

  async loadAvailableTiendas(): Promise<void> {
    try {
      this.availableTiendas =
        await this.externalUsersService.getTiendasForSelector();

      if (this.availableTiendas.length === 0) {
        this.errorHandler.showWarning(
          'No hay tiendas activas disponibles. Debe crear una tienda primero.'
        );
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'LoadAvailableTiendas');
    }
  }

  async onTiendaChange(): Promise<void> {
    const tiendaId = this.tiendaForm.get('tiendaId')?.value;
    if (!tiendaId) {
      this.selectedTiendaInfo = null;
      return;
    }

    try {
      const tiendaWithVendedores =
        await this.externalUsersService.getTiendaWithVendedores(tiendaId);
      this.selectedTiendaInfo = tiendaWithVendedores;
    } catch (error) {
      console.error('Error loading tienda info:', error);
      this.selectedTiendaInfo = null;
    }
  }

  getVendedorName(): string {
    const firstName = this.personalForm.get('firstName')?.value || '';
    const lastName = this.personalForm.get('lastName')?.value || '';
    return `${firstName} ${lastName}`.trim();
  }

  getSelectedTiendaName(): string {
    const tiendaId = this.tiendaForm.get('tiendaId')?.value;
    const tienda = this.availableTiendas.find((t) => t.value === tiendaId);
    return tienda ? tienda.label : 'No seleccionada';
  }

  async createVendedor(): Promise<void> {
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
        'CreateVendedor'
      );
      return;
    }

    this.isCreating = true;

    try {
      const vendedorData: CreateVendedorRequest = {
        // Datos personales
        ...this.personalForm.value,

        // Asignación de tienda
        ...this.tiendaForm.value,

        // Configuración laboral
        ...this.laboralForm.value,
        languages: this.parseList(this.laboralForm.get('languages')?.value),
        skills: this.parseList(this.laboralForm.get('skills')?.value),

        // Datos de contacto
        address: this.contactForm.get('address')?.value,
        city: this.contactForm.get('city')?.value,
        district: this.contactForm.get('district')?.value,
        notes: this.contactForm.get('notes')?.value,

        // Contacto de emergencia
        emergencyContact: {
          name: this.contactForm.get('emergencyContactName')?.value,
          phone: this.contactForm.get('emergencyContactPhone')?.value,
          relationship: this.contactForm.get('emergencyContactRelationship')
            ?.value,
        },
      };

      console.log('👤 Creando vendedor con datos:', vendedorData);

      const result = await this.externalUsersService.createVendedor(
        vendedorData,
        currentUser.uid
      );

      if (result.success) {
        this.errorHandler.showSuccess('Vendedor creado exitosamente');
        this.dialogRef.close({ success: true, vendedorUid: result.uid });
      } else {
        this.errorHandler.handleError(
          new Error(result.error),
          'CreateVendedor'
        );
      }
    } catch (error: any) {
      console.error('❌ Error en createVendedor:', error);
      this.errorHandler.handleError(error, 'CreateVendedor');
    } finally {
      this.isCreating = false;
    }
  }

  private isFormsValid(): boolean {
    const personalValid = this.personalForm.valid;
    const tiendaValid = this.tiendaForm.valid;
    const laboralValid = this.laboralForm.valid;
    const contactValid = this.contactForm.valid;

    // Marcar campos como touched para mostrar errores
    if (!personalValid) this.personalForm.markAllAsTouched();
    if (!tiendaValid) this.tiendaForm.markAllAsTouched();
    if (!laboralValid) this.laboralForm.markAllAsTouched();
    if (!contactValid) this.contactForm.markAllAsTouched();

    return personalValid && tiendaValid && laboralValid && contactValid;
  }

  private parseList(value: string): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  close(): void {
    this.dialogRef.close();
  }
}
