import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenChannelListComponent } from './open-channel-list.component';

describe('OpenChannelListComponent', () => {
  let component: OpenChannelListComponent;
  let fixture: ComponentFixture<OpenChannelListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenChannelListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenChannelListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
