import { NetworkGraph } from './NetworkGraph';
import { Token } from './NMNetwork';

export interface Channel {
  readonly participant1: string;
  readonly participant2: string;
  readonly deposit1: number;
  readonly deposit2: number;
}

export interface Participant {
  readonly address: string;
  readonly channels: number;
}

export interface TokenNetwork {
  readonly token: Token;
  readonly openedChannels: number;
  readonly closedChannels: number;
  readonly settledChannels: number;
  readonly participants: number;
  readonly channelsPerParticipant: number;
  readonly topChannelsByDeposit: Channel[];
  readonly topParticipantsByChannels: Participant[];
  readonly averageDepositPerChannel: number;
  readonly averageDepositPerParticipant: number;
}

export interface RaidenNetworkMetrics {
  readonly totalTokenNetworks: number;
  readonly openChannels: number;
  readonly uniqueUsers: number;
  readonly tokenNetworks: TokenNetwork[];
  readonly networkGraph: NetworkGraph;
}
