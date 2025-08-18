import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropuestasListComponent } from './propuestas-list.component';

describe('PropuestasListComponent', () => {
  let component: PropuestasListComponent;
  let fixture: ComponentFixture<PropuestasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropuestasListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropuestasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
