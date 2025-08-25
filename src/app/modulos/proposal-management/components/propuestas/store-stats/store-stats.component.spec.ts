import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreStatsComponent } from './store-stats.component';

describe('StoreStatsComponent', () => {
  let component: StoreStatsComponent;
  let fixture: ComponentFixture<StoreStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreStatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
