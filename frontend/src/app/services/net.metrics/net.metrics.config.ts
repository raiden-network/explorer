import { Injectable } from '@angular/core';

export interface Config {
  backend_url: string;
  http_timeout: number;
  poll_interval: number;
  etherscan_base_url: string;
  echo_node_address: string;
  network_name: string;
}

const defaultConfiguration: Config = {
  backend_url: 'http://explorer.raiden.network:4567/json',
  http_timeout: 60000,
  poll_interval: 10000,
  etherscan_base_url: 'https://ropsten.etherscan.io/address/',
  echo_node_address: '0x02f4b6BC65561A792836212Ebc54434Db0Ab759a',
  network_name: 'ropsten'
};

@Injectable()
export class NetMetricsConfig {
  private _configuration: Config = defaultConfiguration;

  public get configuration(): Config {
    return this._configuration;
  }

  constructor(config: Config) {
    this._configuration = config;
  }
}
