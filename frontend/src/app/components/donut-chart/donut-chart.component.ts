import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChange,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

import * as d3 from 'd3';
import { Arc, Pie } from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as deepEqual from 'deep-equal';

export interface ChannelData {
  readonly status: string;
  readonly channels: number;
}

@Component({
  selector: 'app-donut-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './donut-chart.component.html',
  styleUrls: ['./donut-chart.component.css']
})
export class DonutChartComponent implements OnInit, OnChanges {
  @Input() data: ChannelData[];
  @Input() legend = true;
  @Input() size = 120;
  @ViewChild('chart', { static: true }) chart;

  private svg: any; // TODO replace all `any` by the right type

  private arc: Arc<any, ChannelData>;
  private pie: Pie<any, ChannelData>;
  private color: any;

  constructor() {}

  ngOnInit() {
    this.initSvg();
    this.drawChart(this.data);
    if (this.legend) {
      setTimeout(() => this.drawLegend(), 1);
    }
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    if (!changes.hasOwnProperty('data')) {
      return;
    }

    const change = changes['data'];

    if (change.isFirstChange()) {
      return;
    }

    if (deepEqual(change.previousValue, change.currentValue)) {
      return;
    }
    this.svg
      .selectAll('path')
      .remove()
      .exit();
    this.drawChart(change.currentValue);
  }

  private initSvg() {
    this.pie = d3Shape
      .pie<ChannelData>()
      .value(d => d.channels)
      .sort(null)
      .padAngle(0.04);

    const outerRadius = this.size / 2;
    const innerRadius = this.size * 0.4;

    this.color = d3Scale
      .scaleOrdinal()
      .domain(['opened', 'closed', 'settled'])
      .range(['#2ec7e5', '#bedceb', '#0a6e87']);

    this.arc = d3Shape
      .arc<ChannelData>()
      .outerRadius(outerRadius)
      .innerRadius(innerRadius);

    this.svg = d3
      .select(this.chart.nativeElement)
      .append('svg')
      .attr('width', this.size)
      .attr('height', this.size)
      .attr('class', 'shadow')
      .append('g')
      .attr('transform', `translate(${this.size / 2},${this.size / 2})`);
  }

  private drawChart(data: ChannelData[]) {
    const arc = this.arc;
    const color = this.color;

    const path = this.svg
      .selectAll('path')
      .data(this.pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(d.data.status));

    path
      .transition()
      .duration(800)
      .attrTween('d', d => {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return t => arc(interpolate(t));
      });
  }

  private drawLegend() {
    const legendSpacing = 15;
    const legendHeight = 1 + legendSpacing;
    const legend = this.svg
      .selectAll('.legend')
      .data(this.color.domain())
      .enter()
      .append('g')
      .classed('legend', true)
      .attr('transform', (d, i) => `translate(-25,${i * legendHeight - 18})`);

    legend
      .append('rect')
      .attr('width', 10)
      .attr('height', 1)
      .style('fill', this.color)
      .style('stroke', this.color);

    legend
      .append('text')
      .attr('x', 18)
      .attr('y', 5)
      .text((d: string) => {
        if (d.startsWith('op')) {
          d = d.replace('ed', '');
        }
        return d.charAt(0).toUpperCase() + d.slice(1);
      })
      .style('fill', '#676767')
      .style('font-size', '10px');
  }
}
