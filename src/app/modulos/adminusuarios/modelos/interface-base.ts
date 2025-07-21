import { UserType } from "./enums";

export interface BaseProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  userType: UserType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  storeIds?: string[]; // Para agrupar por tiendas
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
