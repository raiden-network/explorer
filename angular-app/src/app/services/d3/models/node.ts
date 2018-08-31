import APP_CONFIG from '../../app.config';
import * as d3 from '../../../../../node_modules/d3';

export class Node implements d3.SimulationNodeDatum {

  x?: number;
  y?: number;
  fx?: number | null = 20;
  fy?: number | null = 20;

  id: string;
  linkCount = 0;


  constructor(id) {
    this.id = id;
  }

  get r() {
    return 50 * this.normal() + 10;
  }

  get color() {
    const index = Math.floor(APP_CONFIG.SPECTRUM.length * this.normal());
    return APP_CONFIG.SPECTRUM[index];
  }

  normal() {
    return Math.sqrt(this.linkCount / APP_CONFIG.N);
  }
}
