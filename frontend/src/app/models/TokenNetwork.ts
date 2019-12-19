import { NetworkGraph } from './NetworkGraph';
import { Token } from './NMNetwork';

export interface Channel {
  readonly participant1: string;
  readonly participant2: string;
  readonly deposit1: number;
  readonly deposit2: number;
}

export interface UserAccountStatistics {
  readonly address: string;
  readonly channels: number;
}

export interface UserAccount {
  readonly address: string;
  readonly channels: Channel[];
}

export interface TokenNetwork {
  readonly token: Token;
  readonly graph: NetworkGraph;
  readonly openedChannels: number;
  readonly closedChannels: number;
  readonly settledChannels: number;
  readonly participants: number;
  readonly topChannelsByDeposit: Channel[];
  readonly topParticipantsByChannels: UserAccountStatistics[];
  readonly averageDepositPerChannel: number;
  readonly averageDepositPerParticipant: number;
  readonly averageChannelsPerParticipant: number;
  readonly totalNetworkDeposits: number;
}

export interface RaidenNetworkMetrics {
  readonly totalTokenNetworks: number;
  readonly openChannels: number;
  readonly closedChannels: number;
  readonly settledChannels: number;
  readonly averageChannelsPerParticipant: number;
  readonly topParticipantsByChannels: UserAccountStatistics[];
  readonly uniqueAccounts: number;
  tokenNetworks?: TokenNetwork[];
}
