import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, Observable, of } from 'rxjs';

export interface Propuesta {
  id: number;
  tienda: string;
  marca: string;
  modelo: string;
  precio: number;
  fechaPropuesta: Date;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

@Injectable({
  providedIn: 'root'
})
export class PropuestaService {

  constructor() { }
  private propuestasSubject = new BehaviorSubject<Propuesta[]>([
    {
      id: 1,
      tienda: 'MotoCenter Lima',
      marca: 'Honda',
      modelo: 'CB125F',
      precio: 4500,
      fechaPropuesta: new Date('2025-08-17'),
      estado: 'pendiente'
    },
    {
      id: 2,
      tienda: 'Motos del Norte',
      marca: 'Yamaha',
      modelo: 'XTZ125',
      precio: 5200,
      fechaPropuesta: new Date('2025-08-16'),
      estado: 'pendiente'
    },
    {
      id: 3,
      tienda: 'Speed Motors',
      marca: 'Bajaj',
      modelo: 'Pulsar 180',
      precio: 6800,
      fechaPropuesta: new Date('2025-08-15'),
      estado: 'aprobada'
    }
  ]);

  getPropuestas(): Observable<Propuesta[]> {
    return this.propuestasSubject.asObservable();
  }

  evaluarPropuesta(id: number, decision: 'aprobada' | 'rechazada', comentarios?: string): Observable<boolean> {
    const propuestas = this.propuestasSubject.value;
    const index = propuestas.findIndex(p => p.id === id);
    
    if (index !== -1) {
      propuestas[index].estado = decision;
      this.propuestasSubject.next([...propuestas]);
      return of(true).pipe(delay(1000)); // Simular latencia
    }
    
    return of(false);
  }
}
