import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearVendedorComponent } from './crear-vendedor.component';

describe('CrearVendedorComponent', () => {
  let component: CrearVendedorComponent;
  let fixture: ComponentFixture<CrearVendedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearVendedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearVendedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
