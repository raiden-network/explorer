import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NetworkAveragesComponent } from './network-averages.component';

describe('NetworkAveragesComponent', () => {
  let component: NetworkAveragesComponent;
  let fixture: ComponentFixture<NetworkAveragesComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [NetworkAveragesComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkAveragesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
