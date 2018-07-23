import APP_CONFIG from '../../app.config';
import * as d3 from '../../../../../node_modules/d3';

export class Node implements d3.SimulationNodeDatum {

  index?: number;
  x?: number;
  y?: number;
  vx?: number = 20;
  vy?: number = 20;
  fx?: number | null = 20;
  fy?: number | null = 20;

  id: string;
  linkCount: number = 0;

  constructor(id) {
    this.id = id;
  }

  normal = () => {
    return Math.sqrt(this.linkCount / APP_CONFIG.N);
  }

  get r() {
    return 50 * this.normal() + 10;
  }

  get fontSize() {
    return (30 * this.normal() + 10) + 'px';
  }

  get color() {
    let index = Math.floor(APP_CONFIG.SPECTRUM.length * this.normal());
    return APP_CONFIG.SPECTRUM[index];
  }
}
