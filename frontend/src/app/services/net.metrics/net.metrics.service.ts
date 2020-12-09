import {
  catchError,
  delay,
  map,
  retryWhen,
  share,
  shareReplay,
  switchMap,
  take
} from 'rxjs/operators';
import { NetMetricsConfig } from './net.metrics.config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NMAPIResponse } from '../../models/NMAPIResponse';
import { NMNetwork } from '../../models/NMNetwork';
import * as NMMetricsSchema from '../../models/NMMetrics.schema';
import * as NMNetworkSchema from '../../models/NMNetwork.schema';
import { NetworkGraph } from '../../models/NetworkGraph';
import { Observable, of, timer } from 'rxjs';
import {
  RaidenNetworkMetrics,
  TokenNetwork,
  UserAccountStatistics,
  Channel
} from '../../models/TokenNetwork';
import { SharedService } from './shared.service';
import { Message } from './message';
import { TokenUtils } from '../../utils/token.utils';
import { NMMetrics } from 'src/app/models/NMMetrics';
import * as Ajv from 'ajv';

const metricsSchema = NMMetricsSchema.schema;
const networkSchema = NMNetworkSchema.schema;
const ajv = new Ajv({ allErrors: true });

@Injectable()
export class NetMetricsService {
  readonly metrics$: Observable<RaidenNetworkMetrics>;

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
    const networkMetrics = this.http
      .get<NMAPIResponse>(this.nmConfig.configuration.backend_url)
      .pipe(
        retryWhen(errors => errors.pipe(delay(this.nmConfig.configuration.poll_interval), take(3))),
        share()
      );

    return networkMetrics.pipe(
      map((response: NMAPIResponse) => {
        const metricsResponse = response.overall_metrics;
        this.validateData(metricsSchema, metricsResponse);
        const metrics = this.createOverallMetrics(metricsResponse);

        metrics.tokenNetworks = response.networks
          .map(network => {
            this.validateData(networkSchema, network);
            return this.createTokenNetwork(network);
          })
          .sort((a, b) => b.openedChannels - a.openedChannels);

        return metrics;
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
  }

  private createOverallMetrics(data: NMMetrics): RaidenNetworkMetrics {
    return {
      totalTokenNetworks: data.num_token_networks,
      openChannels: data.num_channels_opened,
      closedChannels: data.num_channels_closed,
      settledChannels: data.num_channels_settled,
      averageChannelsPerParticipant: data.avg_channels_per_node,
      topParticipantsByChannels: data.top_nodes_by_channels.reverse(),
      uniqueAccounts: data.num_nodes_with_open_channels
    };
  }

  private createNetworkGraph(network: NMNetwork): NetworkGraph {
    const graph: NetworkGraph = { nodes: [], links: [] };
    const token = network.token;

    for (const [address, properties] of Object.entries(network.nodes)) {
      graph.nodes.push({
        id: address,
        online: properties.online,
        openChannels: properties.opened,
        closedChannels: properties.closed,
        settledChannels: properties.settled,
        token: token
      });
    }

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

    const decimals = network.token.decimals;

    const topChannelsByDeposit: Channel[] = network.channels
      .filter(value => value.status === 'opened')
      .sort((a, b) => {
        const bDeposit1 = TokenUtils.toDecimal(b.deposit1, decimals);
        const bDeposit2 = TokenUtils.toDecimal(b.deposit2, decimals);
        const aDeposit1 = TokenUtils.toDecimal(a.deposit1, decimals);
        const aDeposit2 = TokenUtils.toDecimal(a.deposit2, decimals);
        return bDeposit1 + bDeposit2 - (aDeposit1 + aDeposit2);
      })
      .slice(0, 5)
      .filter(value => value.deposit1 + value.deposit2 > 0)
      .map(value =>
        Object.assign({}, value, {
          deposit1: TokenUtils.toDecimal(value.deposit1, decimals),
          deposit2: TokenUtils.toDecimal(value.deposit2, decimals)
        })
      );

    const accountsWithOpenChannels: UserAccountStatistics[] = Object.entries(network.nodes)
      .filter(([address, channels]) => channels.opened > 0)
      .map(([address, channels]) => {
        return { address: address, channels: channels.opened };
      });

    const topParticipants = accountsWithOpenChannels
      .sort((a, b) => b.channels - a.channels)
      .slice(0, 5);

    return {
      token: network.token,
      graph: graph,
      openedChannels: network.num_channels_opened,
      closedChannels: network.num_channels_closed,
      settledChannels: network.num_channels_settled,
      participants: accountsWithOpenChannels.length,
      topChannelsByDeposit: topChannelsByDeposit,
      topParticipantsByChannels: topParticipants,
      averageDepositPerChannel: TokenUtils.toDecimal(network.avg_deposit_per_channel, decimals),
      averageDepositPerParticipant: TokenUtils.toDecimal(network.avg_deposit_per_node, decimals),
      averageChannelsPerParticipant: network.avg_channels_per_node,
      totalNetworkDeposits: TokenUtils.toDecimal(network.total_deposits, decimals)
    };
  }

  private validateData(schema: any, data: any) {
    if (!ajv.validate(schema, data)) {
      const errMessage = `Malformed API data: ${this.ajvErrorsToString(ajv.errors)}`;
      console.error(errMessage);
      throw new Error(errMessage);
    }
  }

  //noinspection JSMethodCanBeStatic
  /**
   * Returns a readable summary of ajv errors as string
   * @param errors
   */
  private ajvErrorsToString(errors: any): string {
    // Create meaningful string of errors:
    return errors
      .map(e => {
        return e.dataPath
          ? `${e.keyword} '${e.dataPath}'; ${e.message}.`
          : `${e.keyword}; ${e.message}.`;
      })
      .join('\n');
  }
}
