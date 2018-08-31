import { Injectable } from '@angular/core';

import { config } from '../../../assets/config';

@Injectable()
export class NetMetricsConfig {

  public defaultConfig = config;

  constructor() {
  }

}
