import { AlertaExpediente } from './alerta-expediente';
import { EstadoExpedienteCalculado } from './estado-expediente-calculado';
import { Persona } from './persona';
import { Referencia } from './referencia';
import { Solicitud } from './solicitud';
import { Vehiculo } from './vehiculo';
import { MetricasExpediente } from './metricas-expediente';

export interface Expediente {
  
  readonly solicitud: Solicitud;
  readonly titular: Persona;
  readonly fiador?: Persona;
  readonly vehiculo: Vehiculo;
  readonly referencias: readonly Referencia[];

  // Estado calculado del expediente completo
  readonly estadoExpediente: EstadoExpedienteCalculado;

  // Alertas consolidadas
  readonly alertas: readonly AlertaExpediente[];

  // Métricas del proceso
  readonly metricas: MetricasExpediente;
}
