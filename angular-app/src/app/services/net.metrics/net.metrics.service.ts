import { catchError, flatMap, map, reduce, share, skipWhile, switchMap, tap, toArray } from 'rxjs/operators';
import { NetMetricsConfig } from './net.metrics.config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NMAPIResponse } from '../../models/NMAPIResponse';
import { NMChannel, NMNetwork } from '../../models/NMNetwork';
import * as NMNetworkSchema from '../../models/NMNetwork.schema';
import { GraphData, NetworkGraph } from '../../models/NetworkGraph';
import { BehaviorSubject, from, Observable, of, zip } from 'rxjs';
import { Participant, RaidenNetworkMetrics, TokenNetwork } from '../../models/TokenNetwork';
import { Link, Node } from '../d3/models';
import { SharedService } from './shared.service';
import { Message } from './message';

declare let require: any;

const Ajv = require('ajv');

const schema = NMNetworkSchema.schema;
const ajv = new Ajv({allErrors: true});

@Injectable()
export class NetMetricsService {
  private pollingSubject: BehaviorSubject<void> = new BehaviorSubject(null);
  readonly metrics$: Observable<RaidenNetworkMetrics>;
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
        }, 5000);
      }),
      share()
    );
  }

  /**
   * Get data for d3 chart. Sets local `nodes` and `links` values.
   * Uses `netMetricsService.retrievePersistedDataForGraph`.
   */
  public transformGraph(graph: NetworkGraph): GraphData {
    const graphData: GraphData = {
      nodes: [],
      links: []
    };

    const pseudoNodes = graph.nodes;
    const pseudoLinks = graph.links;

    // Instantiate real Node instances iso literal object:
    for (const pseudoNode of pseudoNodes) {
      const node = new Node(pseudoNode['id']);
      node.x = Math.floor(Math.random() * 600) + 100;
      node.y = Math.floor(Math.random() * 600) + 100;
      node.linkCount = pseudoNode['numChannels'];
      graphData.nodes.push(node);
    }

    // Get the real Node instance iso literal object:
    for (const pseudoLink of pseudoLinks) {
      const src = this.getMatchingNode(pseudoLink['source'], graphData.nodes),
        trg = this.getMatchingNode(pseudoLink['target'], graphData.nodes);

      if (src && trg) {
        const link = new Link(src, trg, pseudoLink.status);
        graphData.links.push(link);
      }
    }
    return graphData;
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Return the node matching the provided address
   * @param address
   * @param nodes
   */
  public getMatchingNode(address: string, nodes: Array<Node>) {
    let res: Node;
    for (const node of nodes) {
      if (address === node.id) {
        res = node;
        break;
      }
    }
    return res;
  }

  /**
   * Get data from server endpoint, then run setCurrentMetrics()
   */
  private getMetrics(): Observable<RaidenNetworkMetrics> {
    const metrics = this.http.get<NMAPIResponse>(this.nmConfig.defaultConfig.url).pipe(
      flatMap(value => from(Object.values(value.result))),
      skipWhile(value => typeof value === 'number'),
      share()
    );

    const networkMetrics = metrics.pipe(
      map((value: NMNetwork) => {
        const valid = ajv.validate(schema, value);
        if (!valid) {
          throw new Error(`Malformed API data: ${this.ajvErrorsToString(ajv.errors)}`);
        }
        return this.createTokenNetwork(value);
      }),
      toArray(),
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
      reduce((graph: NetworkGraph, network: NMNetwork) => {
        const networkNodes = network.nodes;

        networkNodes.forEach(id => {
          graph.nodes.push({id});
        });

        const networkChannels = network.channels;

        for (const channel of networkChannels) {
          graph.links.push({
            source: channel.participant1,
            target: channel.participant2,
            status: channel.status
          });
        }
        return graph;
      }, {nodes: [], links: []}),
      map(value => {
        return this.transformGraph(value);
      })
    );

    return zip(networkMetrics, networkGraph)
      .pipe(map(([data, graph]) => {
        return {
          totalTokenNetworks: data.length,
          openChannels: data.map(value1 => value1.openedChannels).reduce((acc, openChannels) => acc + openChannels),
          uniqueUsers: data.map(networks => networks.participants).filter(this.unique).length,
          tokenNetworks: data,
          networkGraph: graph
        };
      }));
  }

  private createTokenNetwork(network: NMNetwork): TokenNetwork {

    const channels = network.channels;

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
          participantDeposit = channel.deposit1;
        } else {
          participantDeposit = channel.deposit2;
        }

        return accumulator + participantDeposit;
      }, 0);
    }).reduce((accumulator, participantsDeposits) => accumulator + participantsDeposits, 0);

    const averagePerParticipant = deposits / channelEntries.length;

    const topParticipants = participants.sort((a, b) => b.channels - a.channels).slice(0, 5);

    const deposit = openedChannels.reduce((accumulator, channel) => accumulator + channel.deposit1 + channel.deposit2, 0);
    const channelAverage = deposit / openedChannels.length;

    const topChannelsByDeposit = openedChannels.sort((a, b) => (b.deposit1 + b.deposit2) - (a.deposit1 + a.deposit2)).slice(0, 5);

    return {
      networkAddress: network.token_address,
      topParticipantsByChannels: topParticipants,
      openedChannels: openedChannels.length,
      closedChannels: closedChannels.length,
      settledChannels: settledChannels.length,
      channelsPerParticipant: channelsPerParticipant,
      participants: uniqueParticipants.length,
      topChannelsByDeposit: topChannelsByDeposit,
      averageDepositPerChannel: channelAverage || 0,
      averageDepositPerParticipant: averagePerParticipant || 0
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
