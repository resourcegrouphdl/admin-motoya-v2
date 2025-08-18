import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleClienteDialogComponent } from './detalle-cliente-dialog.component';

describe('DetalleClienteDialogComponent', () => {
  let component: DetalleClienteDialogComponent;
  let fixture: ComponentFixture<DetalleClienteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleClienteDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleClienteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
