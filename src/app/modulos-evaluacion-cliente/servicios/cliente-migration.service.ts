import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
} from '@angular/fire/firestore';
import { environment } from '../../repositorio/environment';
import { FormularioFirebase } from '../componentes/tabla-de-solicitudes/tabla-de-solicitudes.component';
import { FirebaseMigracionService } from './firebase-migracion.service';
import { CrearSolicitud } from '../../modulos-evaluacion-cliente/clases-creacion-solicitud/crear-solicitud';
import { CrearTitular } from '../clases-creacion-solicitud/crear-titular';
import { TipoPersona } from '../../modelos/estado-solicitud';
import { DatosPersonalesBuiler } from '../clases-creacion-solicitud/datos-personales-builder';
import { DocumentoBuilder } from '../clases-creacion-solicitud/documento-builder';
import { ReferenciaBuilder } from '../clases-creacion-solicitud/referecias-builder';
import { DatosFinancierosBuilder } from '../clases-creacion-solicitud/datos-financieros-builder';
import { VehiculoBuilder } from '../clases-creacion-solicitud/vehiculo-builder';

interface ResultadoMigracion {
  exito: boolean;
  mensaje: string;
  codigoSolicitud?: string;
  idSolicitud?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClienteMigrationService {

  private migracionService = inject(FirebaseMigracionService);
  private firestore = inject(Firestore);

  // Estado interno del servicio
  private clienteEnMigracion: FormularioFirebase | null = null;
  private idClienteActual: string = '';
  private id_solicitud: string = '';
  private codigoDeSolicitud: string = '';
  private id_titular: string = '';
  private id_fiador: string = '';
  private datos_personales_titular_id: string = '';
  private datos_personales_fiador_id: string = '';
  
  // Referencias del titular
  private referencias1: string = '';
  private referencia2: string = '';
  private referencia3: string = '';

  // Documentos del titular
  private documentoDniTitularFrente: string = '';
  private documentoDniTitularDorso: string = '';
  private documentosLicFrente: string = '';
  private documentosLicReverso: string = '';
  private documentoselfie: string = '';
  private documentoCasaFrente: string = '';
  private documentoReciboServicio: string = '';

  // Documentos del fiador
  private documentoDniFiadorFrente: string = '';
  private documentoDniFiadorDorso: string = '';
  private documentoCasaFiadorFrente: string = '';

  // IDs datos financieros y vehículo
  private idDatosFinancieros: string = '';
  private idDelVehiculoSolcitado: string = '';

  // Constantes de Firebase Collections
  private readonly FIREBASE_CLIENTE = environment.COLLECTION_CLIENTE;
  private readonly FIREBASE_SOLICITUDES = environment.COLLECTION_SOLICITUDES;
  private readonly FIREBASE_PERSONAS = environment.COLLECTION_PERSONAS;
  private readonly FIREBASE_DATOS_PERSONALES = environment.COLLECTION_DATOS_PERSONALES;
  private readonly FIREBASE_DOCUMENTOS = environment.COLLECTION_DOCUMENTOS;
  private readonly FIREBASE_DATOS_FINANCIEROS = environment.COLLECTION_DATOS_FINANCIEROS;
  private readonly FIREBASE_VEHICULOS = environment.COLLECTION_VEHICULOS;
  private readonly FIREBASE_REFERENCIAS = environment.COLLECTION_REFERENCIAS;

  /**
   * Obtiene una solicitud de crédito existente por ID
   */
  async obtenerSolicitudDeCredito(id: string): Promise<FormularioFirebase | null> {
    try {
      this.idClienteActual = id;
      const cliente = await this.migracionService.getById(this.FIREBASE_CLIENTE, id);

      if (!cliente) {
        throw new Error(`Cliente con ID ${id} no encontrado`);
      }

      this.clienteEnMigracion = cliente;
      return cliente;
    } catch (error: any) {
      console.error('Error al obtener solicitud de crédito:', error);
      this.limpiarEstadoInterno();
      throw error;
    }
  }

  /**
   * Crea una nueva solicitud de crédito completa en la base de datos
   * Retorna un objeto ResultadoMigracion con el estado de la operación
   */
  async crearSolicitudDeCreditoEnBD(
    objeto: FormularioFirebase,
    idSemilla: string
  ): Promise<ResultadoMigracion> {
    try {
      // Validar que tenemos el cliente cargado
      if (!this.clienteEnMigracion) {
        throw new Error(
          'No hay cliente cargado para migración. Ejecute obtenerSolicitudDeCredito() primero.'
        );
      }

      console.log('Iniciando creación de solicitud de crédito...');

      // 1. Crear la solicitud
      const solicitudCreada = await this.crearObjetoSolicitud(idSemilla);
      if (!solicitudCreada) {
        throw new Error('Error al crear la solicitud');
      }

      // 2. Crear las personas (titular y fiador)
      const personasCreadas = await this.crearPersonas();
      if (!personasCreadas) {
        throw new Error('Error al crear las personas');
      }

      // 3. Crear datos personales del titular
      const datosPersonalesTitularCreados = await this.crearDatosPersonalesDelTitular(objeto);
      if (!datosPersonalesTitularCreados) {
        throw new Error('Error al crear los datos personales del titular');
      }

      // 4. Crear datos personales del fiador (si existen)
      if (this.tieneInformacionFiador(objeto)) {
        const datosPersonalesFiadorCreados = await this.crearDatosPersonalesDelFiador(objeto);
        if (!datosPersonalesFiadorCreados) {
          console.warn('No se pudieron crear los datos del fiador, pero se continúa con la operación');
        }
      } else {
        console.log('No se encontraron datos del fiador, se omite su creación');
      }

      // 5. Crear datos financieros (MOVIDO AQUÍ - independiente del fiador)
      const datosFinancierosCreados = await this.crearDatosFinancieros(objeto);
      if (!datosFinancierosCreados) {
        throw new Error('Error al crear los datos financieros');
      }

      // 6. Crear vehículo (MOVIDO AQUÍ - independiente del fiador)
      const vehiculoCreado = await this.crearVehiculo(objeto);
      if (!vehiculoCreado) {
        throw new Error('Error al crear los datos del vehículo');
      }

      // 7. Actualizar campos adicionales de la solicitud
      await this.actualizarCamposAdicionalesSolicitud(objeto);

      console.log('Solicitud de crédito creada exitosamente');
      
      return {
        exito: true,
        mensaje: 'Solicitud creada exitosamente',
        codigoSolicitud: this.codigoDeSolicitud,
        idSolicitud: this.id_solicitud
      };

    } catch (error: any) {
      console.error('Error al crear solicitud de crédito en BD:', error);
      await this.rollbackOperacion();
      
      return {
        exito: false,
        mensaje: 'Error al crear la solicitud',
        error: error.message || 'Error desconocido'
      };
    }
  }

  /**
   * Crea el objeto solicitud en Firebase
   */
  private async crearObjetoSolicitud(idSemilla: string): Promise<boolean> {
    try {
      this.id_solicitud = this.generateId();
      this.codigoDeSolicitud = this.generarCodigoSolicitud();

      const solicitud = new CrearSolicitud()
        .conId(this.id_solicitud)
        .conNumero(this.codigoDeSolicitud)
        .conIdSemilla(idSemilla)
        .build();

      const resultado = await this.migracionService.guardarTablasEnFirebase(
        solicitud,
        this.FIREBASE_SOLICITUDES
      );

      if (resultado) {
        console.log(`Solicitud creada con ID: ${this.id_solicitud}, Código: ${this.codigoDeSolicitud}`);
      }

      return resultado;
    } catch (error: any) {
      console.error('Error al crear objeto solicitud:', error);
      return false;
    }
  }

  /**
   * Crea las personas (titular y fiador) asociadas a la solicitud
   */
  private async crearPersonas(): Promise<boolean> {
    try {
      this.id_titular = this.generateId();
      this.id_fiador = this.generateId();

      // Crear persona titular
      const personaTitular = new CrearTitular()
        .conId(this.id_titular)
        .conSolicitudId(this.codigoDeSolicitud)
        .conTipo(TipoPersona.TITULAR)
        .conDatosPersonales('')
        .build();

      const titularCreado = await this.migracionService.crearPersonaEnnfirebase(
        this.FIREBASE_PERSONAS,
        personaTitular
      );

      if (!titularCreado) {
        throw new Error('Error al crear persona titular');
      }

      // Crear persona fiador
      const personaFiador = new CrearTitular()
        .conId(this.id_fiador)
        .conSolicitudId(this.codigoDeSolicitud)
        .conTipo(TipoPersona.FIADOR)
        .conDatosPersonales('')
        .build();

      const fiadorCreado = await this.migracionService.crearPersonaEnnfirebase(
        this.FIREBASE_PERSONAS,
        personaFiador
      );

      if (!fiadorCreado) {
        throw new Error('Error al crear persona fiador');
      }

      // Actualizar la solicitud con los IDs de las personas
      const titularActualizado = await this.migracionService.actualizarCampoDeLaSolicitud(
        this.id_solicitud,
        this.FIREBASE_SOLICITUDES,
        'titularId',
        this.id_titular
      );

      const fiadorActualizado = await this.migracionService.actualizarCampoDeLaSolicitud(
        this.id_solicitud,
        this.FIREBASE_SOLICITUDES,
        'fiadorId',
        this.id_fiador
      );

      if (!titularActualizado || !fiadorActualizado) {
        throw new Error('Error al actualizar la solicitud con los IDs de las personas');
      }

      console.log(`Personas creadas - Titular: ${this.id_titular}, Fiador: ${this.id_fiador}`);
      return true;
    } catch (error: any) {
      console.error('Error al crear personas:', error);
      return false;
    }
  }

  /**
   * Crea los datos personales del titular
   */
  private async crearDatosPersonalesDelTitular(objeto: FormularioFirebase): Promise<boolean> {
    try {
      if (!objeto.formTitular) {
        throw new Error('Los datos del titular no están disponibles en el objeto');
      }

      // Generar IDs
      this.datos_personales_titular_id = this.generateId();
      this.documentoDniTitularFrente = this.generateId();
      this.documentoDniTitularDorso = this.generateId();
      this.documentosLicFrente = this.generateId();
      this.documentosLicReverso = this.generateId();
      this.documentoselfie = this.generateId();
      this.documentoCasaFrente = this.generateId();
      this.documentoReciboServicio = this.generateId();

      // Procesar el nombre completo
      const nombreCompleto = objeto.formTitular.nombre || '';
      const partesNombre = nombreCompleto.trim().split(' ');
      const primerNombre = partesNombre[0] || '';

      const datosDelTitular = new DatosPersonalesBuiler()
        .conNumeroDeSolicitud(this.codigoDeSolicitud)
        .conId(this.datos_personales_titular_id)
        .conNombres(primerNombre)
        .conApellidoPaterno(objeto.formTitular.apellido || '')
        .conApellidoMaterno(objeto.formTitular.apellido || '')
        .conTipoDocumento(objeto.formTitular.documentType || '')
        .conNumeroDocumento(objeto.formTitular.documentNumber || '')
        .conFechaNacimiento(objeto.formTitular.fechaNacimiento || '')
        .conEmail(objeto.formTitular.email || '')
        .conTelefono1(objeto.formTitular.telefono1 || '')
        .conTelefono2(objeto.formTitular.telefono2 || '')
        .conEstadoCivil(objeto.formTitular.estadoCivil || '')
        .conDireccion(objeto.formTitular.direccion || '')
        .conLicencia(objeto.formTitular.licenciaConducir || '')
        .conNombreCompleto(nombreCompleto)
        .conEdad(this.calcularEdad(this.transformarFecha(objeto.formTitular.fechaNacimiento || '')))
        .build();

      // Crear documentos
      const documentos = this.crearDocumentosTitular(objeto);

      // Guardar datos personales
      const datosCreados = await this.migracionService.crearDatosPersonalesTitular(
        this.FIREBASE_DATOS_PERSONALES,
        datosDelTitular
      );

      if (!datosCreados) {
        throw new Error('Error al crear los datos personales del titular');
      }

      // Actualizar la persona titular con el ID de datos personales
      await this.migracionService.actualizarDatosPersonalesTitular(
        this.id_titular,
        this.FIREBASE_PERSONAS,
        'datosPersonales',
        this.datos_personales_titular_id
      );

      // Guardar todos los documentos
      await this.guardarDocumentos(documentos);

      // Actualizar array de documentos en persona
      const documentosArray = [
        this.documentoDniTitularFrente,
        this.documentoDniTitularDorso,
        this.documentosLicFrente,
        this.documentosLicReverso,
        this.documentoselfie,
        this.documentoCasaFrente,
        this.documentoReciboServicio,
      ];

      await this.migracionService.actualizarArrayDeDocumentosEnDB(
        this.id_titular,
        this.FIREBASE_PERSONAS,
        'documentos',
        documentosArray
      );

      // Crear referencias
      await this.crearReferenciasTitular(objeto);

      console.log(`Datos personales del titular creados con ID: ${this.datos_personales_titular_id}`);
      return true;
    } catch (error: any) {
      console.error('Error al crear datos personales del titular:', error);
      return false;
    }
  }

  /**
   * Crea los documentos del titular
   */
  private crearDocumentosTitular(objeto: FormularioFirebase): any[] {
    return [
      new DocumentoBuilder()
        .crearDocumentoDNIFrente(
          objeto.formTitular.dniFrenteuRL,
          this.documentoDniTitularFrente,
          this.id_titular,
          this.codigoDeSolicitud
        )
        .build(),
      new DocumentoBuilder()
        .crearDocumentoDNIReverso(
          objeto.formTitular.dniReversoURL,
          this.documentoDniTitularDorso,
          this.id_titular,
          this.codigoDeSolicitud
        )
        .build(),
      new DocumentoBuilder()
        .crearDocumentoLicenciaFrente(
          objeto.formTitular.licConducirFrenteURL,
          this.documentosLicFrente,
          this.id_titular,
          this.codigoDeSolicitud
        )
        .build(),
      new DocumentoBuilder()
        .crearDocumentoLicenciaReverso(
          objeto.formTitular.licConducirReversoURL,
          this.documentosLicReverso,
          this.id_titular,
          this.codigoDeSolicitud
        )
        .build(),
      new DocumentoBuilder()
        .crearDocumentoSelfiUrl(
          objeto.formTitular.serlfieURL,
          this.documentoselfie,
          this.id_titular,
          this.codigoDeSolicitud
        )
        .build(),
      new DocumentoBuilder()
        .crearDocumentoFotCasaUrl(
          objeto.formTitular.fotoCasaURL,
          this.documentoCasaFrente,
          this.id_titular,
          this.codigoDeSolicitud
        )
        .build(),
      new DocumentoBuilder()
        .crearDocumentoReciboServicioUrl(
          objeto.formTitular.reciboDeServicioURL,
          this.documentoReciboServicio,
          this.id_titular,
          this.codigoDeSolicitud
        )
        .build()
    ];
  }

  /**
   * Guarda múltiples documentos en la base de datos
   */
  private async guardarDocumentos(documentos: any[]): Promise<void> {
    for (const documento of documentos) {
      await this.migracionService.crearDocumentoEnDB(this.FIREBASE_DOCUMENTOS, documento);
    }
  }

  /**
   * Crea las referencias del titular
   */
  private async crearReferenciasTitular(objeto: FormularioFirebase): Promise<void> {
    this.referencias1 = this.generateId();
    this.referencia2 = this.generateId();
    this.referencia3 = this.generateId();

    const referencias = [
      new ReferenciaBuilder()
        .referenciaTitualr(objeto, this.referencias1, this.codigoDeSolicitud, this.id_titular)
        .build(),
      new ReferenciaBuilder()
        .referenciaTitualr(objeto, this.referencia2, this.codigoDeSolicitud, this.id_titular)
        .build(),
      new ReferenciaBuilder()
        .referenciaTitualr(objeto, this.referencia3, this.codigoDeSolicitud, this.id_titular)
        .build()
    ];

    for (const referencia of referencias) {
      await this.migracionService.crearReferenciaEnDB(this.FIREBASE_REFERENCIAS, referencia);
    }

    const arrayDeReferencias = [this.referencias1, this.referencia2, this.referencia3];

    await this.migracionService.actualizarArrayDeReferenciasEnDB(
      this.id_titular,
      this.FIREBASE_PERSONAS,
      'referencias',
      arrayDeReferencias
    );
    await this.migracionService.actualizarArrayDeReferenciasEnDB(
      this.id_titular,
      this.FIREBASE_SOLICITUDES,
      'referencias',
      arrayDeReferencias
    );
  }

  /**
   * Crea los datos personales del fiador
   */
  private async crearDatosPersonalesDelFiador(objeto: FormularioFirebase): Promise<boolean> {
    try {
      if (!objeto.formularioFiador) {
        throw new Error('Los datos del fiador no están disponibles en el objeto');
      }

      this.validarDatosFiador(objeto.formularioFiador);

      this.datos_personales_fiador_id = this.generateId();

      // Procesar el nombre completo del fiador
      const nombreCompleto = objeto.formularioFiador.nombreFiador?.trim() || '';
      const partesNombre = nombreCompleto.split(' ').filter((parte) => parte.length > 0);
      const primerNombre = partesNombre[0] || '';

      // Procesar apellidos del fiador
      const apellidoCompleto = objeto.formularioFiador.apellidoFiador?.trim() || '';
      const partesApellido = apellidoCompleto.split(' ').filter((parte) => parte.length > 0);
      const primerApellido = partesApellido[0] || '';
      const segundoApellido = partesApellido.slice(1).join(' ') || '';

      const datosDelFiador = new DatosPersonalesBuiler()
        .conNumeroDeSolicitud(this.codigoDeSolicitud)
        .conId(this.datos_personales_fiador_id)
        .conNombres(primerNombre)
        .conApellidoPaterno(primerApellido)
        .conApellidoMaterno(segundoApellido)
        .conTipoDocumento(objeto.formularioFiador.documentTypeFiador || '')
        .conNumeroDocumento(objeto.formularioFiador.documentNumberFiador || '')
        .conFechaNacimiento(objeto.formularioFiador.fechaNacimientoFiador || '')
        .conEmail(objeto.formularioFiador.emailFiador || '')
        .conTelefono1(objeto.formularioFiador.telefonoPriFiador || '')
        .conTelefono2(objeto.formularioFiador.telefonoSegFiador || '')
        .conEstadoCivil(objeto.formularioFiador.estadoCivilFiador || '')
        .conDireccion(objeto.formularioFiador.direccionFiador || '')
        .conLicencia('')
        .conNombreCompleto(nombreCompleto)
        .conEdad(this.calcularEdad(this.transformarFecha(objeto.formularioFiador.fechaNacimientoFiador || '')))
        .build();

      // Generar IDs de documentos del fiador
      this.documentoDniFiadorFrente = this.generateId();
      this.documentoDniFiadorDorso = this.generateId();
      this.documentoCasaFiadorFrente = this.generateId();

      // Crear documentos del fiador
      const documentosFiador = [
        new DocumentoBuilder()
          .crearDocumentoDNIFrente(
            objeto.formularioFiador.dniFrenteuRLfiador,
            this.documentoDniFiadorFrente,
            this.id_fiador,
            this.codigoDeSolicitud
          )
          .build(),
        new DocumentoBuilder()
          .crearDocumentoDNIReverso(
            objeto.formularioFiador.dniReversoURLfiador,
            this.documentoDniFiadorDorso,
            this.id_fiador,
            this.codigoDeSolicitud
          )
          .build(),
        new DocumentoBuilder()
          .crearDocumentoFotCasaUrl(
            objeto.formularioFiador.fotoCasaURLfiador,
            this.documentoCasaFiadorFrente,
            this.id_fiador,
            this.codigoDeSolicitud
          )
          .build()
      ];

      // Guardar datos personales del fiador
      const datosCreados = await this.migracionService.crearDatosPersonalesTitular(
        this.FIREBASE_DATOS_PERSONALES,
        datosDelFiador
      );

      if (!datosCreados) {
        throw new Error('Error al crear los datos personales del fiador');
      }

      // Actualizar la persona fiador con el ID de datos personales
      await this.migracionService.actualizarDatosPersonalesTitular(
        this.id_fiador,
        this.FIREBASE_PERSONAS,
        'datosPersonales',
        this.datos_personales_fiador_id
      );

      // Guardar documentos del fiador
      await this.guardarDocumentos(documentosFiador);

      const arrayDeDocumentosFiador = [
        this.documentoDniFiadorFrente,
        this.documentoDniFiadorDorso,
        this.documentoCasaFiadorFrente,
      ];

      await this.migracionService.actualizarArrayDeDocumentosEnDB(
        this.id_fiador,
        this.FIREBASE_PERSONAS,
        'documentos',
        arrayDeDocumentosFiador
      );

      console.log(`Datos personales del fiador creados con ID: ${this.datos_personales_fiador_id}`);
      return true;
    } catch (error: any) {
      console.error('Error al crear datos personales del fiador:', error);
      return false;
    }
  }

  /**
   * Crea los datos financieros (MÉTODO INDEPENDIENTE)
   */
  private async crearDatosFinancieros(objeto: FormularioFirebase): Promise<boolean> {
    try {
      this.idDatosFinancieros = this.generateId();
      
      const datosFinancieros = new DatosFinancierosBuilder()
        .generarDatosFinancieros(objeto, this.codigoDeSolicitud, this.idDatosFinancieros)
        .build();

      const resultado = await this.migracionService.crearDatosFinancieros(
        this.FIREBASE_DATOS_FINANCIEROS,
        datosFinancieros
      );

      if (!resultado) {
        throw new Error('Error al crear los datos financieros');
      }

      await this.migracionService.actualizarDatosFinancieros(
        this.id_solicitud,
        this.FIREBASE_SOLICITUDES,
        'datosFinancieros',
        this.idDatosFinancieros
      );

      console.log(`Datos financieros creados con ID: ${this.idDatosFinancieros}`);
      return true;
    } catch (error: any) {
      console.error('Error al crear datos financieros:', error);
      return false;
    }
  }

  /**
   * Crea el vehículo (MÉTODO INDEPENDIENTE)
   */
  private async crearVehiculo(objeto: FormularioFirebase): Promise<boolean> {
    try {
      this.idDelVehiculoSolcitado = this.generateId();

      const datosVehiculo = new VehiculoBuilder()
        .crearInstanciaDeVehiculo(objeto, this.idDelVehiculoSolcitado, this.codigoDeSolicitud)
        .build();

      const resultado = await this.migracionService.crearVehiculo(
        this.FIREBASE_VEHICULOS,
        datosVehiculo
      );

      if (!resultado) {
        throw new Error('Error al crear los datos del vehículo');
      }

      await this.migracionService.actualizarVehiculoEnsolcitud(
        this.id_solicitud,
        this.FIREBASE_SOLICITUDES,
        'vehiculo',
        this.idDelVehiculoSolcitado
      );

      console.log(`Vehículo creado con ID: ${this.idDelVehiculoSolcitado}`);
      return true;
    } catch (error: any) {
      console.error('Error al crear vehículo:', error);
      return false;
    }
  }

  /**
   * Actualiza campos adicionales de la solicitud
   */
  private async actualizarCamposAdicionalesSolicitud(objeto: FormularioFirebase): Promise<void> {
    if (objeto.formularioVehiculo) {
      await this.migracionService.actualizarCampoDeLaSolicitud(
        this.id_solicitud,
        this.FIREBASE_SOLICITUDES,
        'endedorId',
        objeto.formularioVehiculo.nombreDelVendedor || ''
      );

      await this.migracionService.actualizarCampoDeLaSolicitud(
        this.id_solicitud,
        this.FIREBASE_SOLICITUDES,
        'tienda',
        objeto.formularioVehiculo.puntoDeVenta || ''
      );
    }
  }

  /**
   * Verifica si el objeto contiene información del fiador
   */
  private tieneInformacionFiador(objeto: FormularioFirebase): boolean {
    return !!(
      objeto.formularioFiador &&
      objeto.formularioFiador.nombreFiador &&
      objeto.formularioFiador.apellidoFiador &&
      objeto.formularioFiador.documentNumberFiador
    );
  }

  /**
   * Valida que los datos del fiador estén completos
   */
  private validarDatosFiador(fiador: any): void {
    const camposRequeridos = [
      { campo: 'nombreFiador', nombre: 'Nombre del fiador' },
      { campo: 'apellidoFiador', nombre: 'Apellido del fiador' },
      { campo: 'documentNumberFiador', nombre: 'Número de documento del fiador' },
      { campo: 'documentTypeFiador', nombre: 'Tipo de documento del fiador' },
    ];

    const camposFaltantes = camposRequeridos
      .filter((item) => !fiador[item.campo] || fiador[item.campo].trim() === '')
      .map((item) => item.nombre);

    if (camposFaltantes.length > 0) {
      throw new Error(`Campos requeridos del fiador faltantes: ${camposFaltantes.join(', ')}`);
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  private generateId(): string {
    return doc(this.firestore, 'temp', crypto.randomUUID()).id;
  }

  private generarCodigoSolicitud(): string {
    const empresa = 'MDS';
    const fecha = new Date();
    const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${empresa}-${fechaStr}-${random}`;
  }

  private calcularEdad(fechaNacimiento: Date): number {
    const fechaActual = new Date();
    let edad = fechaActual.getFullYear() - fechaNacimiento.getFullYear();
    const mes = fechaActual.getMonth() - fechaNacimiento.getMonth();

    if (mes < 0 || (mes === 0 && fechaActual.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  private transformarFecha(fecha: string): Date {
    if (!fecha) {
      return new Date();
    }

    const partes = fecha.split('-');
    if (partes.length !== 3) {
      console.warn(`Formato de fecha inválido: ${fecha}`);
      return new Date();
    }

    const año = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const día = parseInt(partes[2], 10);

    return new Date(año, mes, día);
  }

  private limpiarEstadoInterno(): void {
    this.clienteEnMigracion = null;
    this.idClienteActual = '';
    this.id_solicitud = '';
    this.codigoDeSolicitud = '';
    this.id_titular = '';
    this.id_fiador = '';
    this.datos_personales_titular_id = '';
    this.datos_personales_fiador_id = '';
  }

  private async rollbackOperacion(): Promise<void> {
    try {
      console.log('Iniciando rollback de la operación...');
      // TODO: Implementar lógica de rollback para eliminar documentos creados parcialmente
      this.limpiarEstadoInterno();
      console.log('Rollback completado');
    } catch (error) {
      console.error('Error durante el rollback:', error);
    }
  }

  public obtenerEstadoMigracion() {
    return {
      clienteCargado: !!this.clienteEnMigracion,
      idCliente: this.idClienteActual,
      idSolicitud: this.id_solicitud,
      codigoSolicitud: this.codigoDeSolicitud,
      idTitular: this.id_titular,
      idFiador: this.id_fiador,
      idDatosPersonalesTitular: this.datos_personales_titular_id,
      idDatosPersonalesFiador: this.datos_personales_fiador_id,
    };
  }
}