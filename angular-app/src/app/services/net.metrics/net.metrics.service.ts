declare let require: any;
import { NetMetricsConfig } from './net.metrics.config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NMAPIResponse } from '../../models/NMAPIResponse';
import { NMResponse } from '../../models/NMResponse';
import { NMNetwork } from '../../models/NMNetwork';
import * as NMNetworkSchema from '../../models/NMNetwork.schema';
import { NMRestructuredData } from '../../models/NMRestructuredData';

const Ajv = require('ajv');

const networkSchema = NMNetworkSchema.schema;
const ajv = new Ajv({allErrors: true});

@Injectable()
export class NetMetricsService {

  private currentMetrics: any = {};
  private currentNetworks: Array<NMNetwork> = [];
  private restructuredData: NMRestructuredData;
  private numNetworks = 0;
  private numTotalChannels = 0;
  private numUniqueUsers = 0;
  private numChannelsKey = 'num_channels_opened';
  private usersKey = 'nodes';
  private numNetworksKey = 'num_networks';
  private users: Array<string> = [];
  private channelsKey = 'channels';
  private channelSourceKey = 'participant1';
  private channelTargetKey = 'participant2';
  private largestNetworks: Array<NMNetwork> = [];
  private busiestNetworks: Array<NMNetwork> = [];

  public constructor(private http: HttpClient, private nmConfig: NetMetricsConfig) {
  }

  /**
   * Set this.numNetworks with value from new data
   */
  public updateNumNetworks() {
    this.numNetworks = this.currentMetrics[this.numNetworksKey];
  }

  /**
   * Get data from server endpoint, then run setCurrentMetrics()
   */
  public updateCurrentMetrics(): Promise<NMResponse> {
    const that = this;
    return new Promise<NMResponse>((fulfill, reject) => {
      that.http.get<NMAPIResponse>(this.nmConfig.defaultConfig.url)
        .subscribe(
          (result: any) => {
            try {
              that.setCurrentMetrics(result);
            } catch (e) {
              reject({code: 400, body: e});
            }
            fulfill({
              code: 200,
              body: 'Successfully updated '
            });
          },
          (err: any) => {
            reject({
              code: 400,
              body: err
            });
          });
    });
  }

  /**
   * Reset `largestNetworks`, `busiesNetworks` and other properties,
   * then proceeds to update them  with various methods;
   * update `users, numTotalChannels` etc.
   * Called currently only from home.component
   */
  public updateTotalsAndComparativeMetrics() {
    this.largestNetworks = [];
    this.busiestNetworks = [];
    const that = this;
    this.numTotalChannels = 0;
    this.updateNumNetworks();
    Object.keys(this.currentMetrics).map((key: string) => {
      if (!(key === that.numNetworksKey)) {
        const tokenInfo = that.currentMetrics[key];
        that.numTotalChannels += tokenInfo[that.numChannelsKey];
        that.updateUniqueUserArray(tokenInfo);
      }
    });
    this.updateLargestNetworks();
    this.updateBusiestNetworks();
  }

  /**
   * Restructure metric data to fit d3 chart
   * Returns the restructured data and also sets it
   * to the `this.restructuredData` property.
   */
  public restructureAndPersistData(): NMRestructuredData {
    const restructuredData: NMRestructuredData = {nodes: [], links: []};
    Object.keys(this.currentMetrics).map((key: string) => {
      if (!(key === this.numNetworksKey)) {
        const obj = this.currentMetrics[key];
        const objNodes = obj[this.usersKey];
        objNodes.forEach(id => {
          restructuredData.nodes.push({id});
        });
        const objChannels = obj[this.channelsKey];
        for (const channel of objChannels) {
          restructuredData.links.push({
            source: channel[this.channelSourceKey],
            target: channel[this.channelTargetKey],
          });
        }
      }
    });
    this.restructuredData = restructuredData;
    return restructuredData;
  }

  /**
   * Get d3 chart data.
   * Returns the data;
   */
  public retrievePersistedDataForGraph(): NMRestructuredData {
    return this.restructuredData;
  }

  public getNumNetworks(): number {
    return this.numNetworks;
  }

  public getTotalChannels(): number {
    return this.numTotalChannels;
  }

  public getNumUniqueUsers(): number {
    return this.numUniqueUsers;
  }

  public getLargestNetworks(): Array<NMNetwork> {
    return this.largestNetworks;
  }

  public getBusiestNetworks(): Array<NMNetwork> {
    return this.busiestNetworks;
  }

  public getCurrentMetrics() {
    return this.currentMetrics;
  }


  /**
   * Set this.currentMetics from new data, if valid
   * @param newMetrics
   */
  protected setCurrentMetrics(newMetrics: any) {
    const that = this;
    try {
      JSON.parse(JSON.stringify(newMetrics));
    } catch (e) {
      console.error('setCurrentMetrics', e);
      throw new Error(e);
      // return;
    }
    this.currentMetrics = newMetrics;
    // Turn the metrics in to a useful array of networks:
    this.currentNetworks = [];

    Object.keys(this.currentMetrics).map((key: string) => {
      if (!(key === that.numNetworksKey)) {
        const ntw = that.currentMetrics[key];
        const valid = ajv.validate(networkSchema, ntw);

        if (!valid) {
          throw new Error('Malformed API data: \n' + this.ajvErrorsToString(ajv.errors));
        } else {
          that.currentNetworks.push(ntw);
        }
      }
    });
  }

  /**
   * Update this.largestNetworks with new data.
   * Sort by number of nodes.
   */
  protected updateLargestNetworks() {
    // `slice` to return a clone of the array iso pointer to same array:
    this.largestNetworks = this.currentNetworks.slice().sort((a, b) => {
      return b.num_nodes - a.num_nodes;
    });
  }

  /**
   * Update this.busiestNetworks with new data.
   * Sort by number of channels.
   */
  protected updateBusiestNetworks() {
    this.busiestNetworks = this.currentNetworks.slice().sort((a, b) => {
      return b.num_channels_opened - a.num_channels_opened;
    });
  }

  /**
   * Run through users in new data; if new entries,
   * increment user counter `this.numUniqueUsers`.
   * @param tokenInfo
   */
  protected updateUniqueUserArray(tokenInfo: any) {
    const that = this;
    const userArr: Array<string> = tokenInfo[that.usersKey];
    for (const user of userArr) {
      if (!that.users.includes(user)) {
        that.users.push(user);
        that.numUniqueUsers++;
      }
    }
  }

  //noinspection JSMethodCanBeStatic
  /**
   * Returns a readable summary of ajv errors as string
   * @param errors
   */
  private ajvErrorsToString(errors: any): string {
    // Create meaningful string of errors:
    return errors.map(e => {
      return e.dataPath ? `${e.keyword} '${e.dataPath}'; ${e.message}.` : `${e.keyword}; ${e.message}.`;
    }).join('\n');
  }
}
