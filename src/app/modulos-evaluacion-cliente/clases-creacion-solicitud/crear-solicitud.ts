import { serverTimestamp } from '@angular/fire/firestore';
import { EstadoSolicitud, Prioridad } from '../../modelos/estado-solicitud';
import { Solicitud } from '../../modelos/solicitud';

export class CrearSolicitud {
  private solicitud: Solicitud;

  constructor() {
    this.solicitud = {
      id: '',
      idSemilla:"",
      numero: '',
      estado: EstadoSolicitud.PENDIENTE,
      prioridad: Prioridad.MEDIA,
      titularId: 'id',
      fiadorId: 'id',
      vehiculoId: 'id',
      vendedorId: 'id',
      tienda: 'id',
      referencias: [],
      datosFinancieros: 'id',  //
      asesorAsignadoId: 'id',
      evaluadorActualId: 'id',
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
      fechaAsignacion: serverTimestamp(),
      fechaLimiteEvaluacion: serverTimestamp(),
      evaluacion: 'id',
      decision: 'id',
      certificadoGenerado: false,
      urlCertificado: '',
      contratoGenerado: false,
      urlContrato: '',
      evidenciasGeneradas: false,
      urlEvidencias: [],
      entregaCompletada: false,
      fechaEntregaReal: serverTimestamp(),
      estadoCalculado: 'id',
      create_at: serverTimestamp(),
      update_at: serverTimestamp(),
    };
  }

  conId(idGenerado: string) {
    this.solicitud.id = idGenerado;
    return this;
  }

  conNumero(numero: string) {
    this.solicitud.numero = numero;
    return this;
  }
  conIdSemilla(idSemilla: string){
    this.solicitud.idSemilla = idSemilla;
    return this;
  }
  
  conVendedorId(vendedorId: string) {
    this.solicitud.vendedorId = vendedorId;
    return this;
  }
  conTiendaId(tiendaId: string) {
    this.solicitud.tienda = tiendaId;
    return this;
  }

  build(): Solicitud {
    return this.solicitud;
  }
}
