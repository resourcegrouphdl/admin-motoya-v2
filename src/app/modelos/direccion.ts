export interface Direccion {
  readonly direccion: string;
  readonly distrito: string;
  readonly provincia: string;
  readonly departamento: string;
  readonly tipoVivienda: 'propia' | 'alquilada' | 'familiar' | 'otro';
  readonly direccionCompleta: string; // calculado
}
