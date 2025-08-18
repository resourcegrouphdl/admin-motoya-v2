import { Component, inject, OnDestroy } from '@angular/core';
import { 
  FormBuilder, 
  ReactiveFormsModule, 
  FormGroup, 
  Validators,
  AbstractControl 
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../services/auth-service.service';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnDestroy {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  private readonly _loginService = inject(AuthServiceService);
  private readonly _router = inject(Router);
  private readonly _fb = inject(FormBuilder);

  constructor() {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.loginForm = this._fb.group({
      email: [
        '', 
        [
          Validators.required, 
          Validators.email,
          Validators.minLength(3)
        ]
      ],
      password: [
        '', 
        [
          Validators.required, 
          Validators.minLength(6)
        ]
      ],
      remember: [false]
    });
  }

  // Getters para facilitar el acceso a los controles
  get email(): AbstractControl | null {
    return this.loginForm.get('email');
  }

  get password(): AbstractControl | null {
    return this.loginForm.get('password');
  }

  get remember(): AbstractControl | null {
    return this.loginForm.get('remember');
  }

  // Método para obtener mensajes de error específicos
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'Email' : 'Password'} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email no válido';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Mínimo ${requiredLength} caracteres requeridos`;
      }
    }
    return '';
  }

  // Método para verificar si un campo tiene errores
  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Método para verificar si un campo es válido
  isFieldValid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.valid && field.touched);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor, corrija los errores en el formulario';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    const { email, password } = this.loginForm.value;

    this._loginService
      .userLoginForFirebase(email, password)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (userData) => {
          console.log('Login exitoso:', userData);
          
          // Guardar estado de "recordarme" si está activado
          if (this.remember?.value) {
            localStorage.setItem('rememberUser', 'true');
            localStorage.setItem('userEmail', email);
          } else {
            localStorage.removeItem('rememberUser');
            localStorage.removeItem('userEmail');
          }

          this._router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error en login:', error);
          this.handleLoginError(error);
        }
      });
  }

  private handleLoginError(error: any): void {
    // Mapear códigos de error específicos de Firebase
    const errorCode = error?.code || error?.error?.code;
    
    switch (errorCode) {
      case 'auth/user-not-found':
        this.errorMessage = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        this.errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        this.errorMessage = 'Email no válido';
        break;
      case 'auth/user-disabled':
        this.errorMessage = 'Usuario deshabilitado';
        break;
      case 'auth/too-many-requests':
        this.errorMessage = 'Demasiados intentos fallidos. Intente más tarde';
        break;
      case 'auth/network-request-failed':
        this.errorMessage = 'Error de conexión. Verifique su internet';
        break;
      default:
        this.errorMessage = 'Error al iniciar sesión. Intente nuevamente';
    }
  }

  // Método para cargar datos recordados (llamar en ngOnInit si es necesario)
  private loadRememberedUser(): void {
    if (localStorage.getItem('rememberUser') === 'true') {
      const savedEmail = localStorage.getItem('userEmail');
      if (savedEmail) {
        this.loginForm.patchValue({
          email: savedEmail,
          remember: true
        });
      }
    }
  }

  // Método para limpiar el formulario
  resetForm(): void {
    this.loginForm.reset();
    this.errorMessage = '';
  }
}