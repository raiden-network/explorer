import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SharedService } from './shared.service';
import { NMResponse } from '../../models/NMResponse';
import { NMConfig } from '../../models/NMConfig';

import { config } from '../../../assets/config';

@Injectable()
export class NetMetricsConfig {

  public defaultConfig = config;
  // public defaultConfig = default_configuration;
  public api: string;

  constructor(private http: HttpClient, private sharedService: SharedService) {}

  // What is the purpose of this method?
  // Method referenced in app.module.ts yet it seems serve no purpose there. 
  /*
  * Retrieves valid configuration settings
  */
/*  load(url: string): Promise<NMResponse> {
    const that = this;
    return new Promise<NMResponse>((fulfill, reject) => {
      that.http.get<NMConfig>(url)
        .subscribe(
          (config: any) => {
          that.defaultConfig = config;
          that.api = config.resource;
          that.sharedService.httpTimeout = config.http_timeout;
          fulfill({
            code: 201,
            body: 'Successfully loaded configuration.'
          });
        },
        (err) => {
          reject({
            code: 400,
            body: 'Could not load Raiden Net Metrics configuration'
          });
          });
    });
  }*/

} // class
