import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalChannelsByDepositComponent } from './total-channels-by-deposit.component';

describe('TotalChannelsByDepositComponent', () => {
  let component: TotalChannelsByDepositComponent;
  let fixture: ComponentFixture<TotalChannelsByDepositComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TotalChannelsByDepositComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalChannelsByDepositComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
