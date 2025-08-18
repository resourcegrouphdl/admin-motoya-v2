import { ClienteWeb, EstadoCliente } from "../models/clientes-web.interface";

export class ClienteMapper {
  static mapFirebaseToClienteWeb(firebaseData: any): ClienteWeb {
    console.log('🔍 [ClienteMapper] DATOS ORIGINALES:', firebaseData);
    
    // VALIDAR que los datos existen
    if (!firebaseData) {
      console.error('❌ [ClienteMapper] firebaseData es null o undefined');
      return {};
    }
    
    // Validar campos esenciales
    if (!firebaseData.email) {
      console.warn('⚠️ [ClienteMapper] Cliente sin email:', firebaseData.id);
    }
    
    if (!firebaseData.nombres && !firebaseData.apellidos) {
      console.warn('⚠️ [ClienteMapper] Cliente sin nombres ni apellidos:', firebaseData.id);
    }
    
    // Combinar nombres SOLO si existen
    let nombreCompleto = '';
    if (firebaseData.nombres || firebaseData.apellidos) {
      nombreCompleto = `${firebaseData.nombres || ''} ${firebaseData.apellidos || ''}`.trim();
    }
    
    console.log('🔧 [ClienteMapper] Procesando:', {
      id: firebaseData.id,
      nombres: firebaseData.nombres,
      apellidos: firebaseData.apellidos,
      nombreCompleto: nombreCompleto,
      email: firebaseData.email,
      tieneEmail: !!firebaseData.email,
      tieneNombres: !!firebaseData.nombres,
      tieneApellidos: !!firebaseData.apellidos
    });
    
    const clienteMapeado: ClienteWeb = {
      id: firebaseData.id,
      
      // ⭐ MAPEO SEGURO - solo asignar si existe
      ...(nombreCompleto && { nombre: nombreCompleto }),
      ...(firebaseData.email && { email: firebaseData.email }),
      ...(firebaseData.telefono && { telefono: firebaseData.telefono }),
      
      // Estado con valor por defecto
      estado: firebaseData.estado || EstadoCliente.NUEVO,
      
      // Campos del admin (pueden no existir)
      ...(firebaseData.vendedorAsignado && { vendedorAsignado: firebaseData.vendedorAsignado }),
      ...(firebaseData.nombreVendedor && { nombreVendedor: firebaseData.nombreVendedor }),
      ...(firebaseData.notas && { notas: firebaseData.notas }),
      
      // Origen con valor por defecto
      origen: firebaseData.origen || 'Web',
      
      // Fechas
      fechaRegistro: firebaseData.fechaRegistro || new Date(),
      ...(firebaseData.ultimoContacto && { ultimoContacto: firebaseData.ultimoContacto }),
      ...(firebaseData.fechaAsignacion && { fechaAsignacion: firebaseData.fechaAsignacion }),
      ...(firebaseData.ultimaActualizacion && { ultimaActualizacion: firebaseData.ultimaActualizacion }),
      
      // ⭐ PRESERVAR TODOS LOS CAMPOS ORIGINALES DE FIREBASE
      ...(firebaseData.apellidos && { apellidos: firebaseData.apellidos }),
      ...(firebaseData.nombres && { nombres: firebaseData.nombres }),
      ...(firebaseData.edad && { edad: firebaseData.edad }),
      ...(firebaseData.genero && { genero: firebaseData.genero }),
      ...(firebaseData.horarioContacto && { horarioContacto: firebaseData.horarioContacto }),
      ...(firebaseData.mensaje && { mensaje: firebaseData.mensaje }),
      ...(firebaseData.numeroDocumento && { numeroDocumento: firebaseData.numeroDocumento }),
      ...(firebaseData.preferenciaContacto && { preferenciaContacto: firebaseData.preferenciaContacto }),
      ...(firebaseData.producto && { producto: firebaseData.producto }),
      ...(firebaseData.tipoDocumento && { tipoDocumento: firebaseData.tipoDocumento }),
      
      // El mensaje es el interés
      ...(firebaseData.mensaje && { interes: firebaseData.mensaje })
    };
    
    console.log('✅ [ClienteMapper] CLIENTE MAPEADO:', clienteMapeado);
    
    return clienteMapeado;
  }
}