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
  readonly graph: NetworkGraph;
  readonly openedChannels: number;
  readonly closedChannels: number;
  readonly settledChannels: number;
  readonly participants: number;
  readonly channelsPerParticipant: number;
  readonly topChannelsByDeposit: Channel[];
  readonly topParticipantsByChannels: Participant[];
  readonly averageDepositPerChannel: number;
  readonly averageDepositPerParticipant: number;
  readonly totalNetworkDeposits: number;
  uniqueParticipants?: string[];
}

export interface RaidenNetworkMetrics {
  readonly totalTokenNetworks: number;
  readonly openChannels: number;
  readonly uniqueAccounts: number;
  readonly tokenNetworks: TokenNetwork[];
}
