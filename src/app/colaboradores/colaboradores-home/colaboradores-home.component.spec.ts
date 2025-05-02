import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColaboradoresHomeComponent } from './colaboradores-home.component';

describe('ColaboradoresHomeComponent', () => {
  let component: ColaboradoresHomeComponent;
  let fixture: ComponentFixture<ColaboradoresHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColaboradoresHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColaboradoresHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
