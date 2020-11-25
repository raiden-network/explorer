import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ChannelsOverviewComponent } from './channels-overview.component';

describe('ChannelsOverviewComponent', () => {
  let component: ChannelsOverviewComponent;
  let fixture: ComponentFixture<ChannelsOverviewComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ChannelsOverviewComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
