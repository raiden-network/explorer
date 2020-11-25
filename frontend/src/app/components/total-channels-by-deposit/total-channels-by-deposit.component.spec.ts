import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TotalChannelsByDepositComponent } from './total-channels-by-deposit.component';

describe('TotalChannelsByDepositComponent', () => {
  let component: TotalChannelsByDepositComponent;
  let fixture: ComponentFixture<TotalChannelsByDepositComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TotalChannelsByDepositComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalChannelsByDepositComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
