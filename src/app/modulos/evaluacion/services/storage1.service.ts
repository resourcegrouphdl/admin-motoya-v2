import { Injectable } from '@angular/core';
import { TipoDocumento } from '../../admin-clientes/modelos/modelos-solicitudes';
import { deleteObject, getDownloadURL, ref, uploadBytes, Storage } from '@angular/fire/storage';


export interface SubidaDocumento {
  archivo: File;
  clienteId: string;
  tipoDocumento: TipoDocumento;
  solicitudId?: string;
}

export interface ResultadoSubida {
  url: string;
  ruta: string;
  tamaño: number;
  tipo: string;
  fechaSubida: Date;
}

@Injectable({
  providedIn: 'root'
})
export class Storage1Service {

  constructor(private storage: Storage) {}

  /**
   * Sube un documento a Firebase Storage
   */
  async subirDocumento(datos: SubidaDocumento): Promise<ResultadoSubida> {
    console.log('📤 Subiendo documento:', {
      tipo: datos.tipoDocumento,
      cliente: datos.clienteId,
      archivo: datos.archivo.name,
      tamaño: this.formatearTamaño(datos.archivo.size)
    });

    try {
      // Generar ruta del archivo
      const ruta = this.generarRutaArchivo(datos);
      console.log('📁 Ruta generada:', ruta);

      // Crear referencia en Storage
      const storageRef = ref(this.storage, ruta);

      // Subir archivo
      const snapshot = await uploadBytes(storageRef, datos.archivo);
      console.log('✅ Archivo subido exitosamente');

      // Obtener URL de descarga
      const url = await getDownloadURL(snapshot.ref);
      console.log('🔗 URL obtenida:', url);

      const resultado: ResultadoSubida = {
        url,
        ruta,
        tamaño: datos.archivo.size,
        tipo: datos.archivo.type,
        fechaSubida: new Date()
      };

      console.log('📄 Documento subido completamente:', resultado);
      return resultado;

    } catch (error) {
      console.error('❌ Error subiendo documento:', error);
      throw new Error(`Error al subir documento: ${error}`);
    }
  }

  /**
   * Elimina un documento de Firebase Storage
   */
  async eliminarDocumento(ruta: string): Promise<void> {
    console.log('🗑️ Eliminando documento:', ruta);

    try {
      const storageRef = ref(this.storage, ruta);
      await deleteObject(storageRef);
      console.log('✅ Documento eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando documento:', error);
      throw new Error(`Error al eliminar documento: ${error}`);
    }
  }

  /**
   * Actualiza un documento (elimina el anterior y sube el nuevo)
   */
  async actualizarDocumento(
    datos: SubidaDocumento, 
    rutaAnterior?: string
  ): Promise<ResultadoSubida> {
    console.log('🔄 Actualizando documento:', datos.tipoDocumento);

    try {
      // Subir nuevo documento
      const resultado = await this.subirDocumento(datos);

      // Eliminar documento anterior si existe
      if (rutaAnterior) {
        try {
          await this.eliminarDocumento(rutaAnterior);
          console.log('🗑️ Documento anterior eliminado');
        } catch (error) {
          console.warn('⚠️ No se pudo eliminar documento anterior:', error);
          // No fallar la operación si no se puede eliminar el anterior
        }
      }

      return resultado;

    } catch (error) {
      console.error('❌ Error actualizando documento:', error);
      throw error;
    }
  }

  /**
   * Genera la ruta donde se almacenará el archivo
   */
  private generarRutaArchivo(datos: SubidaDocumento): string {
    const timestamp = new Date().getTime();
    const extension = this.obtenerExtension(datos.archivo.name);
    
    // Estructura: documentos/{clienteId}/{tipoDocumento}/{timestamp}.{extension}
    return `documentos/${datos.clienteId}/${datos.tipoDocumento}/${timestamp}.${extension}`;
  }

  /**
   * Obtiene la extensión del archivo
   */
  private obtenerExtension(nombreArchivo: string): string {
    const partes = nombreArchivo.split('.');
    return partes[partes.length - 1].toLowerCase();
  }

  /**
   * Formatea el tamaño del archivo para mostrar
   */
  private formatearTamaño(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Valida si el archivo es válido para subir
   */
  validarArchivo(archivo: File): { valido: boolean; error?: string } {
    // Validar tipo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!tiposPermitidos.includes(archivo.type)) {
      return {
        valido: false,
        error: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG) o PDF.'
      };
    }

    // Validar tamaño (5MB máximo)
    const tamañoMaximo = 5 * 1024 * 1024; // 5MB
    if (archivo.size > tamañoMaximo) {
      return {
        valido: false,
        error: 'El archivo no debe superar los 5MB.'
      };
    }

    // Validar nombre
    if (archivo.name.length > 100) {
      return {
        valido: false,
        error: 'El nombre del archivo es demasiado largo.'
      };
    }

    return { valido: true };
  }

  /**
   * Obtiene información de un archivo por su URL
   */
  async obtenerInfoArchivo(url: string): Promise<{ existe: boolean; tamaño?: number }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return {
        existe: response.ok,
        tamaño: response.headers.get('content-length') ? 
          parseInt(response.headers.get('content-length')!) : undefined
      };
    } catch (error) {
      console.error('❌ Error obteniendo info del archivo:', error);
      return { existe: false };
    }
  }
}
