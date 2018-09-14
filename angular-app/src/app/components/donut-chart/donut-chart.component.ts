import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import { Arc, Pie } from 'd3';

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
export class DonutChartComponent implements OnInit {

  @Input() data: ChannelData[];
  @ViewChild('chart') chart;
  private width: number;
  private height: number;

  private svg: any;     // TODO replace all `any` by the right type

  private arc: Arc<any, ChannelData>;
  private pie: Pie<any, ChannelData>;
  private color: any;

  constructor() {
  }

  ngOnInit() {
    this.initSvg();
    this.drawChart(this.data);
    setTimeout(() => this.drawLegend(), 1000);
  }

  private initSvg() {
    this.pie = d3Shape.pie<ChannelData>()
      .value((d) => d.channels)
      .sort(null)
      .padAngle(.03);

    this.width = 120;
    this.height = 120;

    const outerRadius = this.width / 2;
    const innerRadius = 50;

    this.color = d3Scale.scaleOrdinal()
      .domain(['open', 'closed', 'settled'])
      .range(['#64dd17', '#e65100', '#8e24aa']);

    this.arc = d3Shape.arc<ChannelData>()
      .outerRadius(outerRadius)
      .innerRadius(innerRadius);

    this.svg = d3.select(this.chart.nativeElement)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'shadow')
      .append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`);

  }

  private drawChart(data: ChannelData[]) {
    const arc = this.arc;
    const color = this.color;

    const path = this.svg.selectAll('path')
      .data(this.pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(d.data.status));

    path.transition()
      .duration(1000)
      .attrTween('d', (d) => {
        const interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
        return (t) => arc(interpolate(t));
      });
  }

  private drawLegend() {
    const legendRectSize = 12;
    const legendSpacing = 7;
    const legendHeight = legendRectSize + legendSpacing;
    const legend = this.svg.selectAll('.legend')
      .data(this.color.domain())
      .enter()
      .append('g')
      .classed('legend', true)
      .attr('transform', (d, i) => `translate(-25,${(i * legendHeight) - 28})`);

    legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .attr('rx', 20)
      .attr('ry', 20)
      .style('fill', this.color)
      .style('stroke', this.color);

    legend.append('text')
      .attr('x', 15)
      .attr('y', 10)
      .text(d => d)
      .style('fill', '#fff')
      .style('font-size', '12px');
  }

}
