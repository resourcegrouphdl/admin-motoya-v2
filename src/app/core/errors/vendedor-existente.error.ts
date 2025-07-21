import { AppError } from "./app-error";

export class ErrorDeConexionFirestore extends AppError {
  constructor() {
    super('ERROR_CONEXION_FIRESTORE', 'Error de conexión con la base de datos');
  }
}