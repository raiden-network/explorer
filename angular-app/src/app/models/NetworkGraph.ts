import { Link, Node } from '../services/d3/models';

export interface NetworkGraph {
  nodes: Array<{ id: string }>;
  links: Array<{
    source: string,
    target: string,
    status: string
  }>;
}

export interface GraphData {
  readonly nodes: Node[];
  readonly links: Link[];
}
