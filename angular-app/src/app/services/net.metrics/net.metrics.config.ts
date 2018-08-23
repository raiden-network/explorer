import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SharedService } from './shared.service';
import { NMResponse } from '../../models/NMResponse';
import { NMConfig } from '../../models/NMConfig';

import { config } from '../../../assets/config';

@Injectable()
export class NetMetricsConfig {

  public defaultConfig = config;
  public api: string;

  constructor(private http: HttpClient, private sharedService: SharedService) {}

}
