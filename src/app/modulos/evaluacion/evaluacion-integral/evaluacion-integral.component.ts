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
import { ExpedienteCompleto } from '../../admin-clientes/modelos/modelos-solicitudes';

interface CriterioEvaluacion {
  id: string;
  nombre: string;
  peso: number;
  scoreObtenido: number;
  scoreMaximo: number;
  estado: 'aprobado' | 'observado' | 'rechazado' | 'pendiente';
  observaciones?: string;
  recomendacion?: string;
}

interface FactorRiesgo {
  categoria: string;
  factor: string;
  nivel: 'bajo' | 'medio' | 'alto';
  impacto: number;
  descripcion: string;
  mitigable: boolean;
}

interface EvaluacionFinanciera {
  capacidadPago: number;
  estabilidadIngresos: number;
  historialCrediticio: number;
  garantias: number;
  scoreTotal: number;
  recomendacion: 'aprobar' | 'rechazar' | 'condicional';
}

interface AnalisisComparativo {
  promedioSector: number;
  posicionCliente: 'superior' | 'promedio' | 'inferior';
  factoresDiferenciadores: string[];
  benchmarks: {
    scoreMinimo: number;
    scorePromedio: number;
    scoreExcelente: number;
  };
}

@Component({
  selector: 'app-evaluacion-integral',
  standalone: true,
  imports: [CommonModule,
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
    MatTabsModule],
  templateUrl: './evaluacion-integral.component.html',
  styleUrl: './evaluacion-integral.component.css'
})
export class EvaluacionIntegralComponent implements OnInit, OnChanges{
@Input() expediente!: ExpedienteCompleto;

  // Datos procesados
  criteriosEvaluacion: CriterioEvaluacion[] = [];
  factoresRiesgo: FactorRiesgo[] = [];
  evaluacionFinanciera: EvaluacionFinanciera | null = null;
  analisisComparativo: AnalisisComparativo | null = null;
  
  // Scores calculados
  scoreDocumental = 0;
  scoreGarantes = 0;
  scoreEntrevistas = 0;
  scoreReferencias = 0;
  scoreFinal = 0;
  
  // Estado de la UI
  seccionExpandida = 'resumen';
  mostrarAnalisisDetallado = false;
  
  // Configuración de evaluación
  readonly PESOS_CRITERIOS = {
    documental: 25,
    garantes: 20,
    entrevistas: 25,
    referencias: 15,
    financiero: 15
  };

  readonly NIVELES_RIESGO: { [key: string]: { color: string; icono: string; descripcion: string } } = {
  bajo: { color: 'primary', icono: 'check_circle', descripcion: 'Riesgo Bajo' },
  medio: { color: 'accent', icono: 'warning', descripcion: 'Riesgo Medio' },
  alto: { color: 'warn', icono: 'error', descripcion: 'Riesgo Alto' }
};

  readonly UMBRALES_APROBACION = {
    rechazo: 40,
    condicional: 65,
    aprobacion: 80,
    excelente: 90
  };

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.procesarEvaluacion();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expediente'] && !changes['expediente'].firstChange) {
      this.procesarEvaluacion();
    }
  }
  contarCriteriosAprobados(): number {
  return this.criteriosEvaluacion?.filter(criterio => criterio.estado === 'aprobado').length || 0;
}
obtenerInfoNivel(nivel: string) {
  const nivelesRiesgo = this.NIVELES_RIESGO as any;
  return nivelesRiesgo[nivel] || { color: 'primary', icono: 'help', descripcion: 'Desconocido' };
}
contarFactoresPorNivel(nivel: string): number {
  return this.factoresRiesgo?.filter(factor => factor.nivel === nivel).length || 0;
}

  // ======================================
  // PROCESAMIENTO PRINCIPAL
  // ======================================

  private procesarEvaluacion(): void {
    if (!this.expediente) return;

    this.calcularScores();
    this.evaluarCriterios();
    this.analizarFactoresRiesgo();
    this.realizarEvaluacionFinanciera();
    this.generarAnalisisComparativo();
  }

  private calcularScores(): void {
    // Score Documental
    this.scoreDocumental = this.calcularScoreDocumental();
    
    // Score Garantes
    this.scoreGarantes = this.calcularScoreGarantes();
    
    // Score Entrevistas
    this.scoreEntrevistas = this.calcularScoreEntrevistas();
    
    // Score Referencias
    this.scoreReferencias = this.calcularScoreReferencias();
    
    // Score Final (promedio ponderado)
    this.scoreFinal = this.calcularScoreFinal();
  }

  private calcularScoreDocumental(): number {
    const titular = this.expediente.titular;
    const fiador = this.expediente.fiador;
    const documentos = this.expediente.documentosProceso ?? [];

    let score = 0;
    let factores = 0;

    // Documentación del titular (40 puntos)
    if (titular.estadoValidacionDocumentos === 'aprobado') {
      score += 40;
    } else if (titular.estadoValidacionDocumentos === 'observado') {
      score += 20;
    }
    factores += 40;

    // Documentación del fiador (30 puntos)
    if (fiador) {
      if (fiador.estadoValidacionDocumentos === 'aprobado') {
        score += 30;
      } else if (fiador.estadoValidacionDocumentos === 'observado') {
        score += 15;
      }
    } else {
      score += 10; // Penalización por no tener fiador
    }
    factores += 30;

    // Documentos del proceso (20 puntos)
    const documentosAprobados = documentos?.filter(d => d.estado === 'aprobado').length || 0;
    const totalDocumentos = Math.max(documentos.length, 1);
    score += (documentosAprobados / totalDocumentos) * 20;
    factores += 20;

    // Verificación de datos (10 puntos)
    if (titular.datosVerificados) score += 10;
    factores += 10;

    return Math.round((score / factores) * 100);
  }

  private calcularScoreGarantes(): number {
    const fiador = this.expediente.fiador;
    
    if (!fiador) {
      return 30; // Score bajo sin fiador
    }

    let score = 0;
    let factores = 0;

    // Validación documental (25 puntos)
    if (fiador.estadoValidacionDocumentos === 'aprobado') {
      score += 25;
    } else if (fiador.estadoValidacionDocumentos === 'observado') {
      score += 12;
    }
    factores += 25;

    // Verificación de datos (20 puntos)
    if (fiador.datosVerificados) score += 20;
    factores += 20;

    // Consulta centrales de riesgo (25 puntos)
    if (fiador.consultaCentralesRealizada) {
      const scoreSBS = fiador.resultadoCentrales?.scoreSBS || 0;
      if (scoreSBS >= 700) {
        score += 25;
      } else if (scoreSBS >= 500) {
        score += 20;
      } else if (scoreSBS >= 300) {
        score += 10;
      }
    }
    factores += 25;

    // Capacidad de aval (15 puntos)
    if (fiador.capacidadAval && fiador.capacidadAval > 0) {
      score += 15;
    }
    factores += 15;

    // Aceptación de responsabilidad (15 puntos)
    if (fiador.aceptaResponsabilidad) score += 15;
    factores += 15;

    return Math.round((score / factores) * 100);
  }

  private calcularScoreEntrevistas(): number {
    const entrevistas = this.expediente.evaluaciones.filter(e => e.tipoEvaluacion === 'entrevista');
    
    if (entrevistas.length === 0) {
      return 0;
    }

    const entrevistasCompletadas = entrevistas.filter(e => e.estado === 'completada');
    
    if (entrevistasCompletadas.length === 0) {
      return 0;
    }

    // Promedio de scores de entrevistas completadas
    const scoresValidos = entrevistasCompletadas.filter(e => e.score && e.score > 0);
    
    if (scoresValidos.length === 0) {
      return 50; // Score base si hay entrevistas pero sin scores
    }

    const promedioScores = scoresValidos.reduce((sum, e) => sum + (e.score || 0), 0) / scoresValidos.length;
    
    return Math.round(promedioScores);
  }

  private calcularScoreReferencias(): number {
    const referencias = this.expediente.referencias;
    
    if (!referencias || referencias.length === 0) {
      return 0;
    }

    const referenciasVerificadas = referencias.filter(r => r.estadoVerificacion === 'verificado');
    
    if (referenciasVerificadas.length < 2) {
      return 20; // Score bajo si no hay suficientes referencias
    }

    let scoreTotal = 0;
    let referenciasPonderadas = 0;

    referenciasVerificadas.forEach(referencia => {
      let scoreReferencia = referencia.puntajeReferencia || 0;
      
      // Bonificación por tipo de referencia
      if (referencia.tipoParentesco === 'laboral') {
        scoreReferencia += 10;
      } else if (referencia.tipoParentesco === 'familiar') {
        scoreReferencia += 5;
      }

      scoreTotal += Math.min(scoreReferencia, 100);
      referenciasPonderadas++;
    });

    return referenciasPonderadas > 0 ? Math.round(scoreTotal / referenciasPonderadas) : 0;
  }

  private calcularScoreFinal(): number {
    const pesos = this.PESOS_CRITERIOS;
    
    const scorePromedio = (
      (this.scoreDocumental * pesos.documental) +
      (this.scoreGarantes * pesos.garantes) +
      (this.scoreEntrevistas * pesos.entrevistas) +
      (this.scoreReferencias * pesos.referencias) +
      (this.calcularScoreFinanciero() * pesos.financiero)
    ) / 100;

    return Math.round(scorePromedio);
  }

  private calcularScoreFinanciero(): number {
    const solicitud = this.expediente.solicitud;
    
    let score = 0;
    
    // Porcentaje de inicial (30 puntos)
    const porcentajeInicial = (solicitud.inicial / solicitud.precioCompraMoto) * 100;
    if (porcentajeInicial >= 30) {
      score += 30;
    } else if (porcentajeInicial >= 20) {
      score += 20;
    } else if (porcentajeInicial >= 10) {
      score += 10;
    }

    // Capacidad de pago estimada (40 puntos)
    const titular = this.expediente.titular;
    if (titular.ingresosVerificados && titular.montoIngresosVerificado) {
      const cuotaVsIngresos = (solicitud.montoCuota * 2) / titular.montoIngresosVerificado;
      if (cuotaVsIngresos <= 0.3) {
        score += 40;
      } else if (cuotaVsIngresos <= 0.4) {
        score += 30;
      } else if (cuotaVsIngresos <= 0.5) {
        score += 20;
      } else {
        score += 10;
      }
    } else {
      score += 20; // Score promedio si no hay verificación
    }

    // Historial crediticio (30 puntos)
    if (titular.historialPagos) {
      switch (titular.historialPagos) {
        case 'excelente': score += 30; break;
        case 'bueno': score += 25; break;
        case 'regular': score += 15; break;
        case 'malo': score += 5; break;
      }
    } else {
      score += 15; // Score base sin historial
    }

    return Math.round(score);
  }

  // ======================================
  // EVALUACIÓN DE CRITERIOS
  // ======================================

  private evaluarCriterios(): void {
    this.criteriosEvaluacion = [
      {
        id: 'documental',
        nombre: 'Evaluación Documental',
        peso: this.PESOS_CRITERIOS.documental,
        scoreObtenido: this.scoreDocumental,
        scoreMaximo: 100,
        estado: this.determinarEstadoCriterio(this.scoreDocumental),
        observaciones: this.generarObservacionesDocumentales(),
        recomendacion: this.generarRecomendacionDocumental()
      },
      {
        id: 'garantes',
        nombre: 'Evaluación de Garantes',
        peso: this.PESOS_CRITERIOS.garantes,
        scoreObtenido: this.scoreGarantes,
        scoreMaximo: 100,
        estado: this.determinarEstadoCriterio(this.scoreGarantes),
        observaciones: this.generarObservacionesGarantes(),
        recomendacion: this.generarRecomendacionGarantes()
      },
      {
        id: 'entrevistas',
        nombre: 'Evaluación de Entrevistas',
        peso: this.PESOS_CRITERIOS.entrevistas,
        scoreObtenido: this.scoreEntrevistas,
        scoreMaximo: 100,
        estado: this.determinarEstadoCriterio(this.scoreEntrevistas),
        observaciones: this.generarObservacionesEntrevistas(),
        recomendacion: this.generarRecomendacionEntrevistas()
      },
      {
        id: 'referencias',
        nombre: 'Evaluación de Referencias',
        peso: this.PESOS_CRITERIOS.referencias,
        scoreObtenido: this.scoreReferencias,
        scoreMaximo: 100,
        estado: this.determinarEstadoCriterio(this.scoreReferencias),
        observaciones: this.generarObservacionesReferencias(),
        recomendacion: this.generarRecomendacionReferencias()
      },
      {
        id: 'financiero',
        nombre: 'Evaluación Financiera',
        peso: this.PESOS_CRITERIOS.financiero,
        scoreObtenido: this.calcularScoreFinanciero(),
        scoreMaximo: 100,
        estado: this.determinarEstadoCriterio(this.calcularScoreFinanciero()),
        observaciones: this.generarObservacionesFinancieras(),
        recomendacion: this.generarRecomendacionFinanciera()
      }
    ];
  }

  private determinarEstadoCriterio(score: number): 'aprobado' | 'observado' | 'rechazado' | 'pendiente' {
    if (score >= this.UMBRALES_APROBACION.aprobacion) return 'aprobado';
    if (score >= this.UMBRALES_APROBACION.condicional) return 'observado';
    if (score >= this.UMBRALES_APROBACION.rechazo) return 'observado';
    return 'rechazado';
  }

  // ======================================
  // ANÁLISIS DE FACTORES DE RIESGO
  // ======================================

  private analizarFactoresRiesgo(): void {
    this.factoresRiesgo = [];

    // Analizar edad del solicitante
    this.analizarEdadSolicitante();
    
    // Analizar estabilidad laboral
    this.analizarEstabilidadLaboral();
    
    // Analizar capacidad de pago
    this.analizarCapacidadPago();
    
    // Analizar historial crediticio
    this.analizarHistorialCrediticio();
    
    // Analizar garantías
    this.analizarGarantias();
    
    // Analizar referencias
    this.analizarCalidadReferencias();
  }

  private analizarEdadSolicitante(): void {
    const edad = this.expediente.titular.edad;
    
    let nivel: 'bajo' | 'medio' | 'alto' = 'bajo';
    let descripcion = '';
    
    if (edad < 21) {
      nivel = 'alto';
      descripcion = 'Edad muy joven, poca experiencia crediticia';
    } else if (edad < 25) {
      nivel = 'medio';
      descripcion = 'Edad joven, experiencia crediticia limitada';
    } else if (edad > 65) {
      nivel = 'medio';
      descripcion = 'Edad avanzada, considerar estabilidad de ingresos';
    } else {
      nivel = 'bajo';
      descripcion = 'Edad apropiada para compromiso crediticio';
    }

    this.factoresRiesgo.push({
      categoria: 'Demografico',
      factor: 'Edad del Solicitante',
      nivel,
      impacto: nivel === 'alto' ? 15 : nivel === 'medio' ? 8 : 3,
      descripcion,
      mitigable: false
    });
  }

  private analizarEstabilidadLaboral(): void {
    // Basado en la ocupación y verificación de ingresos
    const titular = this.expediente.titular;
    
    let nivel: 'bajo' | 'medio' | 'alto' = 'medio';
    let descripcion = 'Estabilidad laboral no verificada';
    
    if (titular.ingresosVerificados) {
      if (titular.metodosVerificacionIngresos?.includes('planilla')) {
        nivel = 'bajo';
        descripcion = 'Empleado con planilla, alta estabilidad';
      } else if (titular.metodosVerificacionIngresos?.includes('recibos')) {
        nivel = 'medio';
        descripcion = 'Ingresos variables, estabilidad media';
      }
    } else {
      nivel = 'alto';
      descripcion = 'Ingresos no verificados, alta incertidumbre';
    }

    this.factoresRiesgo.push({
      categoria: 'Laboral',
      factor: 'Estabilidad de Ingresos',
      nivel,
      impacto: nivel === 'alto' ? 20 : nivel === 'medio' ? 10 : 5,
      descripcion,
      mitigable: true
    });
  }

  private analizarCapacidadPago(): void {
    const solicitud = this.expediente.solicitud;
    const titular = this.expediente.titular;
    
    let nivel: 'bajo' | 'medio' | 'alto' = 'medio';
    let descripcion = 'Capacidad de pago no determinada';
    
    if (titular.montoIngresosVerificado) {
      const cuotaMensual = solicitud.montoCuota * 2;
      const ratio = cuotaMensual / titular.montoIngresosVerificado;
      
      if (ratio <= 0.3) {
        nivel = 'bajo';
        descripcion = 'Excelente capacidad de pago (≤30% de ingresos)';
      } else if (ratio <= 0.4) {
        nivel = 'medio';
        descripcion = 'Capacidad de pago aceptable (30-40% de ingresos)';
      } else {
        nivel = 'alto';
        descripcion = 'Capacidad de pago comprometida (>40% de ingresos)';
      }
    }

    this.factoresRiesgo.push({
      categoria: 'Financiero',
      factor: 'Capacidad de Pago',
      nivel,
      impacto: nivel === 'alto' ? 25 : nivel === 'medio' ? 12 : 5,
      descripcion,
      mitigable: true
    });
  }

  private analizarHistorialCrediticio(): void {
    const titular = this.expediente.titular;
    
    let nivel: 'bajo' | 'medio' | 'alto' = 'medio';
    let descripcion = 'Historial crediticio no disponible';
    
    if (titular.historialPagos) {
      switch (titular.historialPagos) {
        case 'excelente':
          nivel = 'bajo';
          descripcion = 'Historial crediticio excelente';
          break;
        case 'bueno':
          nivel = 'bajo';
          descripcion = 'Buen historial crediticio';
          break;
        case 'regular':
          nivel = 'medio';
          descripcion = 'Historial crediticio regular con algunas observaciones';
          break;
        case 'malo':
          nivel = 'alto';
          descripcion = 'Historial crediticio deficiente';
          break;
      }
    }

    this.factoresRiesgo.push({
      categoria: 'Crediticio',
      factor: 'Historial de Pagos',
      nivel,
      impacto: nivel === 'alto' ? 20 : nivel === 'medio' ? 10 : 3,
      descripcion,
      mitigable: false
    });
  }

  private analizarGarantias(): void {
    const fiador = this.expediente.fiador;
    const porcentajeInicial = (this.expediente.solicitud.inicial / this.expediente.solicitud.precioCompraMoto) * 100;
    
    let nivel: 'bajo' | 'medio' | 'alto' = 'medio';
    let descripcion = '';
    
    if (fiador && fiador.esAptoCrediticiamente && porcentajeInicial >= 25) {
      nivel = 'bajo';
      descripcion = 'Excelentes garantías: fiador calificado + inicial alta';
    } else if (fiador && porcentajeInicial >= 20) {
      nivel = 'medio';
      descripcion = 'Garantías aceptables: fiador + inicial adecuada';
    } else if (porcentajeInicial >= 30) {
      nivel = 'medio';
      descripcion = 'Inicial alta compensa falta de fiador';
    } else {
      nivel = 'alto';
      descripcion = 'Garantías limitadas: considerar reforzar';
    }

    this.factoresRiesgo.push({
      categoria: 'Garantias',
      factor: 'Nivel de Garantías',
      nivel,
      impacto: nivel === 'alto' ? 18 : nivel === 'medio' ? 8 : 3,
      descripcion,
      mitigable: true
    });
  }

  private analizarCalidadReferencias(): void {
    const referencias = this.expediente.referencias;
    const referenciasVerificadas = referencias.filter(r => r.estadoVerificacion === 'verificado');
    
    let nivel: 'bajo' | 'medio' | 'alto' = 'alto';
    let descripcion = 'Referencias insuficientes';
    
    if (referenciasVerificadas.length >= 3) {
      const scorePromedio = referenciasVerificadas.reduce((sum, r) => sum + r.puntajeReferencia, 0) / referenciasVerificadas.length;
      
      if (scorePromedio >= 80) {
        nivel = 'bajo';
        descripcion = 'Referencias excelentes y bien verificadas';
      } else if (scorePromedio >= 60) {
        nivel = 'medio';
        descripcion = 'Referencias aceptables';
      } else {
        nivel = 'alto';
        descripcion = 'Referencias de calidad cuestionable';
      }
    } else if (referenciasVerificadas.length >= 2) {
      nivel = 'medio';
      descripcion = 'Número mínimo de referencias verificadas';
    }

    this.factoresRiesgo.push({
      categoria: 'Referencias',
      factor: 'Calidad de Referencias',
      nivel,
      impacto: nivel === 'alto' ? 12 : nivel === 'medio' ? 6 : 2,
      descripcion,
      mitigable: true
    });
  }

  // ======================================
  // EVALUACIÓN FINANCIERA
  // ======================================

  private realizarEvaluacionFinanciera(): void {
    const capacidadPago = this.evaluarCapacidadPago();
    const estabilidadIngresos = this.evaluarEstabilidadIngresos();
    const historialCrediticio = this.evaluarHistorialCrediticio();
    const garantias = this.evaluarGarantias();
    
    const scoreTotal = Math.round(
      (capacidadPago * 0.35) +
      (estabilidadIngresos * 0.25) +
      (historialCrediticio * 0.25) +
      (garantias * 0.15)
    );

    let recomendacion: 'aprobar' | 'rechazar' | 'condicional' = 'rechazar';
    
    if (scoreTotal >= this.UMBRALES_APROBACION.aprobacion) {
      recomendacion = 'aprobar';
    } else if (scoreTotal >= this.UMBRALES_APROBACION.condicional) {
      recomendacion = 'condicional';
    }

    this.evaluacionFinanciera = {
      capacidadPago,
      estabilidadIngresos,
      historialCrediticio,
      garantias,
      scoreTotal,
      recomendacion
    };
  }

  private evaluarCapacidadPago(): number {
    // Ya implementado en calcularScoreFinanciero, extraemos la lógica
    const solicitud = this.expediente.solicitud;
    const titular = this.expediente.titular;
    
    if (!titular.ingresosVerificados || !titular.montoIngresosVerificado) {
      return 50; // Score promedio sin verificación
    }

    const cuotaVsIngresos = (solicitud.montoCuota * 2) / titular.montoIngresosVerificado;
    
    if (cuotaVsIngresos <= 0.25) return 100;
    if (cuotaVsIngresos <= 0.30) return 85;
    if (cuotaVsIngresos <= 0.40) return 70;
    if (cuotaVsIngresos <= 0.50) return 50;
    return 25;
  }

  private evaluarEstabilidadIngresos(): number {
    const titular = this.expediente.titular;
    
    if (!titular.ingresosVerificados) return 30;
    
    const metodos = titular.metodosVerificacionIngresos || [];
    
    if (metodos.includes('planilla')) return 95;
    if (metodos.includes('contratos')) return 85;
    if (metodos.includes('recibos')) return 70;
    if (metodos.includes('declaraciones')) return 60;
    
    return 50;
  }

  private evaluarHistorialCrediticio(): number {
    const titular = this.expediente.titular;
    
    switch (titular.historialPagos) {
      case 'excelente': return 100;
      case 'bueno': return 85;
      case 'regular': return 60;
      case 'malo': return 25;
      default: return 50;
    }
  }

  private evaluarGarantias(): number {
    const fiador = this.expediente.fiador;
    const porcentajeInicial = (this.expediente.solicitud.inicial / this.expediente.solicitud.precioCompraMoto) * 100;
    
    let score = 0;
    
    // Evaluación del fiador (60 puntos)
    if (fiador) {
      if (fiador.esAptoCrediticiamente) {
        score += 60;
      } else if (fiador.datosVerificados) {
        score += 40;
      } else {
        score += 20;
      }
    }
    
    // Evaluación de la inicial (40 puntos)
    if (porcentajeInicial >= 30) {
      score += 40;
    } else if (porcentajeInicial >= 25) {
      score += 35;
    } else if (porcentajeInicial >= 20) {
      score += 30;
    } else if (porcentajeInicial >= 15) {
      score += 20;
    } else {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  // ======================================
  // ANÁLISIS COMPARATIVO
  // ======================================

  private generarAnalisisComparativo(): void {
    // Simulación de datos de mercado - en producción vendría de una API
    const promedioSector = 72; // Score promedio del sector
    const posicionCliente = this.scoreFinal >= promedioSector ? 
      (this.scoreFinal >= promedioSector + 10 ? 'superior' : 'promedio') : 'inferior';

    const factoresDiferenciadores: string[] = [];
    
    // Identificar factores diferenciadores
    if (this.scoreDocumental >= 85) {
      factoresDiferenciadores.push('Excelente documentación');
    }
    if (this.scoreGarantes >= 80) {
      factoresDiferenciadores.push('Garantías sólidas');
    }
    if (this.scoreEntrevistas >= 85) {
      factoresDiferenciadores.push('Perfil personal destacado');
    }
    if (this.scoreReferencias >= 80) {
      factoresDiferenciadores.push('Referencias de alta calidad');
    }

    this.analisisComparativo = {
      promedioSector,
      posicionCliente,
      factoresDiferenciadores,
      benchmarks: {
        scoreMinimo: 45,
        scorePromedio: 72,
        scoreExcelente: 88
      }
    };
  }

  // ======================================
  // GENERADORES DE OBSERVACIONES Y RECOMENDACIONES
  // ======================================

  private generarObservacionesDocumentales(): string {
    const titular = this.expediente.titular;
    const fiador = this.expediente.fiador;
    const observaciones: string[] = [];

    if (titular.estadoValidacionDocumentos !== 'aprobado') {
      observaciones.push('Documentación del titular requiere atención');
    }
    if (fiador && fiador.estadoValidacionDocumentos !== 'aprobado') {
      observaciones.push('Documentación del fiador requiere revisión');
    }
    if (!titular.datosVerificados) {
      observaciones.push('Datos del titular no han sido verificados');
    }

    return observaciones.length > 0 ? observaciones.join('. ') : 'Documentación en orden';
  }

  private generarRecomendacionDocumental(): string {
    if (this.scoreDocumental >= 80) {
      return 'Documentación completa y satisfactoria';
    } else if (this.scoreDocumental >= 60) {
      return 'Completar observaciones menores antes de continuar';
    } else {
      return 'Requiere mejoras significativas en la documentación';
    }
  }

  private generarObservacionesGarantes(): string {
    const fiador = this.expediente.fiador;
    
    if (!fiador) {
      return 'No cuenta con fiador registrado';
    }

    const observaciones: string[] = [];
    
    if (!fiador.datosVerificados) {
      observaciones.push('Datos del fiador no verificados');
    }
    if (!fiador.consultaCentralesRealizada) {
      observaciones.push('Falta consulta a centrales de riesgo');
    }
    if (!fiador.aceptaResponsabilidad) {
      observaciones.push('Fiador no ha aceptado formalmente la responsabilidad');
    }

    return observaciones.length > 0 ? observaciones.join('. ') : 'Fiador calificado adecuadamente';
  }

  private generarRecomendacionGarantes(): string {
    if (!this.expediente.fiador) {
      return 'Considerar incrementar inicial o conseguir fiador calificado';
    } else if (this.scoreGarantes >= 80) {
      return 'Fiador cumple satisfactoriamente con los requisitos';
    } else if (this.scoreGarantes >= 60) {
      return 'Completar validaciones pendientes del fiador';
    } else {
      return 'Evaluar cambio de fiador o reforzar garantías';
    }
  }

  private generarObservacionesEntrevistas(): string {
    const entrevistas = this.expediente.evaluaciones.filter(e => e.tipoEvaluacion === 'entrevista');
    const completadas = entrevistas.filter(e => e.estado === 'completada');
    
    if (completadas.length === 0) {
      return 'No se han realizado entrevistas';
    }

    const observaciones: string[] = [];
    const scorePromedio = completadas.reduce((sum, e) => sum + (e.score || 0), 0) / completadas.length;
    
    if (scorePromedio < 60) {
      observaciones.push('Scores de entrevistas por debajo del promedio esperado');
    }
    
    const conObservaciones = completadas.filter(e => e.requiereRevision);
    if (conObservaciones.length > 0) {
      observaciones.push(`${conObservaciones.length} entrevistas requieren revisión adicional`);
    }

    return observaciones.length > 0 ? observaciones.join('. ') : 'Entrevistas completadas satisfactoriamente';
  }

  private generarRecomendacionEntrevistas(): string {
    if (this.scoreEntrevistas >= 80) {
      return 'Perfil del solicitante muy favorable';
    } else if (this.scoreEntrevistas >= 60) {
      return 'Perfil aceptable, considerar factores adicionales';
    } else if (this.scoreEntrevistas === 0) {
      return 'Programar y realizar entrevistas requeridas';
    } else {
      return 'Considerar entrevistas adicionales o evaluación más detallada';
    }
  }

  private generarObservacionesReferencias(): string {
    const referencias = this.expediente.referencias;
    const verificadas = referencias.filter(r => r.estadoVerificacion === 'verificado');
    
    const observaciones: string[] = [];
    
    if (verificadas.length < 2) {
      observaciones.push('Número insuficiente de referencias verificadas');
    }
    
    const scorePromedio = verificadas.length > 0 ? 
      verificadas.reduce((sum, r) => sum + r.puntajeReferencia, 0) / verificadas.length : 0;
    
    if (scorePromedio < 60) {
      observaciones.push('Calidad promedio de referencias por debajo de estándares');
    }

    return observaciones.length > 0 ? observaciones.join('. ') : 'Referencias verificadas satisfactoriamente';
  }

  private generarRecomendacionReferencias(): string {
    const verificadas = this.expediente.referencias.filter(r => r.estadoVerificacion === 'verificado');
    
    if (verificadas.length === 0) {
      return 'Contactar y verificar referencias proporcionadas';
    } else if (this.scoreReferencias >= 80) {
      return 'Referencias de excelente calidad';
    } else if (this.scoreReferencias >= 60) {
      return 'Referencias aceptables';
    } else {
      return 'Considerar solicitar referencias adicionales de mejor calidad';
    }
  }

  private generarObservacionesFinancieras(): string {
    const solicitud = this.expediente.solicitud;
    const titular = this.expediente.titular;
    const observaciones: string[] = [];

    const porcentajeInicial = (solicitud.inicial / solicitud.precioCompraMoto) * 100;
    if (porcentajeInicial < 20) {
      observaciones.push('Inicial por debajo del 20% recomendado');
    }

    if (!titular.ingresosVerificados) {
      observaciones.push('Ingresos del titular no han sido verificados');
    } else if (titular.montoIngresosVerificado) {
      const cuotaVsIngresos = (solicitud.montoCuota * 2) / titular.montoIngresosVerificado;
      if (cuotaVsIngresos > 0.4) {
        observaciones.push('Cuota excede el 40% de los ingresos verificados');
      }
    }

    return observaciones.length > 0 ? observaciones.join('. ') : 'Situación financiera favorable';
  }

  private generarRecomendacionFinanciera(): string {
    const scoreFinanciero = this.calcularScoreFinanciero();
    
    if (scoreFinanciero >= 80) {
      return 'Excelente perfil financiero para el crédito solicitado';
    } else if (scoreFinanciero >= 60) {
      return 'Perfil financiero aceptable con reservas menores';
    } else {
      return 'Perfil financiero requiere mejoras o ajustes en condiciones';
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

  toggleAnalisisDetallado(): void {
    this.mostrarAnalisisDetallado = !this.mostrarAnalisisDetallado;
  }

  // ======================================
  // GETTERS Y UTILIDADES
  // ======================================

  get recomendacionFinal(): 'aprobar' | 'rechazar' | 'condicional' {
    if (this.scoreFinal >= this.UMBRALES_APROBACION.aprobacion) {
      return 'aprobar';
    } else if (this.scoreFinal >= this.UMBRALES_APROBACION.condicional) {
      return 'condicional';
    } else {
      return 'rechazar';
    }
  }

  get colorRecomendacion(): 'primary' | 'accent' | 'warn' {
    switch (this.recomendacionFinal) {
      case 'aprobar': return 'primary';
      case 'condicional': return 'accent';
      case 'rechazar': return 'warn';
    }
  }

  get nivelRiesgoGeneral(): 'bajo' | 'medio' | 'alto' {
    const riesgoTotal = this.factoresRiesgo.reduce((sum, factor) => sum + factor.impacto, 0);
    
    if (riesgoTotal <= 30) return 'bajo';
    if (riesgoTotal <= 60) return 'medio';
    return 'alto';
  }

  obtenerColorScore(score: number): 'primary' | 'accent' | 'warn' {
    if (score >= this.UMBRALES_APROBACION.aprobacion) return 'primary';
    if (score >= this.UMBRALES_APROBACION.condicional) return 'accent';
    return 'warn';
  }

  obtenerDescripcionScore(score: number): string {
    if (score >= this.UMBRALES_APROBACION.excelente) return 'Excelente';
    if (score >= this.UMBRALES_APROBACION.aprobacion) return 'Muy Bueno';
    if (score >= this.UMBRALES_APROBACION.condicional) return 'Aceptable';
    if (score >= this.UMBRALES_APROBACION.rechazo) return 'Regular';
    return 'Deficiente';
  }

  formatearPorcentaje(valor: number): string {
    return `${valor.toFixed(1)}%`;
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(monto);
  }

  // ======================================
  // ACCIONES
  // ======================================

  exportarEvaluacion(): void {
    try {
      const evaluacion = {
        solicitudId: this.expediente.solicitud.id,
        fechaEvaluacion: new Date().toISOString(),
        scores: {
          documental: this.scoreDocumental,
          garantes: this.scoreGarantes,
          entrevistas: this.scoreEntrevistas,
          referencias: this.scoreReferencias,
          financiero: this.calcularScoreFinanciero(),
          final: this.scoreFinal
        },
        recomendacion: this.recomendacionFinal,
        nivelRiesgo: this.nivelRiesgoGeneral,
        criterios: this.criteriosEvaluacion,
        factoresRiesgo: this.factoresRiesgo,
        evaluacionFinanciera: this.evaluacionFinanciera,
        analisisComparativo: this.analisisComparativo
      };

      const blob = new Blob([JSON.stringify(evaluacion, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evaluacion_integral_${this.expediente.solicitud.id}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      this.mostrarExito('Evaluación exportada exitosamente');
    } catch (error) {
      this.mostrarError('Error al exportar la evaluación');
    }
  }

  generarReporte(): void {
    try {
      const reporte = this.construirReporteCompleto();
      
      const blob = new Blob([JSON.stringify(reporte, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_evaluacion_${this.expediente.solicitud.id}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      this.mostrarExito('Reporte generado exitosamente');
    } catch (error) {
      this.mostrarError('Error al generar el reporte');
    }
  }

  private construirReporteCompleto() {
    return {
      fechaGeneracion: new Date().toLocaleString('es-PE'),
      solicitud: {
        id: this.expediente.solicitud.id,
        numero: this.expediente.solicitud.numeroSolicitud,
        estado: this.expediente.solicitud.estado
      },
      solicitante: {
        nombre: this.expediente.titular.nombreCompleto,
        edad: this.expediente.titular.edad,
        ocupacion: this.expediente.titular.ocupacion
      },
      evaluacionIntegral: {
        scoreFinal: this.scoreFinal,
        recomendacion: this.recomendacionFinal,
        nivelRiesgo: this.nivelRiesgoGeneral,
        detallePorCriterios: this.criteriosEvaluacion.map(c => ({
          criterio: c.nombre,
          score: c.scoreObtenido,
          peso: c.peso,
          estado: c.estado,
          observaciones: c.observaciones
        }))
      },
      analisisRiesgo: {
        factoresIdentificados: this.factoresRiesgo.length,
        riesgoTotal: this.factoresRiesgo.reduce((sum, f) => sum + f.impacto, 0),
        factoresMitigables: this.factoresRiesgo.filter(f => f.mitigable).length,
        detalleFactores: this.factoresRiesgo
      },
      recomendacionesFinales: this.generarRecomendacionesFinales(),
      condicionesEspeciales: this.generarCondicionesEspeciales()
    };
  }

  private generarRecomendacionesFinales(): string[] {
    const recomendaciones: string[] = [];

    switch (this.recomendacionFinal) {
      case 'aprobar':
        recomendaciones.push('Aprobar el crédito según términos solicitados');
        if (this.scoreFinal >= this.UMBRALES_APROBACION.excelente) {
          recomendaciones.push('Cliente califica para condiciones preferenciales');
        }
        break;
      
      case 'condicional':
        recomendaciones.push('Aprobar con condiciones especiales');
        if (this.scoreDocumental < 70) {
          recomendaciones.push('Completar observaciones documentales pendientes');
        }
        if (this.scoreGarantes < 70) {
          recomendaciones.push('Reforzar garantías o incrementar inicial');
        }
        break;
      
      case 'rechazar':
        recomendaciones.push('No aprobar el crédito en condiciones actuales');
        recomendaciones.push('Sugerir al cliente mejorar perfil crediticio');
        break;
    }

    return recomendaciones;
  }

  private generarCondicionesEspeciales(): string[] {
    const condiciones: string[] = [];

    if (this.recomendacionFinal === 'condicional') {
      const porcentajeInicial = (this.expediente.solicitud.inicial / this.expediente.solicitud.precioCompraMoto) * 100;
      
      if (porcentajeInicial < 25) {
        condiciones.push('Incrementar inicial al 25% del valor del vehículo');
      }
      
      if (!this.expediente.fiador || this.scoreGarantes < 70) {
        condiciones.push('Proporcionar fiador adicional o mejorar perfil del actual');
      }
      
      if (this.scoreReferencias < 60) {
        condiciones.push('Proporcionar referencias adicionales de mejor calidad');
      }
    }

    return condiciones;
  }

  // ======================================
  // UTILIDADES DE NOTIFICACIÓN
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
}