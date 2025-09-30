import { Timestamp } from "./tipes";
import { ValidacionMTC } from "./validacion-mtc";
import { ValidacionReniec } from "./validacion-reniec";
import { ValidacionSBS } from "./validacion-sbs";

export interface ValidacionesExternas {
  readonly reniec?: ValidacionReniec;
  readonly sbs?: ValidacionSBS;
  readonly mtc?: ValidacionMTC;
  readonly todasCompletas: boolean;
  readonly ultimaValidacion: Timestamp;
}
