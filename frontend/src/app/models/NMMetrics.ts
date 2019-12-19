import { UserAccountStatistics } from './TokenNetwork';

export interface NMMetrics {
  readonly num_token_networks: number;
  readonly num_channels_opened: number;
  readonly num_channels_closed: number;
  readonly num_channels_settled: number;
  readonly num_nodes_with_open_channels: number;
  readonly avg_channels_per_node: number;
  readonly top_nodes_by_channels: UserAccountStatistics[];
}
