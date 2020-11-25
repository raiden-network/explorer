import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TotalsSectionComponent } from './totals-section.component';

describe('TotalsSectionComponent', () => {
  let component: TotalsSectionComponent;
  let fixture: ComponentFixture<TotalsSectionComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TotalsSectionComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
