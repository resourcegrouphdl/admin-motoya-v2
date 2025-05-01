import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesHomeComponent } from './reportes-home.component';

describe('ReportesHomeComponent', () => {
  let component: ReportesHomeComponent;
  let fixture: ComponentFixture<ReportesHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
