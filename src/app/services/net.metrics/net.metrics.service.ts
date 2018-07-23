import { NetMetricsConfig } from './net.metrics.config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SharedService } from './shared.service';
import { NMAPIResponse } from '../../models/NMAPIResponse';
import { NMResponse } from '../../models/NMResponse';
import { NMConfig } from '../../models/NMConfig';
import { NMComparativeMetrics } from '../../models/NMComparativeMetrics';
import {NMRestructuredData} from '../../models/NMRestructuredData';

@Injectable()
export class NetMetricsService {

  private currentMetrics: any = {};
  private numNetworks = 0;
  private numTotalChannels = 0;
  private numUniqueUsers = 0;
  private numChannelsKey = 'num_channels';
  private usersKey = 'nodes';
  private resultKey = 'result';
  private numNetworksKey = 'num_networks';
  private users: Array<string> = [];
  private numUsersKey = 'num_nodes';
  private tokenAddressKey = 'token_address';
  private channelsKey = 'channels';
  private channelSourceKey = 'participant1';
  private channelTargetKey = 'participant2';
  private largestNetworks: Array<NMComparativeMetrics> = [];
  private busiestNetworks: Array<NMComparativeMetrics> = [];
  private numComparativeTuples = 9;
  private restructuredDataEndpoint = 'http://localhost:3000/data';

  public constructor(private http: HttpClient, private nmConfig: NetMetricsConfig, private sharedService: SharedService) {
  }

  // Helpers
  protected setCurrentMetrics(newMetrics: any) {
    try {
      JSON.parse(JSON.stringify(newMetrics));
    } catch (e) {
      return;
    }
    this.currentMetrics = newMetrics;
  }

  protected updateLargestNetworks(tokenInfo: any) {
    const that = this;
    if (that.largestNetworks.length > 0) {
      let lastNet = that.largestNetworks[that.largestNetworks.length - 1];
      that.largestNetworks.push({
        tokenAddress: tokenInfo[that.tokenAddressKey],
        metricValue: tokenInfo[that.numUsersKey],
        secondaryMetricValue: tokenInfo[that.numChannelsKey]
      });
      for (let i = that.largestNetworks.length - 2; i >= 0; i--) {
        lastNet = that.largestNetworks[i];
        if (lastNet.metricValue < tokenInfo[that.numUsersKey]) {
          that.largestNetworks[i] = that.largestNetworks[i + 1];
          that.largestNetworks[i + 1] = lastNet;
        } else {
          break;
        }
      }
      if (that.largestNetworks.length === that.numComparativeTuples + 2) {
        that.largestNetworks.pop();
      }
    } else {
      that.largestNetworks.push({
        tokenAddress: tokenInfo[that.tokenAddressKey],
        metricValue: tokenInfo[that.numUsersKey],
        secondaryMetricValue: tokenInfo[that.numChannelsKey]
      });
    }
  }

  protected updateBusiestNetworks(tokenInfo: any) {
    const that = this;
    if (that.busiestNetworks.length > 0) {
      let lastNet: NMComparativeMetrics = that.busiestNetworks[that.busiestNetworks.length - 1];
      that.busiestNetworks.push({
        tokenAddress: tokenInfo[that.tokenAddressKey],
        metricValue: tokenInfo[that.numChannelsKey],
        secondaryMetricValue: tokenInfo[that.numUsersKey]
      });
      for (let i = that.busiestNetworks.length - 2; i >= 0; i--) {
        lastNet = that.busiestNetworks[i];
        if (lastNet.metricValue < tokenInfo[that.numChannelsKey]) {
          that.busiestNetworks[i] = that.busiestNetworks[i + 1];
          that.busiestNetworks[i + 1] = lastNet;
        } else {
          break;
        }
      }
      if (that.busiestNetworks.length === that.numComparativeTuples + 2) {
        that.busiestNetworks.pop();
      }
    } else {
      that.busiestNetworks.push({
        tokenAddress: tokenInfo[that.tokenAddressKey],
        metricValue: tokenInfo[that.numChannelsKey],
        secondaryMetricValue: tokenInfo[that.numUsersKey]
      });
    }
  }

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

  public updateNumNetworks() {
    this.numNetworks = this.currentMetrics[this.numNetworksKey];
  }

  // Functionality
  public updateCurrentMetrics(): Promise<NMResponse> {
    const that = this;
    return new Promise<NMResponse>((fulfill, reject) => {
      that.http.get<NMAPIResponse>(this.nmConfig.defaultConfig.url)
        .subscribe(
          (result: any) => {
            that.setCurrentMetrics(result[that.resultKey]);
            fulfill({
              code: 200,
              body: 'Successfully updated '
            });
          },
          (err: any) => {
            reject({
              code: 200,
              body: err
            });
          });
    });
  }

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
        that.updateLargestNetworks(tokenInfo);
        that.updateBusiestNetworks(tokenInfo);
      }
    });
  }

  public restructureAndPersistData() {
    return new Promise<NMResponse>((fulfill, reject) => {
      const that = this;
      let numNetworksRecorded = 0;
      const restructuredData: NMRestructuredData = {nodes: [], links: []};
      Object.keys(this.currentMetrics).map((key: string) => {
        if (!(key === that.numNetworksKey)) {
          const obj = that.currentMetrics[key];
          restructuredData.nodes.push({
            node: obj[that.tokenAddressKey],
            address: obj[that.tokenAddressKey],
            weight: Math.floor(Math.random() * 999) + 100,
            numChannels: obj[that.numChannelsKey]
        });
          const objChannels = obj[that.channelsKey];
          for (const channel of objChannels) {
            restructuredData.links.push({
              source: channel[that.channelSourceKey],
              target: channel[that.channelTargetKey],
            });
          }
          numNetworksRecorded++;
          if (numNetworksRecorded === that.currentMetrics[that.numNetworksKey]) {
            that.http.put(that.restructuredDataEndpoint, restructuredData)
              .subscribe((res: any) => {
                fulfill({
                  code: 200,
                  body: res
                });
              },
                (err: any) => {
                reject({
                  code: 400,
                  body: err
                });
                });
          }
        }
      });
    });
  }

  public retrievePersistedDataForGraph() {
    const that = this;
    return new Promise<NMResponse>((fulfill, reject) => {
      that.http.get(that.restructuredDataEndpoint)
        .subscribe
        ((res: any) => {
          fulfill({
            code: 200,
            body: res
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

  // Getters and setters
  public getConfig(): NMConfig {
    return this.nmConfig.defaultConfig;
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

  public getUniqueUsers(): Array<string> {
    return this.users;
  }

  public setNumComparativeTuples(num: number) {
    this.numComparativeTuples = num;
  }

  public getLargestNetworks(): Array<NMComparativeMetrics> {
    return this.largestNetworks;
  }

  public getBusiestNetworks(): Array<NMComparativeMetrics> {
    return this.busiestNetworks;
  }

  public getCurrentMetrics() {
    return this.currentMetrics;
  }
}
