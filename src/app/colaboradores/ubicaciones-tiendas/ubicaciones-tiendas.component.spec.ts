import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UbicacionesTiendasComponent } from './ubicaciones-tiendas.component';

describe('UbicacionesTiendasComponent', () => {
  let component: UbicacionesTiendasComponent;
  let fixture: ComponentFixture<UbicacionesTiendasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UbicacionesTiendasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UbicacionesTiendasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
