import { catchError, map, share, switchMap, tap } from 'rxjs/operators';
import { NetMetricsConfig } from './net.metrics.config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NMAPIResponse } from '../../models/NMAPIResponse';
import { NMChannel, NMNetwork } from '../../models/NMNetwork';
import * as NMNetworkSchema from '../../models/NMNetwork.schema';
import { NetworkGraph } from '../../models/NetworkGraph';
import { BehaviorSubject, Observable, of, zip } from 'rxjs';
import { Participant, RaidenNetworkMetrics, TokenNetwork } from '../../models/TokenNetwork';
import { SharedService } from './shared.service';
import { Message } from './message';

declare let require: any;

const Ajv = require('ajv');

const schema = NMNetworkSchema.schema;
const ajv = new Ajv({allErrors: true});

@Injectable()
export class NetMetricsService {
  readonly metrics$: Observable<RaidenNetworkMetrics>;
  private pollingSubject: BehaviorSubject<void> = new BehaviorSubject(null);

  private static toDecimal(amount: number, decimals: number) {
    return amount / (10 ** decimals);
  }

  private unique = function (value, index, self) {
    return self.indexOf(value) === index;
  };

  public constructor(
    private http: HttpClient,
    private nmConfig: NetMetricsConfig,
    private sharedService: SharedService
  ) {
    let timeout: number;

    this.metrics$ = this.pollingSubject.pipe(
      tap(() => clearTimeout(timeout)),
      switchMap(() => this.getMetrics()),
      tap(() => {
        timeout = setTimeout(() => {
          this.pollingSubject.next(null);
        }, this.nmConfig.configuration.poll_interval);
      }),
      share()
    );
  }

  private _nonScenarionTokens = value => !value.token.name.toLocaleLowerCase().startsWith('scenario test token');

  /**
   * Get data from server endpoint, then run setCurrentMetrics()
   */
  private getMetrics(): Observable<RaidenNetworkMetrics> {
    const metrics = this.http.get<NMAPIResponse>(this.nmConfig.configuration.backend_url).pipe(
      map(value => value.result),
      share()
    );

    const networkMetrics: Observable<TokenNetwork[]> = metrics.pipe(
      map((networks: NMNetwork[]) => {
        return networks.filter(this._nonScenarionTokens).map(network => {
          const valid = ajv.validate(schema, network);
          if (!valid) {
            throw new Error(`Malformed API data: ${this.ajvErrorsToString(ajv.errors)}`);
          }
          return this.createTokenNetwork(network);
        });
      }),
      catchError(err => {
        let message: Message;
        if (err.name === 'HttpErrorResponse') {
          message = {
            title: 'Network error',
            description: 'Communication with the metrics server could not be established.'
          };
        } else {
          message = {
            title: err.name,
            description: err.message
          };
        }
        this.sharedService.post(message);
        return of(err.message);
      })
    );

    const networkGraph = metrics.pipe(
      map((networks: NMNetwork[]) => {
        return networks.filter(this._nonScenarionTokens).map(network => this.createNetworkGraph(network))
          .reduce((acc: NetworkGraph, value: NetworkGraph) => {
            acc.nodes.push(...value.nodes);
            acc.links.push(...value.links);
            return acc;
          }, {nodes: [], links: []});
      })
    );

    return zip(networkMetrics, networkGraph)
      .pipe(map(([data, graph]) => {
        const uniqueUsers = data.map(value => value.uniqueParticipants)
          .reduce((acc: string[], users: string[]) => {
            acc.push(...users);
            return acc;
          }, [])
          .filter(this.unique);

        const totalOpenChannels = data.map(value1 => value1.openedChannels)
          .reduce((acc, openChannels) => acc + openChannels);

        const raidenMetrics: RaidenNetworkMetrics = {
          totalTokenNetworks: data.length,
          openChannels: totalOpenChannels,
          uniqueUsers: uniqueUsers.length,
          tokenNetworks: data.sort((a, b) => b.openedChannels - a.openedChannels),
          networkGraph: graph
        };

        data.forEach(value => {
          value.uniqueParticipants = undefined;
        });

        return raidenMetrics;
      }));
  }

  private createNetworkGraph(network: NMNetwork) {
    const graph: NetworkGraph = {nodes: [], links: []};
    const getChannels = (id: string, status: string) => network.channels.filter((value: NMChannel) => {
      return (value.participant1 === id || value.participant2 === id) && value.status === status;
    });

    network.nodes.forEach(id => {

      const openChannels = getChannels(id, 'opened').length;
      const closedChannels = getChannels(id, 'closed').length;
      const settledChannels = getChannels(id, 'settled').length;
      graph.nodes.push({
        id,
        openChannels,
        closedChannels,
        settledChannels,
        tokenAddress: network.token.address
      });
    });

    for (const channel of network.channels) {
      graph.links.push({
        sourceAddress: channel.participant1,
        targetAddress: channel.participant2,
        status: channel.status,
        tokenAddress: network.token.address
      });
    }
    return graph;
  }

  private createTokenNetwork(network: NMNetwork): TokenNetwork {

    const channels = network.channels;
    const decimals = network.token.decimals;

    const openedChannels = channels.filter(value => value.status === 'opened');
    const closedChannels = channels.filter(value => value.status === 'closed');
    const settledChannels = channels.filter(value => value.status === 'settled');

    const uniqueParticipants = channels.map(value => [value.participant1, value.participant2])
      .reduceRight((previousValue, currentValue) => previousValue.concat(currentValue), [])
      .filter(this.unique);

    const channelsByPart: { [participant: string]: NMChannel[] } = openedChannels.reduce((channelsPerPart, channel) => {
      const participantChannels = (participant: string) => {
        let element: NMChannel[] | null = channelsPerPart[participant];
        if (!element) {
          element = [];
          channelsPerPart[participant] = element;
        }
        return element;
      };

      participantChannels(channel.participant1).push(channel);
      participantChannels(channel.participant2).push(channel);
      return channelsPerPart;
    }, {});

    const channelEntries = Object.entries(channelsByPart);

    const participants: Participant[] = channelEntries.map(value => {
      return {
        address: value[0],
        channels: value[1].length
      };
    });

    const channelsPerParticipant = channels.length / uniqueParticipants.length || 0;

    const deposits = channelEntries.map(value => {
      const address = value[0];
      const participantChannels = value[1];
      return participantChannels.reduce((accumulator, channel) => {
        let participantDeposit: number;

        if (address === channel.participant1) {
          participantDeposit = NetMetricsService.toDecimal(channel.deposit1, decimals);
        } else {
          participantDeposit = NetMetricsService.toDecimal(channel.deposit2, decimals);
        }

        return accumulator + participantDeposit;
      }, 0);
    }).reduce((accumulator, participantsDeposits) => accumulator + participantsDeposits, 0);

    const averagePerParticipant = deposits / channelEntries.length;

    const topParticipants = participants.sort((a, b) => b.channels - a.channels).slice(0, 5);

    const deposit = openedChannels.reduce((accumulator, channel) => {
      const deposit1 = NetMetricsService.toDecimal(channel.deposit1, decimals);
      const deposit2 = NetMetricsService.toDecimal(channel.deposit2, decimals);
      return accumulator + deposit1 + deposit2;
    }, 0);
    const channelAverage = deposit / openedChannels.length;

    const topChannelsByDeposit = openedChannels.sort((a, b) => {
      const bDeposit1 = NetMetricsService.toDecimal(b.deposit1, decimals);
      const bDeposit2 = NetMetricsService.toDecimal(b.deposit2, decimals);
      const aDeposit1 = NetMetricsService.toDecimal(a.deposit1, decimals);
      const aDeposit2 = NetMetricsService.toDecimal(a.deposit2, decimals);
      return (bDeposit1 + bDeposit2) - (aDeposit1 + aDeposit2);
    }).slice(0, 5).map(value => Object.assign(value, {
      deposit1: NetMetricsService.toDecimal(value.deposit1, decimals),
      deposit2: NetMetricsService.toDecimal(value.deposit2, decimals)
    }));

    return {
      token: network.token,
      topParticipantsByChannels: topParticipants,
      openedChannels: openedChannels.length,
      closedChannels: closedChannels.length,
      settledChannels: settledChannels.length,
      channelsPerParticipant: channelsPerParticipant,
      participants: uniqueParticipants.length,
      topChannelsByDeposit: topChannelsByDeposit,
      averageDepositPerChannel: channelAverage || 0,
      averageDepositPerParticipant: averagePerParticipant || 0,
      uniqueParticipants: uniqueParticipants
    };
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
