import {async, inject, TestBed} from '@angular/core/testing';
import {NetMetricsService} from './net.metrics.service';
import {NMResponse} from '../models/NMResponse';

describe('Raiden Networks Metrics testing', () => {

  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [NetMetricsService]
    });
  });

  it('Updates metrics successfully', inject([NetMetricsService]), (service: NetMetricsService) => {
    service.updateCurrentMetrics()
      .then((response: NMResponse) => {
        expect(response.code).toBe(200);
      })
      .catch((err: NMResponse) => {
        fail(err.result);
      });
  });

});
