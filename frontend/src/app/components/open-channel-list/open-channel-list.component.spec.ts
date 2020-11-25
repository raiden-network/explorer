import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OpenChannelListComponent } from './open-channel-list.component';

describe('OpenChannelListComponent', () => {
  let component: OpenChannelListComponent;
  let fixture: ComponentFixture<OpenChannelListComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [OpenChannelListComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenChannelListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
