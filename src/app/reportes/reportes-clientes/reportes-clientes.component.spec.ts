import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesClientesComponent } from './reportes-clientes.component';

describe('ReportesClientesComponent', () => {
  let component: ReportesClientesComponent;
  let fixture: ComponentFixture<ReportesClientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesClientesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
