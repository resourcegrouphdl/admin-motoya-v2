import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferenciaDetalleComponent } from './referencia-detalle.component';

describe('ReferenciaDetalleComponent', () => {
  let component: ReferenciaDetalleComponent;
  let fixture: ComponentFixture<ReferenciaDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferenciaDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferenciaDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
