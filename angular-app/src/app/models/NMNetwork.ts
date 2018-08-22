export interface NMNetwork {
  token_address: string;
  num_channels: number;
  num_nodes: number;
  nodes: Array<string>;
  channels: Array<{
    channel_identifier: string,
    participant1: string,
    participant2: string,
    deposit1: number,
    deposit2: number,
    capacity1: number,
    capacity2: number
  }>;
}
