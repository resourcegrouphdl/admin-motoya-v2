import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreDetailsDialogComponent } from './store-details-dialog.component';

describe('StoreDetailsDialogComponent', () => {
  let component: StoreDetailsDialogComponent;
  let fixture: ComponentFixture<StoreDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreDetailsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
