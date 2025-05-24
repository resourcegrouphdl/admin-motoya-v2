import { animate, style, transition, trigger } from '@angular/animations';
import { NgIf } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

declare const window: any;

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [NgIf],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css',
  animations: [
    trigger('fadeOut', [
      transition(':leave', [
        animate('700ms ease-out', style({ opacity: 0 }))
      ]),
      transition(':enter', [
        style({ opacity: 0 }),
        animate('700ms ease-in', style({ opacity: 1 }))
      ]),
    ])
  ]
})
export class LoadingComponent implements OnInit{


   showContent = true;
   ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;


   constructor(private router: Router) {}

   ngOnInit(): void {
    this.listenForUpdateFinished()
    this.transitionToLogin() 
  }

  listenForUpdateFinished() {
    if (this.ipcRenderer) {
      this.ipcRenderer.once('update-finished', () => {
        this.transitionToLogin();
      });
    } else {
      // Fallback si no está Electron
      setTimeout(() => this.transitionToLogin(), 2000);
    }
  }

  transitionToLogin() {
    this.showContent = false;
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 700); // tiempo igual a la animación
  }


 

  
  



 @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private stars: { x: number, y: number, radius: number, velocity: number }[] = [];
  private animationFrameId = 0;

  ngAfterViewInit(): void {
    this.setupCanvas();
    this.generateStars(200); // Ajusta el número de estrellas
    this.animate();
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private generateStars(count: number): void {
    const canvas = this.canvasRef.nativeElement;
    this.stars = Array.from({ length: count }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      velocity: Math.random() * 0.5 + 0.2,
    }));
  }

  private animate = () => {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = 'white';

    for (const star of this.stars) {
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fill();

      star.y += star.velocity;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  @HostListener('window:resize')
  onResize() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.generateStars(this.stars.length);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
  }
}
