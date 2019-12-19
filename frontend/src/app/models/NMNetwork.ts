export interface NMChannel {
  readonly channel_identifier: number;
  readonly status: string;
  readonly participant1: string;
  readonly participant2: string;
  readonly deposit1: number;
  readonly deposit2: number;
}

export interface NMNode {
  readonly opened: number;
  readonly closed: number;
  readonly settled: number;
}

export interface NMNetwork {
  readonly address: string;
  readonly token: Token;
  readonly num_channels_total: number;
  readonly num_channels_opened: number;
  readonly num_channels_closed: number;
  readonly num_channels_settled: number;
  readonly total_deposits: number;
  readonly avg_deposit_per_channel: number;
  readonly avg_deposit_per_node: number;
  readonly avg_channels_per_node: number;
  readonly channels: NMChannel[];
  readonly nodes: { readonly [address: string]: NMNode };
}

export interface Token {
  readonly address: string;
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
}
