import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientesHeaderComponent } from './clientes-header.component';

describe('ClientesHeaderComponent', () => {
  let component: ClientesHeaderComponent;
  let fixture: ComponentFixture<ClientesHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientesHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientesHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
