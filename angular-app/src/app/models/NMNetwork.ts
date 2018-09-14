export interface NMChannel {
  channel_identifier: string;
  status: string;
  participant1: string;
  participant2: string;
  deposit1: number;
  deposit2: number;
}

export interface NMNetwork {
  token_address: string;
  num_channels_total: number;
  num_channels_opened: number;
  num_channels_closed: number;
  num_channels_settled: number;
  num_nodes: number;
  nodes: Array<string>;
  channels: NMChannel[];
}
