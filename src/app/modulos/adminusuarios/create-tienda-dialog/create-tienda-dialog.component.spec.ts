import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTiendaDialogComponent } from './create-tienda-dialog.component';

describe('CreateTiendaDialogComponent', () => {
  let component: CreateTiendaDialogComponent;
  let fixture: ComponentFixture<CreateTiendaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTiendaDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateTiendaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
