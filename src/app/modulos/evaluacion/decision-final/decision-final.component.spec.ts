import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecisionFinalComponent } from './decision-final.component';

describe('DecisionFinalComponent', () => {
  let component: DecisionFinalComponent;
  let fixture: ComponentFixture<DecisionFinalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecisionFinalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecisionFinalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
