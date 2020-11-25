import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ActiveNetworksSectionComponent } from './active-networks-section.component';

describe('ActiveNetworksSectionComponent', () => {
  let component: ActiveNetworksSectionComponent;
  let fixture: ComponentFixture<ActiveNetworksSectionComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ActiveNetworksSectionComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ActiveNetworksSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
