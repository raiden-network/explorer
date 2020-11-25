import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TopParticipantsByChannelComponent } from './top-participants-by-channel.component';

describe('TopParticipantsByChannelComponent', () => {
  let component: TopParticipantsByChannelComponent;
  let fixture: ComponentFixture<TopParticipantsByChannelComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TopParticipantsByChannelComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TopParticipantsByChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
