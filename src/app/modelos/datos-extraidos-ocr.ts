export interface DatosExtraidosOCR {
    readonly numeroDocumento?: string;
  readonly nombres?: string;
  readonly apellidos?: string;
  readonly fechaNacimiento?: string;
  readonly direccion?: string;
  readonly [campo: string]: any;
}
