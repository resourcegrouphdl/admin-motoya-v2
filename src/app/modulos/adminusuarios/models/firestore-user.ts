import { Timestamp } from '@angular/fire/firestore';
import { BaseProfile } from '../enums/user-type.types';

// Omit los campos de fecha y luego agrega los campos con tipo Timestamp
// Interface específica para los campos de fecha
interface TimestampFields {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastPasswordChange: Timestamp;
}

// La interfaz completa para el documento en Firestore
export type FirestoreUserProfile = {
  [K in keyof BaseProfile]: K extends keyof TimestampFields 
    ? TimestampFields[K] 
    : BaseProfile[K];
};
