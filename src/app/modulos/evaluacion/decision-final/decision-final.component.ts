import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpedienteCompleto } from '../../admin-clientes/modelos/modelos-solicitudes';

interface CriterioDecision {
  id: string;
  nombre: string;
  peso: number;
  puntuacion: number;
  estado: 'favorable' | 'neutro' | 'desfavorable';
  observaciones: string;
  esObligatorio: boolean;
}

interface RecomendacionComite {
  decision: 'aprobar' | 'rechazar' | 'condicional';
  confianza: number;
  factoresClave: string[];
  riesgosIdentificados: string[];
  condicionesSugeridas: string[];
}

interface HistorialDecisiones {
  fecha: Date;
  evaluador: string;
  decision: 'aprobar' | 'rechazar' | 'condicional';
  score: number;
  observaciones: string;
}

@Component({
  selector: 'app-decision-final',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatStepperModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    ReactiveFormsModule
  ],
  templateUrl: './decision-final.component.html',
  styleUrl: './decision-final.component.css'
})
export class DecisionFinalComponent implements OnInit, OnChanges {

  @Input() expediente!: ExpedienteCompleto;

  // Formularios de decisión
  formularioDecision!: FormGroup;
  formularioCondiciones!: FormGroup;

  // Datos procesados
  criteriosDecision: CriterioDecision[] = [];
  recomendacionComite: RecomendacionComite | null = null;
  historialDecisiones: HistorialDecisiones[] = [];

  // Scores y métricas
  scoreConsolidado = 0;
  nivelRiesgoFinal = 'medio';
  probabilidadDefault = 0;

  // Estado de la UI
  seccionExpandida = 'resumen';
  mostrarFormularioDecision = false;
  decisionTomada = false;

  // Configuración de umbrales
  readonly UMBRALES_DECISION = {
    rechazo: 40,
    condicional: 65,
    aprobacion: 80,
    excelente: 90
  };

  readonly TIPOS_DECISION = [
    { value: 'aprobar', label: 'Aprobar', color: 'primary' as const, icon: 'check_circle' },
    { value: 'rechazar', label: 'Rechazar', color: 'warn' as const, icon: 'cancel' },
    { value: 'condicional', label: 'Aprobar con Condiciones', color: 'accent' as const, icon: 'warning' }
  ];

  readonly CONDICIONES_PREDEFINIDAS = [
    'Incrementar inicial al 25% del valor del vehículo',
    'Proporcionar fiador adicional o mejorar perfil actual',
    'Verificar ingresos con documentación adicional',
    'Reducir monto del crédito en 20%',
    'Incluir seguro de vida y desempleo',
    'Establecer cuotas quincenales obligatorias',
    'Solicitar avalúo actualizado del vehículo',
    'Completar curso de educación financiera'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.inicializarFormularios();
  }

  ngOnInit(): void {
    this.procesarDecisionFinal();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expediente'] && !changes['expediente'].firstChange) {
      this.procesarDecisionFinal();
    }
  }

  // ======================================
  // INICIALIZACIÓN
  // ======================================

  private inicializarFormularios(): void {
    this.formularioDecision = this.formBuilder.group({
      decision: ['', [Validators.required]],
      montoAprobado: [0, [Validators.min(1000)]],
      tasaInteres: [18.5, [Validators.min(1), Validators.max(50)]],
      plazoQuincenas: [24, [Validators.min(6), Validators.max(60)]],
      motivoDecision: ['', [Validators.required, Validators.minLength(10)]],
      requiereAprobacionSupervisor: [false],
      observacionesComite: ['']
    });

    this.formularioCondiciones = this.formBuilder.group({
      condicionesSeleccionadas: [[]],
      condicionesAdicionales: [''],
      plazoCondiciones: [30, [Validators.min(1), Validators.max(90)]],
      responsableVerificacion: [''],
      fechaLimiteCondiciones: ['']
    });

    // Suscribirse a cambios en la decisión
    this.formularioDecision.get('decision')?.valueChanges.subscribe(decision => {
      this.ajustarFormularioSegunDecision(decision);
    });
  }

  private ajustarFormularioSegunDecision(decision: string): void {
    const montoControl = this.formularioDecision.get('montoAprobado');
    const tasaControl = this.formularioDecision.get('tasaInteres');
    const supervisorControl = this.formularioDecision.get('requiereAprobacionSupervisor');

    switch (decision) {
      case 'aprobar':
        montoControl?.setValidators([Validators.required, Validators.min(1000)]);
        tasaControl?.setValidators([Validators.required, Validators.min(1), Validators.max(50)]);
        supervisorControl?.setValue(this.scoreConsolidado < this.UMBRALES_DECISION.excelente);
        break;
      
      case 'condicional':
        montoControl?.setValidators([Validators.required, Validators.min(1000)]);
        tasaControl?.setValidators([Validators.required, Validators.min(1), Validators.max(50)]);
        supervisorControl?.setValue(true);
        break;
      
      case 'rechazar':
        montoControl?.clearValidators();
        tasaControl?.clearValidators();
        supervisorControl?.setValue(false);
        break;
    }

    montoControl?.updateValueAndValidity();
    tasaControl?.updateValueAndValidity();
  }

  // ======================================
  // PROCESAMIENTO PRINCIPAL
  // ======================================

  private procesarDecisionFinal(): void {
    if (!this.expediente) return;

    this.evaluarCriteriosDecision();
    this.calcularScoreConsolidado();
    this.generarRecomendacionComite();
    this.prepararDatosFormulario();
    this.verificarDecisionExistente();
  }

  private evaluarCriteriosDecision(): void {
    this.criteriosDecision = [
      {
        id: 'documental',
        nombre: 'Documentación Completa',
        peso: 20,
        puntuacion: this.evaluarDocumentacion(),
        estado: this.determinarEstadoCriterio(this.evaluarDocumentacion()),
        observaciones: this.generarObservacionDocumental(),
        esObligatorio: true
      },
      {
        id: 'capacidad_pago',
        nombre: 'Capacidad de Pago',
        peso: 25,
        puntuacion: this.evaluarCapacidadPago(),
        estado: this.determinarEstadoCriterio(this.evaluarCapacidadPago()),
        observaciones: this.generarObservacionCapacidadPago(),
        esObligatorio: true
      },
      {
        id: 'garantias',
        nombre: 'Garantías y Avales',
        peso: 20,
        puntuacion: this.evaluarGarantias(),
        estado: this.determinarEstadoCriterio(this.evaluarGarantias()),
        observaciones: this.generarObservacionGarantias(),
        esObligatorio: true
      },
      {
        id: 'centrales_riesgo',
        nombre: 'Centrales de Riesgo',
        peso: 15,
        puntuacion: this.evaluarCentralesRiesgo(),
        estado: this.determinarEstadoCriterio(this.evaluarCentralesRiesgo()),
        observaciones: this.generarObservacionCentrales(),
        esObligatorio: true
      },
      {
        id: 'referencias',
        nombre: 'Referencias Personales',
        peso: 10,
        puntuacion: this.evaluarReferencias(),
        estado: this.determinarEstadoCriterio(this.evaluarReferencias()),
        observaciones: this.generarObservacionReferencias(),
        esObligatorio: false
      },
      {
        id: 'entrevista',
        nombre: 'Evaluación Personal',
        peso: 10,
        puntuacion: this.evaluarEntrevista(),
        estado: this.determinarEstadoCriterio(this.evaluarEntrevista()),
        observaciones: this.generarObservacionEntrevista(),
        esObligatorio: false
      }
    ];
  }

  private calcularScoreConsolidado(): void {
    const scoreTotal = this.criteriosDecision.reduce(
      (suma, criterio) => suma + (criterio.puntuacion * criterio.peso / 100),
      0
    );
    this.scoreConsolidado = Math.round(scoreTotal);
  }

  private generarRecomendacionComite(): void {
    const score = this.scoreConsolidado;
    let decision: 'aprobar' | 'rechazar' | 'condicional';
    let confianza: number;

    // Determinar decisión recomendada
    if (score >= this.UMBRALES_DECISION.aprobacion) {
      decision = 'aprobar';
      confianza = Math.min(95, 60 + (score - this.UMBRALES_DECISION.aprobacion) * 2);
    } else if (score >= this.UMBRALES_DECISION.condicional) {
      decision = 'condicional';
      confianza = 70 + (score - this.UMBRALES_DECISION.condicional);
    } else {
      decision = 'rechazar';
      confianza = Math.max(80, 100 - (this.UMBRALES_DECISION.rechazo - score) * 2);
    }

    // Factores clave
    const factoresClave = this.identificarFactoresClave();
    const riesgosIdentificados = this.identificarRiesgos();
    const condicionesSugeridas = this.sugerirCondiciones();

    this.recomendacionComite = {
      decision,
      confianza: Math.round(confianza),
      factoresClave,
      riesgosIdentificados,
      condicionesSugeridas
    };

    this.calcularProbabilidadDefault();
  }

  // ======================================
  // EVALUADORES DE CRITERIOS
  // ======================================

  private evaluarDocumentacion(): number {
    const titular = this.expediente.titular;
    const fiador = this.expediente.fiador;
    let score = 0;

    // Documentos del titular (60%)
    if (titular.estadoValidacionDocumentos === 'aprobado') {
      score += 60;
    } else if (titular.estadoValidacionDocumentos === 'observado') {
      score += 30;
    }

    // Documentos del fiador (40%)
    if (fiador) {
      if (fiador.estadoValidacionDocumentos === 'aprobado') {
        score += 40;
      } else if (fiador.estadoValidacionDocumentos === 'observado') {
        score += 20;
      }
    } else {
      score += 20; // Sin fiador pero con documentación inicial alta
    }

    return Math.min(score, 100);
  }

  private evaluarCapacidadPago(): number {
    const solicitud = this.expediente.solicitud;
    const titular = this.expediente.titular;
    let score = 0;

    // Relación cuota/ingresos (40%)
    if (titular.montoIngresosVerificado) {
      const cuotaVsIngresos = (solicitud.montoCuota * 2) / titular.montoIngresosVerificado;
      if (cuotaVsIngresos <= 0.25) score += 40;
      else if (cuotaVsIngresos <= 0.30) score += 35;
      else if (cuotaVsIngresos <= 0.40) score += 25;
      else if (cuotaVsIngresos <= 0.50) score += 15;
    } else {
      score += 20; // Score base sin verificación
    }

    // Estabilidad de ingresos (30%)
    if (titular.ingresosVerificados) {
      const metodos = titular.metodosVerificacionIngresos || [];
      if (metodos.includes('planilla')) score += 30;
      else if (metodos.includes('contratos')) score += 25;
      else if (metodos.includes('recibos')) score += 20;
      else score += 15;
    } else {
      score += 10;
    }

    // Inicial aportada (30%)
    const porcentajeInicial = (solicitud.inicial / solicitud.precioCompraMoto) * 100;
    if (porcentajeInicial >= 30) score += 30;
    else if (porcentajeInicial >= 25) score += 25;
    else if (porcentajeInicial >= 20) score += 20;
    else if (porcentajeInicial >= 15) score += 15;
    else score += 5;

    return Math.min(score, 100);
  }

  private evaluarGarantias(): number {
    const fiador = this.expediente.fiador;
    const solicitud = this.expediente.solicitud;
    let score = 0;

    // Evaluación del fiador (70%)
    if (fiador) {
      if (fiador.esAptoCrediticiamente) score += 70;
      else if (fiador.datosVerificados) score += 50;
      else if (fiador.estadoValidacionDocumentos === 'aprobado') score += 35;
      else score += 20;
    } else {
      // Sin fiador, evaluar compensación con inicial
      const porcentajeInicial = (solicitud.inicial / solicitud.precioCompraMoto) * 100;
      if (porcentajeInicial >= 35) score += 40;
      else if (porcentajeInicial >= 30) score += 30;
      else score += 15;
    }

    // Vehículo como garantía (30%)
    const vehiculo = this.expediente.vehiculo;
    if (vehiculo.esNuevo) score += 30;
    else if (vehiculo.antiguedad <= 3) score += 25;
    else if (vehiculo.antiguedad <= 5) score += 20;
    else score += 15;

    return Math.min(score, 100);
  }

  private evaluarCentralesRiesgo(): number {
    const titular = this.expediente.titular;
    const fiador = this.expediente.fiador;
    let score = 0;

    // Centrales del titular (70%)
    if (titular.resultadoCentrales?.scoreSBS) {
      const scoreSBS = titular.resultadoCentrales.scoreSBS;
      if (scoreSBS >= 700) score += 70;
      else if (scoreSBS >= 600) score += 60;
      else if (scoreSBS >= 500) score += 45;
      else if (scoreSBS >= 400) score += 30;
      else if (scoreSBS >= 300) score += 15;
    } else {
      score += 35; // Score base sin consulta
    }

    // Centrales del fiador (30%)
    if (fiador?.resultadoCentrales?.scoreSBS) {
      const scoreSBS = fiador.resultadoCentrales.scoreSBS;
      if (scoreSBS >= 600) score += 30;
      else if (scoreSBS >= 500) score += 25;
      else if (scoreSBS >= 400) score += 20;
      else if (scoreSBS >= 300) score += 10;
    } else if (fiador) {
      score += 15; // Score base con fiador sin consulta
    } else {
      score += 20; // Score base sin fiador
    }

    return Math.min(score, 100);
  }

  private evaluarReferencias(): number {
    const referencias = this.expediente.referencias;
    if (referencias.length === 0) return 0;

    const verificadas = referencias.filter(r => r.estadoVerificacion === 'verificado');
    if (verificadas.length === 0) return 20;

    const scorePromedio = verificadas.reduce((sum, r) => sum + r.puntajeReferencia, 0) / verificadas.length;
    const factorCantidad = Math.min(verificadas.length / 3, 1); // Máximo beneficio con 3 referencias

    return Math.round(scorePromedio * factorCantidad);
  }

  private evaluarEntrevista(): number {
    const entrevistas = this.expediente.evaluaciones.filter(e => e.tipoEvaluacion === 'entrevista');
    const completadas = entrevistas.filter(e => e.estado === 'completada');

    if (completadas.length === 0) return 0;

    const scoresValidos = completadas.filter(e => e.score && e.score > 0);
    if (scoresValidos.length === 0) return 50;

    return Math.round(scoresValidos.reduce((sum, e) => sum + (e.score || 0), 0) / scoresValidos.length);
  }

  // ======================================
  // ANÁLISIS DE FACTORES
  // ======================================

  private identificarFactoresClave(): string[] {
    const factores: string[] = [];

    // Factores positivos
    if (this.scoreConsolidado >= this.UMBRALES_DECISION.excelente) {
      factores.push('Excelente perfil crediticio general');
    }

    const criteriosExcelentes = this.criteriosDecision.filter(c => c.puntuacion >= 85);
    criteriosExcelentes.forEach(c => {
      factores.push(`Fortaleza en ${c.nombre.toLowerCase()}`);
    });

    if (this.expediente.fiador?.esAptoCrediticiamente) {
      factores.push('Fiador con excelente perfil crediticio');
    }

    const porcentajeInicial = (this.expediente.solicitud.inicial / this.expediente.solicitud.precioCompraMoto) * 100;
    if (porcentajeInicial >= 30) {
      factores.push('Inicial significativa que reduce riesgo');
    }

    // Factores de riesgo
    const criteriosDesfavorables = this.criteriosDecision.filter(c => c.estado === 'desfavorable');
    criteriosDesfavorables.forEach(c => {
      factores.push(`Debilidad en ${c.nombre.toLowerCase()}`);
    });

    return factores.slice(0, 5); // Máximo 5 factores
  }

  private identificarRiesgos(): string[] {
    const riesgos: string[] = [];

    // Riesgos documentales
    if (this.expediente.titular.estadoValidacionDocumentos !== 'aprobado') {
      riesgos.push('Documentación del titular incompleta o con observaciones');
    }

    // Riesgos de capacidad de pago
    if (this.expediente.titular.montoIngresosVerificado) {
      const cuotaVsIngresos = (this.expediente.solicitud.montoCuota * 2) / this.expediente.titular.montoIngresosVerificado;
      if (cuotaVsIngresos > 0.4) {
        riesgos.push('Alta relación cuota/ingresos (>40%)');
      }
    }

    // Riesgos de garantías
    if (!this.expediente.fiador) {
      const porcentajeInicial = (this.expediente.solicitud.inicial / this.expediente.solicitud.precioCompraMoto) * 100;
      if (porcentajeInicial < 25) {
        riesgos.push('Sin fiador y con inicial baja (<25%)');
      }
    }

    // Riesgos de centrales
    const scoreSBS = this.expediente.titular.resultadoCentrales?.scoreSBS;
    if (scoreSBS && scoreSBS < 500) {
      riesgos.push('Score en centrales de riesgo por debajo del promedio');
    }

    // Riesgos de referencias
    const referenciasVerificadas = this.expediente.referencias.filter(r => r.estadoVerificacion === 'verificado').length;
    if (referenciasVerificadas < 2) {
      riesgos.push('Número insuficiente de referencias verificadas');
    }

    return riesgos;
  }

  private sugerirCondiciones(): string[] {
    const condiciones: string[] = [];

    // Condiciones basadas en inicial
    const porcentajeInicial = (this.expediente.solicitud.inicial / this.expediente.solicitud.precioCompraMoto) * 100;
    if (porcentajeInicial < 25) {
      condiciones.push('Incrementar inicial al 25% del valor del vehículo');
    }

    // Condiciones basadas en fiador
    if (!this.expediente.fiador || !this.expediente.fiador.esAptoCrediticiamente) {
      condiciones.push('Proporcionar fiador adicional o mejorar perfil actual');
    }

    // Condiciones basadas en ingresos
    if (!this.expediente.titular.ingresosVerificados) {
      condiciones.push('Verificar ingresos con documentación adicional');
    }

    // Condiciones basadas en score
    if (this.scoreConsolidado < this.UMBRALES_DECISION.aprobacion) {
      condiciones.push('Incluir seguro de vida y desempleo');
    }

    return condiciones.slice(0, 3); // Máximo 3 condiciones sugeridas
  }

  private calcularProbabilidadDefault(): void {
    // Cálculo simplificado de probabilidad de default
    let factorRiesgo = 100 - this.scoreConsolidado;

    // Ajustes por factores específicos
    if (!this.expediente.fiador) factorRiesgo += 10;
    if (this.expediente.titular.edad < 25 || this.expediente.titular.edad > 60) factorRiesgo += 5;
    
    const porcentajeInicial = (this.expediente.solicitud.inicial / this.expediente.solicitud.precioCompraMoto) * 100;
    if (porcentajeInicial < 20) factorRiesgo += 10;

    // Convertir a probabilidad (escala 0-20%)
    this.probabilidadDefault = Math.min(Math.max(factorRiesgo * 0.2, 0), 20);
  }

  // ======================================
  // PREPARACIÓN DE FORMULARIOS
  // ======================================

  private prepararDatosFormulario(): void {
    if (!this.recomendacionComite) return;

    const solicitud = this.expediente.solicitud;
    
    this.formularioDecision.patchValue({
      decision: this.recomendacionComite.decision,
      montoAprobado: solicitud.precioCompraMoto,
      tasaInteres: this.calcularTasaSugerida(),
      plazoQuincenas: parseInt(solicitud.plazoQuincenas.toString()),
      requiereAprobacionSupervisor: this.scoreConsolidado < this.UMBRALES_DECISION.excelente
    });

    if (this.recomendacionComite.decision === 'condicional') {
      this.formularioCondiciones.patchValue({
        condicionesSeleccionadas: this.recomendacionComite.condicionesSugeridas,
        plazoCondiciones: 30,
        fechaLimiteCondiciones: this.calcularFechaLimiteCondiciones()
      });
    }
  }

  private calcularTasaSugerida(): number {
    let tasaBase = 18.5;

    // Ajustes por score
    if (this.scoreConsolidado >= this.UMBRALES_DECISION.excelente) tasaBase -= 2;
    else if (this.scoreConsolidado >= this.UMBRALES_DECISION.aprobacion) tasaBase -= 1;
    else if (this.scoreConsolidado < this.UMBRALES_DECISION.condicional) tasaBase += 2;

    // Ajustes por garantías
    if (this.expediente.fiador?.esAptoCrediticiamente) tasaBase -= 0.5;
    
    const porcentajeInicial = (this.expediente.solicitud.inicial / this.expediente.solicitud.precioCompraMoto) * 100;
    if (porcentajeInicial >= 30) tasaBase -= 0.5;

    return Math.round(tasaBase * 2) / 2; // Redondear a 0.5
  }

  private calcularFechaLimiteCondiciones(): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 30);
    return fecha.toISOString().split('T')[0];
  }

  private verificarDecisionExistente(): void {
    const solicitud = this.expediente.solicitud;
    
    if (solicitud.decisionFinal) {
      this.decisionTomada = true;
      this.mostrarFormularioDecision = false;
      
      // Cargar datos de la decisión existente
      this.formularioDecision.patchValue({
        decision: solicitud.decisionFinal,
        montoAprobado: solicitud.montoAprobado || solicitud.precioCompraMoto,
        tasaInteres: solicitud.tasaInteresAprobada || 18.5,
        motivoDecision: solicitud.motivoRechazo || 'Decisión tomada',
        observacionesComite: solicitud.observacionesGenerales || ''
      });
    }
  }

  // ======================================
  // MÉTODOS DE UTILIDAD
  // ======================================

  private determinarEstadoCriterio(puntuacion: number): 'favorable' | 'neutro' | 'desfavorable' {
    if (puntuacion >= 70) return 'favorable';
    if (puntuacion >= 50) return 'neutro';
    return 'desfavorable';
  }

  // Métodos de generación de observaciones
  private generarObservacionDocumental(): string {
    const titular = this.expediente.titular;
    const fiador = this.expediente.fiador;
    const observaciones: string[] = [];

    if (titular.estadoValidacionDocumentos === 'observado') {
      observaciones.push('Documentos del titular con observaciones');
    }
    if (fiador?.estadoValidacionDocumentos === 'observado') {
      observaciones.push('Documentos del fiador requieren corrección');
    }
    if (!titular.datosVerificados) {
      observaciones.push('Datos del titular pendientes de verificación');
    }

    return observaciones.length > 0 ? observaciones.join('. ') : 'Documentación en orden';
  }

  private generarObservacionCapacidadPago(): string {
    const solicitud = this.expediente.solicitud;
    const titular = this.expediente.titular;

    if (!titular.montoIngresosVerificado) {
      return 'Ingresos no verificados, evaluación basada en declaración';
    }

    const cuotaVsIngresos = (solicitud.montoCuota * 2) / titular.montoIngresosVerificado;
    const porcentaje = Math.round(cuotaVsIngresos * 100);

    if (cuotaVsIngresos <= 0.30) {
      return `Excelente capacidad de pago (${porcentaje}% de ingresos)`;
    } else if (cuotaVsIngresos <= 0.40) {
      return `Capacidad de pago aceptable (${porcentaje}% de ingresos)`;
    } else {
      return `Capacidad de pago comprometida (${porcentaje}% de ingresos)`;
    }
  }

  private generarObservacionGarantias(): string {
    const fiador = this.expediente.fiador;
    const porcentajeInicial = (this.expediente.solicitud.inicial / this.expediente.solicitud.precioCompraMoto) * 100;

    if (!fiador) {
      if (porcentajeInicial >= 30) {
        return 'Sin fiador, pero inicial alta compensa riesgo';
      } else {
        return 'Sin fiador y con inicial limitada';
      }
    }

    if (fiador.esAptoCrediticiamente) {
      return 'Fiador con excelente perfil crediticio';
    } else if (fiador.datosVerificados) {
      return 'Fiador con perfil aceptable';
    } else {
      return 'Fiador requiere evaluación adicional';
    }
  }

  private generarObservacionCentrales(): string {
    const titular = this.expediente.titular;
    const scoreSBS = titular.resultadoCentrales?.scoreSBS;

    if (!scoreSBS) {
      return 'Consulta a centrales de riesgo pendiente';
    }

    if (scoreSBS >= 700) {
      return 'Excelente historial en centrales de riesgo';
    } else if (scoreSBS >= 600) {
      return 'Buen historial crediticio';
    } else if (scoreSBS >= 500) {
      return 'Historial crediticio promedio';
    } else if (scoreSBS >= 400) {
      return 'Historial crediticio con observaciones';
    } else {
      return 'Historial crediticio deficiente';
    }
  }

  private generarObservacionReferencias(): string {
    const referencias = this.expediente.referencias;
    const verificadas = referencias.filter(r => r.estadoVerificacion === 'verificado');

    if (verificadas.length === 0) {
      return 'Referencias pendientes de verificación';
    }

    const scorePromedio = verificadas.reduce((sum, r) => sum + r.puntajeReferencia, 0) / verificadas.length;

    if (scorePromedio >= 80) {
      return `${verificadas.length} referencias de excelente calidad`;
    } else if (scorePromedio >= 60) {
      return `${verificadas.length} referencias de calidad aceptable`;
    } else {
      return `${verificadas.length} referencias de calidad regular`;
    }
  }

  private generarObservacionEntrevista(): string {
    const entrevistas = this.expediente.evaluaciones.filter(e => e.tipoEvaluacion === 'entrevista');
    const completadas = entrevistas.filter(e => e.estado === 'completada');

    if (completadas.length === 0) {
      return 'Entrevistas pendientes de realización';
    }

    const scoresValidos = completadas.filter(e => e.score && e.score > 0);
    if (scoresValidos.length === 0) {
      return 'Entrevistas completadas sin calificación';
    }

    const scorePromedio = scoresValidos.reduce((sum, e) => sum + (e.score || 0), 0) / scoresValidos.length;

    if (scorePromedio >= 80) {
      return 'Excelente evaluación en entrevistas personales';
    } else if (scorePromedio >= 60) {
      return 'Evaluación aceptable en entrevistas';
    } else {
      return 'Evaluación regular en entrevistas';
    }
  }

  // ======================================
  // MÉTODOS DE INTERFAZ
  // ======================================

  expandirSeccion(seccionId: string): void {
    this.seccionExpandida = this.seccionExpandida === seccionId ? '' : seccionId;
  }

  estaSeccionExpandida(seccionId: string): boolean {
    return this.seccionExpandida === seccionId;
  }

  toggleFormularioDecision(): void {
    this.mostrarFormularioDecision = !this.mostrarFormularioDecision;
  }

  // ======================================
  // ACCIONES DE DECISIÓN
  // ======================================

  async procesarDecision(): Promise<void> {
    if (this.formularioDecision.invalid) {
      this.marcarCamposInvalidos();
      this.mostrarError('Complete todos los campos requeridos');
      return;
    }

    const formData = this.formularioDecision.value;
    
    try {
      const datosDecision: any = {
        decision: formData.decision,
        montoAprobado: formData.montoAprobado,
        tasaInteres: formData.tasaInteres,
        plazoQuincenas: formData.plazoQuincenas,
        motivoDecision: formData.motivoDecision,
        observacionesComite: formData.observacionesComite,
        requiereAprobacionSupervisor: formData.requiereAprobacionSupervisor,
        scoreConsolidado: this.scoreConsolidado,
        probabilidadDefault: this.probabilidadDefault,
        fechaDecision: new Date(),
        evaluadorId: 'usuario_actual', // TODO: obtener del servicio de autenticación
        evaluadorNombre: 'Usuario Actual' // TODO: obtener del servicio de autenticación
      };

      // Agregar condiciones si es aprobación condicional
      if (formData.decision === 'condicional') {
        const condicionesData = this.formularioCondiciones.value;
        datosDecision.condicionesEspeciales = [
          ...condicionesData.condicionesSeleccionadas,
          ...(condicionesData.condicionesAdicionales ? [condicionesData.condicionesAdicionales] : [])
        ];
        datosDecision.plazoCondiciones = condicionesData.plazoCondiciones;
        datosDecision.fechaLimiteCondiciones = new Date(condicionesData.fechaLimiteCondiciones);
      }

      // TODO: Enviar al servicio para guardar
      await this.guardarDecision(datosDecision);
      
      this.decisionTomada = true;
      this.mostrarFormularioDecision = false;
      this.mostrarExito('Decisión registrada exitosamente');
      
    } catch (error) {
      console.error('Error al procesar decisión:', error);
      this.mostrarError('Error al guardar la decisión');
    }
  }

  private async guardarDecision(datosDecision: any): Promise<void> {
    // TODO: Implementar guardado en Firebase
    console.log('Guardando decisión:', datosDecision);
    
    // Simular delay de guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private marcarCamposInvalidos(): void {
    Object.keys(this.formularioDecision.controls).forEach(key => {
      const control = this.formularioDecision.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
      }
    });
  }

  modificarDecision(): void {
    this.decisionTomada = false;
    this.mostrarFormularioDecision = true;
  }

  // ======================================
  // MÉTODOS DE UTILIDAD
  // ======================================

  obtenerColorDecision(decision: string): string {
    const tipo = this.TIPOS_DECISION.find(t => t.value === decision);
    return tipo?.color || 'accent';
  }

  obtenerIconoDecision(decision: string): string {
    const tipo = this.TIPOS_DECISION.find(t => t.value === decision);
    return tipo?.icon || 'help';
  }

  obtenerColorScore(score: number): string {
    if (score >= this.UMBRALES_DECISION.excelente) return 'primary';
    if (score >= this.UMBRALES_DECISION.aprobacion) return 'primary';
    if (score >= this.UMBRALES_DECISION.condicional) return 'accent';
    return 'warn';
  }

  obtenerDescripcionScore(score: number): string {
    if (score >= this.UMBRALES_DECISION.excelente) return 'Excelente';
    if (score >= this.UMBRALES_DECISION.aprobacion) return 'Muy Bueno';
    if (score >= this.UMBRALES_DECISION.condicional) return 'Aceptable';
    if (score >= this.UMBRALES_DECISION.rechazo) return 'Regular';
    return 'Deficiente';
  }

  obtenerColorEstadoCriterio(estado: string): string {
    switch (estado) {
      case 'favorable': return 'primary';
      case 'neutro': return 'accent';
      case 'desfavorable': return 'warn';
      default: return 'accent';
    }
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(monto);
  }

  formatearPorcentaje(valor: number): string {
    return `${valor.toFixed(1)}%`;
  }

  // ======================================
  // CONTADORES PARA TEMPLATES
  // ======================================

  contarCriteriosPorEstado(estado: string): number {
    return this.criteriosDecision.filter(criterio => criterio.estado === estado).length;
  }

  obtenerPuntuacionCriterio(id: string): number {
    const criterio = this.criteriosDecision.find(c => c.id === id);
    return criterio?.puntuacion || 0;
  }

  get fechaActual(): string {
    return new Date().toLocaleDateString('es-PE');
  }

  // ======================================
  // NOTIFICACIONES
  // ======================================

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }
}