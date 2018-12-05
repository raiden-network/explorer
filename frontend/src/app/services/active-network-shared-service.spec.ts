import { TestBed } from '@angular/core/testing';

import { ActiveNetworkSharedService } from './active-network-shared.service';

describe('ActiveNetworkSharedService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ActiveNetworkSharedService = TestBed.get(ActiveNetworkSharedService);
    expect(service).toBeTruthy();
  });
});
