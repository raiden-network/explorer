import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Config {
  backend_url: string;
  http_timeout: number;
  poll_interval: number;
  etherscan_base_url: string;
  network_type: string;
}

const defaultConfiguration: Config = {
  backend_url: 'http://explorer.raiden.network:4567/json',
  http_timeout: 60000,
  poll_interval: 10000,
  etherscan_base_url: 'https://ropsten.etherscan.io/address/',
  network_type: 'test'
};

@Injectable()
export class NetMetricsConfig {

  private _configuration: Config = defaultConfiguration;

  public get configuration(): Config {
    return this._configuration;
  }

  public get main(): boolean {
    return this._configuration.network_type === 'main';
  }

  constructor(private http: HttpClient) {
  }

  load(url: string): Promise<any> {
    return new Promise((resolve) => {
      this.http.get<Config>(url)
        .subscribe((config) => {
          this._configuration = Object.assign({}, defaultConfiguration, config);
          resolve();
        });
    });
  }
}
