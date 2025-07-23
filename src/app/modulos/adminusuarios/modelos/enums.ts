// ===== MODELOS BASE Y ENUMS =====

export enum UserType {
  ADMIN = 'admin',
  STORE = 'store',
  VENDOR = 'vendor',
  ACCOUNTANT = 'accountant',
  FINANCIAL = 'financial'
}

export enum AccessLevel {
  JUNIOR = 'junior',
  SENIOR = 'senior',
  MANAGER = 'manager'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  BLOCKED = 'blocked',
  SUSPENDED = 'suspended'
}

export enum DocumentType {
  DNI = 'dni',
  CE = 'ce', // Carné de Extranjería
  PASSPORT = 'passport',
  RUC = 'ruc'
}