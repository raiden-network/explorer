import { Link, Node } from './NetworkGraph';

export class NodeInfo {
  constructor(readonly node: Node, readonly links: Link[]) {
  }
}
