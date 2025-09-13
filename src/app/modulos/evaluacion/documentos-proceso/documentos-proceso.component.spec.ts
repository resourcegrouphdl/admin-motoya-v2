import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosProcesoComponent } from './documentos-proceso.component';

describe('DocumentosProcesoComponent', () => {
  let component: DocumentosProcesoComponent;
  let fixture: ComponentFixture<DocumentosProcesoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentosProcesoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosProcesoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
