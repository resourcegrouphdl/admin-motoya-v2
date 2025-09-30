export interface ConfiguracionDocumento {
  readonly esRequerido: boolean;
  readonly etapaProceso: number; // 1-10
  readonly requiereValidacionManual: boolean;
  readonly requiereValidacionAutomatica: boolean;
  readonly formatosPermitidos: readonly string[];
  readonly tamanioMaximoMB: number;
}
