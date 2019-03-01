import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkAveragesComponent } from './network-averages.component';

describe('NetworkAveragesComponent', () => {
  let component: NetworkAveragesComponent;
  let fixture: ComponentFixture<NetworkAveragesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NetworkAveragesComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkAveragesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
