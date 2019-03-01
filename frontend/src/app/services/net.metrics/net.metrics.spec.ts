import { inject, TestBed } from '@angular/core/testing';
import { NetMetricsService } from './net.metrics.service';

describe('Raiden Networks Metrics testing', () => {
  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [NetMetricsService]
    });
  });

  it('Updates metrics successfully', inject(
    [NetMetricsService],
    (service: NetMetricsService) => {}
  ));
});
