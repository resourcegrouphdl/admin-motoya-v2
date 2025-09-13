import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasignacionDialogComponent } from './reasignacion-dialog.component';

describe('ReasignacionDialogComponent', () => {
  let component: ReasignacionDialogComponent;
  let fixture: ComponentFixture<ReasignacionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReasignacionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReasignacionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
