export interface Link {
  readonly sourceAddress: string;
  readonly targetAddress: string;
  readonly status: string;
  readonly tokenAddress: string;
  readonly capacity: number;
}

export interface Node {
  readonly id: string;
  readonly openChannels: number;
  readonly closedChannels: number;
  readonly settledChannels: number;
  readonly tokenAddress: string;
  readonly tokenName: string;
  readonly tokenSymbol: string;
}

export interface NetworkGraph {
  readonly nodes: Node[];
  readonly links: Link[];
}
