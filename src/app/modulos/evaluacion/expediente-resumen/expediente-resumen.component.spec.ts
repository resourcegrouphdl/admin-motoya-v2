import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpedienteResumenComponent } from './expediente-resumen.component';

describe('ExpedienteResumenComponent', () => {
  let component: ExpedienteResumenComponent;
  let fixture: ComponentFixture<ExpedienteResumenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpedienteResumenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpedienteResumenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
