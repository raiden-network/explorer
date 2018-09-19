export interface NMChannel {
  readonly channel_identifier: string;
  readonly status: string;
  readonly participant1: string;
  readonly participant2: string;
  readonly deposit1: number;
  readonly deposit2: number;
}

export interface NMNetwork {
  readonly token: Token;
  readonly num_channels_total: number;
  readonly num_channels_opened: number;
  readonly num_channels_closed: number;
  readonly num_channels_settled: number;
  readonly num_nodes: number;
  readonly nodes: Array<string>;
  readonly channels: NMChannel[];
}

export interface Token {
  readonly address: string;
  readonly decimals: number;
  readonly name: string;
  readonly symbol: string;
}
