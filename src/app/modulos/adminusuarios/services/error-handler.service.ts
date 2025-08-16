import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface AppError {
  code: string;
  message: string;
  originalError?: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  private snackBar = inject(MatSnackBar);

  handleError(error: any, context?: string): AppError {
    const appError = this.parseError(error, context);
    
    console.error(`[${context || 'App'}] Error:`, appError);
    
    // Mostrar error al usuario
    this.showErrorToUser(appError.message);
    
    return appError;
  }

  private parseError(error: any, context?: string): AppError {
    const timestamp = new Date();
    
    // Errores de Firebase Auth
    if (error.code && error.code.startsWith('auth/')) {
      return {
        code: error.code,
        message: this.getAuthErrorMessage(error.code),
        originalError: error,
        timestamp
      };
    }
    
    // Errores de Firestore
    if (error.code && (error.code.startsWith('firestore/') || 
                       error.code === 'permission-denied' || 
                       error.code === 'unavailable')) {
      return {
        code: error.code,
        message: this.getFirestoreErrorMessage(error.code),
        originalError: error,
        timestamp
      };
    }
    
    // Errores de red
    if (error.code === 'network-request-failed' || 
        error.message?.includes('network') ||
        error.message?.includes('Network')) {
      return {
        code: 'network-error',
        message: 'Error de conexión. Verifique su internet y vuelva a intentar.',
        originalError: error,
        timestamp
      };
    }
    
    // Errores personalizados de la app
    if (error.message && typeof error.message === 'string') {
      return {
        code: error.code || 'app-error',
        message: error.message,
        originalError: error,
        timestamp
      };
    }
    
    // Error genérico
    return {
      code: 'unknown-error',
      message: 'Ha ocurrido un error inesperado. Intente nuevamente.',
      originalError: error,
      timestamp
    };
  }

  private getAuthErrorMessage(code: string): string {
    const authErrors: { [key: string]: string } = {
      'auth/email-already-in-use': 'Este email ya está registrado en el sistema',
      'auth/invalid-email': 'El formato del email no es válido',
      'auth/operation-not-allowed': 'Esta operación no está permitida',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/user-not-found': 'No existe un usuario con este email',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intente más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifique su internet',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/credential-already-in-use': 'Estas credenciales ya están en uso',
      'auth/invalid-verification-code': 'Código de verificación inválido',
      'auth/invalid-verification-id': 'ID de verificación inválido',
      'auth/missing-verification-code': 'Falta el código de verificación',
      'auth/missing-verification-id': 'Falta el ID de verificación'
    };

    return authErrors[code] || `Error de autenticación: ${code}`;
  }

  private getFirestoreErrorMessage(code: string): string {
    const firestoreErrors: { [key: string]: string } = {
      'permission-denied': 'No tiene permisos para realizar esta operación',
      'unavailable': 'El servicio no está disponible. Intente más tarde',
      'unauthenticated': 'Debe iniciar sesión para continuar',
      'not-found': 'El documento solicitado no existe',
      'already-exists': 'El documento ya existe',
      'resource-exhausted': 'Se ha excedido el límite de recursos',
      'failed-precondition': 'La operación falló por una condición previa',
      'aborted': 'La operación fue cancelada',
      'out-of-range': 'El valor está fuera del rango permitido',
      'internal': 'Error interno del servidor',
      'data-loss': 'Se perdieron datos durante la operación'
    };

    return firestoreErrors[code] || `Error de base de datos: ${code}`;
  }

  private showErrorToUser(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showWarning(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showInfo(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
