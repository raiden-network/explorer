import { Node } from './';
import * as d3 from '../../../../../node_modules/d3';

export class Link implements d3.SimulationLinkDatum<Node> {
  index?: number;

  source: Node | string | number;
  target: Node | string | number;

  constructor(source, target) {
    this.source = source;
    this.target = target;
  }
}
