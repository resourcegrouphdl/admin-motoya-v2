import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-user-personal-info',
  standalone: true,
  imports: [MatIcon, MatError, MatOption, MatFormField, MatSelect, MatLabel, NgIf, ReactiveFormsModule],
  templateUrl: './user-personal-info.component.html',
  styleUrl: './user-personal-info.component.scss',
})
export class UserPersonalInfoComponent implements OnInit {
  @Input() profileForm!: FormGroup;
  @Output() previousStep = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();

  fb = inject(FormBuilder)

  documentTypes = [
    { value: 'dni', label: 'DNI' },
    { value: 'ce', label: 'Carné de Extranjería' },
    { value: 'passport', label: 'Pasaporte' },
    { value: 'ruc', label: 'RUC' },
  ];
  ngOnInit() {
    // Si no se pasa el form desde el padre, crearlo aquí
    if (!this.profileForm) {
      this.createForm();
    }
  }

   createForm() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      documentType: ['', Validators.required],
      documentNumber: ['', Validators.required]
    });
  }
  onPrevious() {
    this.previousStep.emit();
  }

  onNext() {
    if (this.profileForm.valid) {
      this.nextStep.emit();
    }
  }

  // Método para obtener errores específicos
  getFieldError(fieldName: string, errorType: string): boolean {
    return this.profileForm.get(fieldName)?.hasError(errorType) ?? false;
  }

  // Método para verificar si el campo fue tocado
 
}
