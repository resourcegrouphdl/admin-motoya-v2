import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaDeSolicitudesComponent } from './tabla-de-solicitudes.component';

describe('TablaDeSolicitudesComponent', () => {
  let component: TablaDeSolicitudesComponent;
  let fixture: ComponentFixture<TablaDeSolicitudesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaDeSolicitudesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaDeSolicitudesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
