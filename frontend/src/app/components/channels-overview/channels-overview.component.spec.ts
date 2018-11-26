import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelsOverviewComponent } from './channels-overview.component';

describe('ChannelsOverviewComponent', () => {
  let component: ChannelsOverviewComponent;
  let fixture: ComponentFixture<ChannelsOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelsOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
