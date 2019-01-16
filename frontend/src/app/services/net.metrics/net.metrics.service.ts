import { catchError, delay, map, retryWhen, share, shareReplay, switchMap, take } from 'rxjs/operators';
import { NetMetricsConfig } from './net.metrics.config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NMAPIResponse } from '../../models/NMAPIResponse';
import { NMChannel, NMNetwork } from '../../models/NMNetwork';
import * as NMNetworkSchema from '../../models/NMNetwork.schema';
import { NetworkGraph } from '../../models/NetworkGraph';
import { Observable, of, timer } from 'rxjs';
import { RaidenNetworkMetrics, TokenNetwork, UserAccount, UserAccountStatistics } from '../../models/TokenNetwork';
import { SharedService } from './shared.service';
import { Message } from './message';
import { TokenUtils } from '../../utils/token.utils';

declare let require: any;

const Ajv = require('ajv');

const schema = NMNetworkSchema.schema;
const ajv = new Ajv({allErrors: true});

@Injectable()
export class NetMetricsService {
  readonly metrics$: Observable<RaidenNetworkMetrics>;
  private unique = function (value, index, self) {
    return self.indexOf(value) === index;
  };

  public constructor(
    private http: HttpClient,
    private nmConfig: NetMetricsConfig,
    private sharedService: SharedService
  ) {
    const timer$ = timer(0, this.nmConfig.configuration.poll_interval);

    this.metrics$ = timer$.pipe(
      switchMap(() => this.getMetrics()),
      shareReplay(1)
    );
  }

  /**
   * Get data from server endpoint, then run setCurrentMetrics()
   */
  private getMetrics(): Observable<RaidenNetworkMetrics> {
    const metrics = this.http.get<NMAPIResponse>(this.nmConfig.configuration.backend_url)
      .pipe(
        map(value => value.result),
        retryWhen(errors => errors.pipe(
          delay(this.nmConfig.configuration.poll_interval),
          take(3)
          )
        ),
        share()
      );

    const networkMetrics: Observable<TokenNetwork[]> = metrics.pipe(
      map((networks: NMNetwork[]) => {
        return networks.map(network => {
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

    return networkMetrics.pipe(map((data) => {
      const uniqueAccounts = data.map(value => value.uniqueAccounts)
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
        uniqueAccounts: uniqueAccounts.length,
        tokenNetworks: data.sort((a, b) => b.openedChannels - a.openedChannels)
      };

      data.forEach(value => {
        value.uniqueAccounts = undefined;
      });

      return raidenMetrics;
    }));
  }

  private createNetworkGraph(network: NMNetwork): NetworkGraph {
    const graph: NetworkGraph = {nodes: [], links: []};
    const getChannels = (id: string, status: string) => network.channels.filter((value: NMChannel) => {
      return (value.participant1 === id || value.participant2 === id) && value.status === status;
    });

    const token = network.token;

    network.nodes.forEach(id => {

      const openChannels = getChannels(id, 'opened').length;
      const closedChannels = getChannels(id, 'closed').length;
      const settledChannels = getChannels(id, 'settled').length;

      graph.nodes.push({
        id,
        openChannels,
        closedChannels,
        settledChannels,
        token: token
      });
    });

    for (const channel of network.channels) {
      let capacity = channel.deposit1 + channel.deposit2;
      capacity = TokenUtils.toDecimal(capacity, token.decimals);

      graph.links.push({
        sourceAddress: channel.participant1,
        targetAddress: channel.participant2,
        status: channel.status,
        tokenAddress: token.address,
        capacity: capacity
      });
    }
    return graph;
  }

  private createTokenNetwork(network: NMNetwork): TokenNetwork {
    const graph = this.createNetworkGraph(network);

    const channels = network.channels;
    const decimals = network.token.decimals;

    const openedChannels = channels.filter(value => value.status === 'opened');
    const closedChannels = channels.filter(value => value.status === 'closed');
    const settledChannels = channels.filter(value => value.status === 'settled');

    const uniqueAccounts = openedChannels.map(value => [value.participant1, value.participant2])
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

    const participants: UserAccountStatistics[] = channelEntries.map(value => {
      return {
        address: value[0],
        channels: value[1].length
      };
    });

    const accountsWithOpenChannels = this.accountsWithOpenChannels(channelEntries);
    const channelsPerAccount = this.calculateChannelsPerAccount(accountsWithOpenChannels);
    const averagePerParticipant = this.calculateAverageDepositPerParticipant(accountsWithOpenChannels, decimals);

    const topParticipants = participants.sort((a, b) => b.channels - a.channels).slice(0, 5);

    const deposit = openedChannels.reduce((accumulator, channel) => {
      const deposit1 = TokenUtils.toDecimal(channel.deposit1, decimals);
      const deposit2 = TokenUtils.toDecimal(channel.deposit2, decimals);
      return accumulator + deposit1 + deposit2;
    }, 0);
    const channelAverage = deposit / openedChannels.length;

    const totalNetworkDeposits = openedChannels.map(value => value.deposit1 + value.deposit2)
      .reduce((accumulator, channelDeposit) => accumulator + channelDeposit, 0);

    const topChannelsByDeposit = openedChannels.sort((a, b) => {
      const bDeposit1 = TokenUtils.toDecimal(b.deposit1, decimals);
      const bDeposit2 = TokenUtils.toDecimal(b.deposit2, decimals);
      const aDeposit1 = TokenUtils.toDecimal(a.deposit1, decimals);
      const aDeposit2 = TokenUtils.toDecimal(a.deposit2, decimals);
      return (bDeposit1 + bDeposit2) - (aDeposit1 + aDeposit2);
    }).filter(value => (value.deposit1 + value.deposit2) > 0)
      .slice(0, 5)
      .map(value => Object.assign(value, {
        deposit1: TokenUtils.toDecimal(value.deposit1, decimals),
        deposit2: TokenUtils.toDecimal(value.deposit2, decimals)
      }));

    return {
      token: network.token,
      graph: graph,
      topParticipantsByChannels: topParticipants,
      openedChannels: openedChannels.length,
      closedChannels: closedChannels.length,
      settledChannels: settledChannels.length,
      channelsPerAccount: channelsPerAccount,
      participants: uniqueAccounts.length,
      topChannelsByDeposit: topChannelsByDeposit,
      averageDepositPerChannel: channelAverage || 0,
      averageDepositPerParticipant: averagePerParticipant || 0,
      uniqueAccounts: uniqueAccounts,
      totalNetworkDeposits: TokenUtils.toDecimal(totalNetworkDeposits, decimals)
    };
  }

  // noinspection JSMethodCanBeStatic
  private calculateChannelsPerAccount(accountsWithOpenChannels: UserAccount[]) {
    const openChannels = accountsWithOpenChannels.reduce((acc, userAccount) => acc + userAccount.channels.length, 0);
    return openChannels / accountsWithOpenChannels.length;
  }

  private calculateAverageDepositPerParticipant(accountsWithOpenChannels: UserAccount[], decimals: number) {
    const participants = accountsWithOpenChannels.reduce((acc, account) => acc + account.channels.length, 0);

    const deposits = accountsWithOpenChannels.map(value => {
      const address = value.address;
      const accountChannels = value.channels;
      return accountChannels.reduce((accumulator, channel) => {
        let participantDeposit: number;

        if (address === channel.participant1) {
          participantDeposit = TokenUtils.toDecimal(channel.deposit1, decimals);
        } else {
          participantDeposit = TokenUtils.toDecimal(channel.deposit2, decimals);
        }

        return accumulator + participantDeposit;
      }, 0);
    }).reduce((accumulator, participantsDeposits) => accumulator + participantsDeposits, 0);

    return deposits / participants;
  }

  private accountsWithOpenChannels(channelEntries) {
    return channelEntries.map((entry) => ({
      address: entry[0],
      channels: entry[1].filter(channel => channel.status === 'opened')
    }) as UserAccount).filter(userAccount => userAccount.channels.length > 0);
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
