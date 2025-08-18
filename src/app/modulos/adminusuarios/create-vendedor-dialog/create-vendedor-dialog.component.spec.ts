import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateVendedorDialogComponent } from './create-vendedor-dialog.component';

describe('CreateVendedorDialogComponent', () => {
  let component: CreateVendedorDialogComponent;
  let fixture: ComponentFixture<CreateVendedorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateVendedorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateVendedorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
