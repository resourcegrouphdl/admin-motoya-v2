import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class TransitionService {

private _fadeState$ = new BehaviorSubject<'none' | 'fade-in' | 'fade-out'>('none');

  constructor() { }
  

  get fadeState$() {
    return this._fadeState$.asObservable();
  }

  startFadeOut() {
    this._fadeState$.next('fade-out');
  }

  startFadeIn() {
    this._fadeState$.next('fade-in');
  }

  clearFade() {
    this._fadeState$.next('none');
  }
}
