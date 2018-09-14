import { Node } from './';
import * as d3 from '../../../../../node_modules/d3';

export class Link implements d3.SimulationLinkDatum<Node> {
  source: Node;
  target: Node;
  status: string;

  constructor(source, target, status) {
    this.source = source;
    this.target = target;
    this.status = status;
  }
}
