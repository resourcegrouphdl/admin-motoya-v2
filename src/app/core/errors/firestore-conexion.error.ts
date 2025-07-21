import { AppError } from "./app-error";

export class VendedorExistenteError extends AppError {
  constructor() {
    super('VENDEDOR_EXISTENTE', 'Ya existe un vendedor con ese DNI');
  }
}