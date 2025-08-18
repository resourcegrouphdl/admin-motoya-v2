import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignarVendedorDialogComponent } from './asignar-vendedor-dialog.component';

describe('AsignarVendedorDialogComponent', () => {
  let component: AsignarVendedorDialogComponent;
  let fixture: ComponentFixture<AsignarVendedorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarVendedorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignarVendedorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
