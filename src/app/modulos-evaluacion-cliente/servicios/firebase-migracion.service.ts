import { inject, Injectable } from '@angular/core';
import {
  doc,
  Firestore,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Expediente } from '../../modelos/expediente';
import { FormularioFirebase } from '../componentes/tabla-de-solicitudes/tabla-de-solicitudes.component';
import { Solicitud } from '../../modelos/solicitud';
import { Persona } from '../../modelos/persona';
import { DatosPersonales } from '../../modelos/datos-personales';
import { Documento } from '../../modelos/documento';
import { Referencia } from '../../modelos/referencia';
import { DatosFinancieros } from '../../modelos/datos-financieros';
import { Vehiculo } from '../../modelos/vehiculo';

@Injectable({
  providedIn: 'root',
})
export class FirebaseMigracionService {
  private firestore = inject(Firestore);

  constructor() {}

  // =======================================
  // OBTEIEN EL CLIETEN DE LA BASE DE DATOS

  async getById(
    collectionName: string,
    id: string
  ): Promise<FormularioFirebase | null> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${id}`);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as FormularioFirebase;
      } else {
        console.warn(
          `[FirebaseService] Documento ${id} no encontrado en ${collectionName}`
        );
        return null;
      }
    } catch (err) {
      console.error(
        `[FirebaseService] Error en getById(${collectionName}, ${id}):`,
        err
      );
      return null;
    }
  }

  async guardarTablasEnFirebase(
    solicitud: Solicitud,
    collectionName: string
  ): Promise<boolean> {
    try {
      // Usamos el id generado por ti como ID del documento
      const ref = doc(this.firestore, `${collectionName}/${solicitud.id}`);

      await setDoc(ref, {
        ...solicitud,
        // Aseguramos que el campo id también quede dentro del documento
        id: solicitud.id,
        create_at: serverTimestamp(),
        update_at: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error(
        `[FirebaseService] Error en guardarTablasEnFirebase(${collectionName}):`,
        error
      );
      return false;
    }
  }

  //crear tavla s de personas

  async crearPersonaEnnfirebase(
    colletionName: string,
    persona: Persona
  ): Promise<boolean> {
    try {
      const ref = doc(this.firestore, `${colletionName}/${persona.id}`);
      await setDoc(ref, {
        ...persona,
        id: persona.id,
        create_at: serverTimestamp(),
        update_at: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error(
        `[FirebaseService] Error en crearPersonaEnnfirebase():`,
        error
      );
      return false;
    }
  }

  async actualizarCampoDeLaSolicitud(
    id_Solicitud: string,
    collectionName: string,
    campo: string,
    valor: string
  ): Promise<boolean> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${id_Solicitud}`);
      await updateDoc(ref, {
        [campo]: valor,
      });
      console.log(
        `[FirebaseService] Campo '${campo}' actualizado correctamente en documento ${id_Solicitud} de ${collectionName}`
      );
      return true;
    } catch (error) {
      console.error(
        `[FirebaseService] Error en actualizarCampoDeLaSolicitud():`,
        error
      );
      return false;
    }
  }

  //===================================crear documento titular ======================================
  async crearDatosPersonalesTitular(
    collectionName: string,
    documento: DatosPersonales
  ): Promise<boolean> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${documento.id}`);
      await setDoc(ref, {
        ...documento,
        id: documento.id,
        create_at: serverTimestamp(),
        update_at: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error(
        `[FirebaseService] Error en crearDocumentoTitular():`,
        error
      );
      return false;
    }
  }

  async actualizarDatosPersonalesTitular(
    idPersona: string,
    collectionName: string,
    campo: string,
    valor: string
  ): Promise<void> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${idPersona}`);
      await updateDoc(ref, {
        [campo]: valor,
      });
      console.log('exito');
    } catch (error) {}
  }

  async crearDocumentoEnDB(collectionName: string, documento: Documento) {
    try {
      const ref = doc(this.firestore, `${collectionName}/${documento.id}`);
      await setDoc(ref, {
        ...documento,
        id: documento.id,
        create_at: serverTimestamp(),
        update_at: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error(`[FirebaseService] Error en crearDocumentoEnDB():`, error);
      return false;
    }
  }

  async actualizarDocumentoEnDB(
    id_persona: string,
    collectionName: string,
    campo: string,
    valor: string
  ): Promise<void> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${id_persona}`);
      updateDoc(ref, {
        [campo]: valor,
      });
      console.log('exito');
    } catch (error) {}
  }

  async actualizarArrayDeDocumentosEnDB(
    id_persona: string,
    collectionName: string,
    campo: string,
    valor: string[] // 👈 cambia aquí
  ): Promise<void> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${id_persona}`);
      await updateDoc(ref, {
        [campo]: valor, // ahora puede ser string[]
      });
      console.log('✅ Documentos actualizados con éxito');
    } catch (error) {
      console.error('❌ Error al actualizar documentos:', error);
    }
  }

  async crearReferenciaEnDB(collectionName: string, documento: Referencia) {
    try {
      const ref = doc(this.firestore, `${collectionName}/${documento.id}`);
      await setDoc(ref, {
        ...documento,
        id: documento.id,
        create_at: serverTimestamp(),
        update_at: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error(`[FirebaseService] Error en crearDocumentoEnDB():`, error);
      return false;
    }
  }

  async actualizarArrayDeReferenciasEnDB(
    id_persona: string,
    collectionName: string,
    campo: string,
    valor: string[] // 👈 cambia aquí
  ): Promise<void> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${id_persona}`);
      await updateDoc(ref, {
        [campo]: valor, // ahora puede ser string[]
      });
      console.log('✅ Documentos actualizados con éxito');
    } catch (error) {
      console.error('❌ Error al actualizar documentos:', error);
    }
  }

  //====================================================
  //========== datos finacieros ========================
  //====================================================

  async crearDatosFinancieros(
    collectionName: string,
    documento: DatosFinancieros
  ): Promise<boolean> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${documento.id}`);
      await setDoc(ref, {
        ...documento,
        id: documento.id,
        create_at: serverTimestamp(),
        update_at: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error(
        `[FirebaseService] Error en crrear datos finacieros`,
        error
      );
      return false;
    }
  }

  async actualizarDatosFinancieros(
    id_persona: string,
    collectionName: string,
    campo: string,
    valor: string
  ): Promise<void> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${id_persona}`);
      await updateDoc(ref, {
        [campo]: valor, // ahora puede ser string[]
      });
      console.log('✅ Documentos actualizados con éxito');
    } catch (error) {
      console.error('❌ Error al actualizar documentos:', error);
    }
  }

  //================================================================
  //vehiculo
  //=================================================================
  async crearVehiculo(
    collectionName: string,
    documento: Vehiculo
  ): Promise<boolean> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${documento.id}`);
      await setDoc(ref, {
        ...documento,
        id: documento.id,
        create_at: serverTimestamp(),
        update_at: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error(
        `[FirebaseService] Error en crrear datos finacieros`,
        error
      );
      return false;
    }
  }

  async actualizarVehiculoEnsolcitud(
    id_persona: string,
    collectionName: string,
    campo: string,
    valor: string
  ): Promise<void> {
    try {
      const ref = doc(this.firestore, `${collectionName}/${id_persona}`);
      await updateDoc(ref, {
        [campo]: valor, // ahora puede ser string[]
      });
      console.log('✅ Documentos actualizados con éxito');
    } catch (error) {
      console.error('❌ Error al actualizar documentos:', error);
    }
  }
}
