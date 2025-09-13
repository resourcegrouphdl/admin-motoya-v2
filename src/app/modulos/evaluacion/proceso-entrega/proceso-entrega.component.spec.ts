import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcesoEntregaComponent } from './proceso-entrega.component';

describe('ProcesoEntregaComponent', () => {
  let component: ProcesoEntregaComponent;
  let fixture: ComponentFixture<ProcesoEntregaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcesoEntregaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcesoEntregaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
