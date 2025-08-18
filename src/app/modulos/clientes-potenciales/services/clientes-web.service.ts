import { Injectable } from '@angular/core';
import { catchError, map, Observable, take, tap } from 'rxjs';
import {
  ClienteWeb,
  EstadoCliente,
  Vendedor,
} from '../models/clientes-web.interface';
import {
  collectionData,
  Timestamp,
  Firestore,
  collection,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
} from '@angular/fire/firestore';
import { ClienteMapper } from './ClienteMapper';
import { BaseProfile } from '../../adminusuarios/enums/user-type.types';

@Injectable({
  providedIn: 'root',
})
export class ClientesWebService {
  
  constructor(private firestore: Firestore) {}

  // Obtener todos los clientes web
  getClientesWeb(): Observable<ClienteWeb[]> {
  console.log('🔄 [ClientesWebService] Iniciando carga de clientes...');
  
  const clientesRef = collection(this.firestore, 'clientesweb');
  
  // ⭐ QUITAR EL orderBy TEMPORALMENTE HASTA QUE TODOS LOS DOCS TENGAN fechaRegistro
  // const q = query(clientesRef, orderBy('fechaRegistro', 'desc')); // ❌ ESTO CAUSA EL PROBLEMA
  const q = query(clientesRef); // ✅ QUERY SIMPLE SIN ORDENAMIENTO
  
  console.log('📋 [ClientesWebService] Query configurado SIN orderBy (temporal)');
  
  return collectionData(q, { idField: 'id' }).pipe(
    tap(clientesRaw => {
      console.log('📊 [ClientesWebService] DATOS RAW RECIBIDOS:', clientesRaw);
      console.log('📊 [ClientesWebService] Cantidad de documentos:', clientesRaw.length);
      
      if (clientesRaw.length === 0) {
        console.warn('⚠️ [ClientesWebService] ARRAY VACÍO - Problema con el query');
      } else {
        console.log('🎉 [ClientesWebService] ¡DATOS RECIBIDOS CORRECTAMENTE!');
        console.log('🔍 [ClientesWebService] PRIMER DOCUMENTO:', clientesRaw[0]);
      }
    }),
    map((clientesRaw: any[]) => {
      console.log('🔄 [ClientesWebService] Iniciando mapeo de datos...');
      
      if (clientesRaw.length === 0) {
        console.log('⚠️ [ClientesWebService] Array vacío, retornando array vacío');
        return [];
      }
      
      const clientesMapeados = clientesRaw.map((clienteRaw, index) => {
        console.log(`🔧 [ClientesWebService] Mapeando cliente ${index + 1}/${clientesRaw.length}`);
        
        // ⭐ USAR EL MAPPER CORREGIDO
        const clienteMapeado = ClienteMapper.mapFirebaseToClienteWeb(clienteRaw);
        
        // Convertir timestamps a Date (si existen)
        if (clienteMapeado.fechaRegistro instanceof Timestamp) {
          clienteMapeado.fechaRegistro = clienteMapeado.fechaRegistro.toDate();
        }
        if (clienteMapeado.ultimoContacto instanceof Timestamp) {
          clienteMapeado.ultimoContacto = clienteMapeado.ultimoContacto.toDate();
        }
        if (clienteMapeado.fechaAsignacion instanceof Timestamp) {
          clienteMapeado.fechaAsignacion = clienteMapeado.fechaAsignacion.toDate();
        }
        if (clienteMapeado.ultimaActualizacion instanceof Timestamp) {
          clienteMapeado.ultimaActualizacion = clienteMapeado.ultimaActualizacion.toDate();
        }
        
        return clienteMapeado;
      });
      
      console.log(`✅ [ClientesWebService] MAPEO COMPLETADO:`, {
        totalProcesados: clientesMapeados.length,
        clientesConNombre: clientesMapeados.filter(c => c.nombre).length,
        clientesConEmail: clientesMapeados.filter(c => c.email).length
      });
      
      // ⭐ ORDENAR EN MEMORIA POR FECHA (más reciente primero)
      clientesMapeados.sort((a, b) => {
        const fechaA = a.fechaRegistro ? new Date(a.fechaRegistro).getTime() : 0;
        const fechaB = b.fechaRegistro ? new Date(b.fechaRegistro).getTime() : 0;
        return fechaB - fechaA; // Más reciente primero
      });
      
      console.log('📋 [ClientesWebService] CLIENTES ORDENADOS Y LISTOS');
      
      return clientesMapeados;
    }),
    catchError(error => {
      console.error('❌ [ClientesWebService] ERROR:', error);
      throw error;
    })
  );
}

  // Obtener vendedores activos
  getVendedores(): Observable<Vendedor[]> {
  console.log('👥 [ClientesWebService] Cargando todos los usuarios...');
  
  const vendedoresRef = collection(this.firestore, 'users');
  // ⭐ SIN FILTROS - TODOS LOS USUARIOS
  
  return collectionData(vendedoresRef, { idField: 'id' }).pipe(
    tap(usuarios => {
      console.log('📊 [ClientesWebService] Total usuarios encontrados:', usuarios.length);
    }),
    map((usuarios: any[]) => {
      const vendedores = usuarios.map(usuario => ({
        id: usuario.id,
        nombre: `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim() || 'Sin nombre',
        email: usuario.email || '',
        telefono: usuario.phone || '',
        clientesAsignados: 0,
        activo: true // Valor fijo ya que no importa
      }));
      
      console.log('✅ [ClientesWebService] Usuarios listos para asignar:', vendedores.length);
      
      return vendedores;
    })
  );
}

  async inicializarClientesParaAdmin(): Promise<void> {
  console.log('🔄 [ClientesWebService] Inicializando clientes para admin...');
  
  try {
    const clientesRef = collection(this.firestore, 'clientesweb');
    const q = query(clientesRef); // SIN orderBy
    
    const snapshot = await collectionData(q, { idField: 'id' }).pipe(take(1)).toPromise();
    
    console.log(`📊 [ClientesWebService] Documentos encontrados: ${snapshot?.length || 0}`);
    
    if (snapshot && snapshot.length > 0) {
      let clientesProcesados = 0;
      
      for (const cliente of snapshot) {
        const updateData: any = {};
        let needsUpdate = false;
        
        // Agregar campos faltantes
        if (!cliente['estado']) {
          updateData.estado = EstadoCliente.NUEVO;
          needsUpdate = true;
        }
        
        if (!cliente['origen']) {
          updateData.origen = 'Web';
          needsUpdate = true;
        }
        
        if (!cliente['fechaRegistro']) {
          updateData.fechaRegistro = Timestamp.now();
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          updateData.ultimaActualizacion = Timestamp.now();
          
          console.log(`📝 [ClientesWebService] Actualizando cliente ${cliente.id}`);
          await updateDoc(doc(this.firestore, 'clientesweb', cliente.id), updateData);
          clientesProcesados++;
        }
      }
      
      console.log(`✅ [ClientesWebService] Inicialización completada. ${clientesProcesados} clientes actualizados`);
    }
    
  } catch (error) {
    console.error('❌ [ClientesWebService] Error en inicialización:', error);
    throw error;
  }
}
  // Asignar vendedor a cliente
  async asignarVendedor(
    clienteId: string,
    vendedorId: string,
    nombreVendedor: string
  ): Promise<void> {
    const clienteDocRef = doc(this.firestore, 'clientesweb', clienteId);

    try {
      await updateDoc(clienteDocRef, {
        vendedorAsignado: vendedorId,
        nombreVendedor: nombreVendedor,
        estado: EstadoCliente.ASIGNADO,
        fechaAsignacion: Timestamp.now(),
        ultimaActualizacion: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error al asignar vendedor:', error);
      throw error;
    }
  }

  // Actualizar estado del cliente
  async actualizarEstado(
    clienteId: string,
    estado: EstadoCliente
  ): Promise<void> {
    const clienteDocRef = doc(this.firestore, 'clientesweb', clienteId);

    try {
      const updateData: any = {
        estado: estado,
        ultimaActualizacion: Timestamp.now(),
      };

      // Si el estado es CONTACTADO, actualizar últimoContacto
      if (estado === EstadoCliente.CONTACTADO) {
        updateData.ultimoContacto = Timestamp.now();
      }

      await updateDoc(clienteDocRef, updateData);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      throw error;
    }
  }

  // Agregar notas al cliente
  async agregarNotas(clienteId: string, notas: string): Promise<void> {
    const clienteDocRef = doc(this.firestore, 'clientesweb', clienteId);

    try {
      await updateDoc(clienteDocRef, {
        notas: notas,
        ultimaActualizacion: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error al agregar notas:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  getEstadisticas(): Observable<any> {
    return this.getClientesWeb().pipe(
      map((clientes) => {
        const total = clientes.length;
        const nuevos = clientes.filter(
          (c) => c.estado === EstadoCliente.NUEVO
        ).length;
        const asignados = clientes.filter(
          (c) => c.estado === EstadoCliente.ASIGNADO
        ).length;
        const contactados = clientes.filter(
          (c) => c.estado === EstadoCliente.CONTACTADO
        ).length;
        const enNegociacion = clientes.filter(
          (c) => c.estado === EstadoCliente.EN_NEGOCIACION
        ).length;
        const convertidos = clientes.filter(
          (c) => c.estado === EstadoCliente.CAPTADO
        ).length;
        const descartados = clientes.filter(
          (c) => c.estado === EstadoCliente.DESCARTADO
        ).length;

        return {
          total,
          nuevos,
          asignados,
          contactados,
          enNegociacion,
          convertidos,
          descartados,
          porcentajeConversion:
            total > 0 ? Math.round((convertidos / total) * 100) : 0,
          porcentajeAsignacion:
            total > 0
              ? Math.round(
                  ((asignados + contactados + enNegociacion + convertidos) /
                    total) *
                    100
                )
              : 0,
        };
      })
    );
  }

  // Obtener clientes por vendedor
  getClientesPorVendedor(vendedorId: string): Observable<ClienteWeb[]> {
    const clientesRef = collection(this.firestore, 'clientesweb');
    const q = query(
      clientesRef,
      where('vendedorAsignado', '==', vendedorId),
      orderBy('fechaAsignacion', 'desc')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map((clientes: any[]) =>
        clientes.map((cliente) => ({
          ...cliente,
          id: cliente.id,
          fechaRegistro:
            cliente.fechaRegistro instanceof Timestamp
              ? cliente.fechaRegistro.toDate()
              : cliente.fechaRegistro,
          ultimoContacto:
            cliente.ultimoContacto instanceof Timestamp
              ? cliente.ultimoContacto.toDate()
              : cliente.ultimoContacto,
          fechaAsignacion:
            cliente.fechaAsignacion instanceof Timestamp
              ? cliente.fechaAsignacion.toDate()
              : cliente.fechaAsignacion,
        }))
      )
    );
  }

  // Obtener clientes sin asignar
  getClientesSinAsignar(): Observable<ClienteWeb[]> {
    const clientesRef = collection(this.firestore, 'clientesweb');
    const q = query(
      clientesRef,
      where('estado', '==', EstadoCliente.NUEVO),
      orderBy('fechaRegistro', 'desc')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map((clientes: any[]) =>
        clientes.map((cliente) => ({
          ...cliente,
          id: cliente.id,
          fechaRegistro:
            cliente.fechaRegistro instanceof Timestamp
              ? cliente.fechaRegistro.toDate()
              : cliente.fechaRegistro,
        }))
      )
    );
  }

  // Marcar cliente como contactado
  async marcarComoContactado(clienteId: string): Promise<void> {
  const clienteDocRef = doc(this.firestore, 'clientesweb', clienteId);
  
  try {
    const updateData = {
      estado: EstadoCliente.CONTACTADO,
      ultimoContacto: Timestamp.now(),
      ultimaActualizacion: Timestamp.now()
    };

    console.log('📞 [ClientesWebService] Marcando cliente como contactado:', {
      clienteId,
      updateData
    });

    await updateDoc(clienteDocRef, updateData);
    console.log('✅ [ClientesWebService] Cliente marcado como contactado exitosamente');
  } catch (error) {
    console.error('❌ [ClientesWebService] Error al marcar como contactado:', error);
    throw error;
  }
}

  // Actualizar información del cliente
  async actualizarCliente(
    clienteId: string,
    datos: Partial<ClienteWeb>
  ): Promise<void> {
    const clienteDocRef = doc(this.firestore, 'clientesweb', clienteId);

    try {
      const updateData = {
        ...datos,
        ultimaActualizacion: Timestamp.now(),
      };

      await updateDoc(clienteDocRef, updateData);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  // Obtener cliente por ID
  getClientePorId(clienteId: string): Observable<ClienteWeb | undefined> {
    const clienteDocRef = doc(this.firestore, 'clientesweb', clienteId);

    return collectionData(
      query(
        collection(this.firestore, 'clientesweb'),
        where('__name__', '==', clienteId)
      ),
      { idField: 'id' }
    ).pipe(
      map((clientes: any[]) => {
        if (clientes.length > 0) {
          const cliente = clientes[0];
          return {
            ...cliente,
            id: cliente.id,
            fechaRegistro:
              cliente.fechaRegistro instanceof Timestamp
                ? cliente.fechaRegistro.toDate()
                : cliente.fechaRegistro,
            ultimoContacto:
              cliente.ultimoContacto instanceof Timestamp
                ? cliente.ultimoContacto.toDate()
                : cliente.ultimoContacto,
            fechaAsignacion:
              cliente.fechaAsignacion instanceof Timestamp
                ? cliente.fechaAsignacion.toDate()
                : cliente.fechaAsignacion,
          };
        }
        return undefined;
      })
    );
  }

  // Incrementar contador de clientes asignados del vendedor
  async incrementarClientesVendedor(vendedorId: string): Promise<void> {
    const vendedorDocRef = doc(this.firestore, 'vendedores', vendedorId);

    try {
      // Obtener el vendedor actual para incrementar el contador
      const vendedoresRef = collection(this.firestore, 'vendedores');
      const q = query(vendedoresRef, where('__name__', '==', vendedorId));

      collectionData(q, { idField: 'id' })
        .pipe(
          map((vendedores: any[]) => {
            if (vendedores.length > 0) {
              const vendedor = vendedores[0];
              const nuevoConteo = (vendedor.clientesAsignados || 0) + 1;

              updateDoc(vendedorDocRef, {
                clientesAsignados: nuevoConteo,
                ultimaActualizacion: Timestamp.now(),
              });
            }
          })
        )
        .subscribe();
    } catch (error) {
      console.error('Error al incrementar contador de vendedor:', error);
    }
  }

  // Decrementar contador de clientes asignados del vendedor
  async decrementarClientesVendedor(vendedorId: string): Promise<void> {
    const vendedorDocRef = doc(this.firestore, 'vendedores', vendedorId);

    try {
      const vendedoresRef = collection(this.firestore, 'vendedores');
      const q = query(vendedoresRef, where('__name__', '==', vendedorId));

      collectionData(q, { idField: 'id' })
        .pipe(
          map((vendedores: any[]) => {
            if (vendedores.length > 0) {
              const vendedor = vendedores[0];
              const nuevoConteo = Math.max(
                (vendedor.clientesAsignados || 0) - 1,
                0
              );

              updateDoc(vendedorDocRef, {
                clientesAsignados: nuevoConteo,
                ultimaActualizacion: Timestamp.now(),
              });
            }
          })
        )
        .subscribe();
    } catch (error) {
      console.error('Error al decrementar contador de vendedor:', error);
    }
  }

  async verificarConexionFirebase(): Promise<void> {
  try {
    console.log('🔍 [ClientesWebService] Verificando conexión a Firebase...');
    
    const clientesRef = collection(this.firestore, 'clientesweb');
    const snapshot = await collectionData(clientesRef, { idField: 'id' }).pipe(take(1)).toPromise();
    
    console.log('✅ [ClientesWebService] Conexión exitosa. Documentos encontrados:', snapshot?.length || 0);
    
    if (snapshot && snapshot.length > 0) {
      console.log('📄 [ClientesWebService] Primer documento para análisis:', snapshot[0]);
    }
    
  } catch (error) {
    console.error('❌ [ClientesWebService] Error de conexión:', error);
    throw error;
  }
}


async agregarFechaRegistroATodos(): Promise<void> {
  console.log('🔄 [ClientesWebService] Agregando fechaRegistro a todos los documentos...');
  
  try {
    const clientesRef = collection(this.firestore, 'clientesweb');
    const q = query(clientesRef);
    
    const snapshot = await collectionData(q, { idField: 'id' }).pipe(take(1)).toPromise();
    
    if (snapshot && snapshot.length > 0) {
      console.log(`📊 [ClientesWebService] Procesando ${snapshot.length} documentos...`);
      
      for (const cliente of snapshot) {
        if (!cliente['fechaRegistro']) {
          console.log(`📅 [ClientesWebService] Agregando fechaRegistro a ${cliente.id}`);
          
          const updateData = {
            fechaRegistro: Timestamp.now(),
            estado: cliente['estado'] || EstadoCliente.NUEVO,
            origen: cliente['origen'] || 'Web',
            ultimaActualizacion: Timestamp.now()
          };
          
          await updateDoc(doc(this.firestore, 'clientesweb', cliente.id), updateData);
        } else {
          console.log(`✅ [ClientesWebService] Cliente ${cliente.id} ya tiene fechaRegistro`);
        }
      }
      
      console.log('🎉 [ClientesWebService] Proceso completado');
    }
    
  } catch (error) {
    console.error('❌ [ClientesWebService] Error:', error);
    throw error;
  }
}

getClientesWebConOrden(): Observable<ClienteWeb[]> {
  console.log('🔄 [ClientesWebService] Cargando clientes CON orden...');
  
  const clientesRef = collection(this.firestore, 'clientesweb');
  const q = query(clientesRef, orderBy('fechaRegistro', 'desc'));
  
  return collectionData(q, { idField: 'id' }).pipe(
    map((clientesRaw: any[]) => 
      clientesRaw.map(clienteRaw => ClienteMapper.mapFirebaseToClienteWeb(clienteRaw))
    )
  );
}

}
