import { Token } from './NMNetwork';

export interface Link {
  readonly sourceAddress: string;
  readonly targetAddress: string;
  readonly status: string;
  readonly tokenAddress: string;
  readonly capacity: number;
}

export class Node {
  readonly id: string;
  readonly openChannels: number;
  readonly closedChannels: number;
  readonly settledChannels: number;
  readonly token: Token;
}

export interface NetworkGraph {
  readonly nodes: Node[];
  readonly links: Link[];
}
