export const SYSTEM_CONSTANTS = {
  MAX_USERS_PER_STORE: 50,
  MAX_STORES_PER_VENDOR: 5,
  DEFAULT_COMMISSION_RATE: 0.05,
  DEFAULT_APPROVAL_LIMIT: 200000,
  PASSWORD_MIN_LENGTH: 8,
  SESSION_TIMEOUT_MINUTES: 60,
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 25,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
  },
  
  DATE_FORMATS: {
    DISPLAY: 'dd/MM/yyyy',
    DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
    API: 'yyyy-MM-dd',
    FILE_NAME: 'yyyyMMdd'
  },
  
  FILE_LIMITS: {
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf']
  }
};

// ===== MENSAJES DEL SISTEMA =====

export const SYSTEM_MESSAGES = {
  SUCCESS: {
    USER_CREATED: 'Usuario creado exitosamente',
    USER_UPDATED: 'Usuario actualizado exitosamente',
    USER_DELETED: 'Usuario eliminado exitosamente',
    PASSWORD_RESET: 'Email de restablecimiento enviado',
    EXPORT_COMPLETED: 'Exportación completada exitosamente'
  },
  
  ERROR: {
    USER_NOT_FOUND: 'Usuario no encontrado',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    ACCESS_DENIED: 'Acceso denegado',
    SERVER_ERROR: 'Error del servidor. Inténtelo nuevamente',
    NETWORK_ERROR: 'Error de conexión. Verifique su internet'
  },
  
  WARNING: {
    UNSAVED_CHANGES: 'Tiene cambios sin guardar',
    DELETE_CONFIRMATION: '¿Está seguro de eliminar este usuario?',
    DEACTIVATE_CONFIRMATION: '¿Está seguro de desactivar este usuario?'
  },
  
  INFO: {
    LOADING: 'Cargando...',
    NO_DATA: 'No hay datos disponibles',
    FILTERS_APPLIED: 'Filtros aplicados',
    SEARCH_RESULTS: 'resultados encontrados'
  }
};