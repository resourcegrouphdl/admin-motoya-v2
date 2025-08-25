import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProposalComponent } from './admin-proposal.component';

describe('AdminProposalComponent', () => {
  let component: AdminProposalComponent;
  let fixture: ComponentFixture<AdminProposalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProposalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProposalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
