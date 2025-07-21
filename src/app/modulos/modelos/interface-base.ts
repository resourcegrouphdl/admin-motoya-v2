// ====================================================================
// INTERFACES BASE
// ====================================================================

export interface IUserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  documentType?: 'dni' | 'passport' | 'license';
  documentNumber?: string;
  birthDate?: Date;
  address?: IAddress;
  emergencyContact?: IEmergencyContact;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  district?: string;
  reference?: string;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface IUserMetadata {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  lastLogin?: Date;
  loginAttempts?: number;
  lastPasswordChange?: Date;
  version: number;
}