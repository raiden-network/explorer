import { Component, Input, OnChanges, OnInit, SimpleChange, ViewChild } from '@angular/core';
import { Link, NetworkGraph, Node } from '../../models/NetworkGraph';
import * as d3 from 'd3';
import { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3';
import * as d3Scale from 'd3-scale';
import * as deepEqual from 'deep-equal';

interface SimulationNode extends SimulationNodeDatum, Node {
}

interface SimulationLink extends SimulationLinkDatum<SimulationNode>, Link {
}

@Component({
  selector: 'app-network-graph',
  templateUrl: './network-graph.component.html',
  styleUrls: ['./network-graph.component.css']
})
export class NetworkGraphComponent implements OnInit, OnChanges {

  @Input() data: NetworkGraph;
  @ViewChild('graph') graph;
  private width: number;
  private height: number;

  private svg: d3.Selection<any, NetworkGraph, any, any>;
  private link: any;
  private node: any;

  private color: d3.ScaleOrdinal<string, any>;

  private simulation: Simulation<SimulationNode, SimulationLink>;

  private circleSize: (value: number) => number;
  private initialized = false;

  private graphData: { nodes: SimulationNode[], links: SimulationLink[] } = {nodes: [], links: []};

  constructor() {
  }

  private static nodeCompare() {
    return (datum: Node) => `${datum.id}-${datum.tokenAddress}`;
  }

  private static linkCompare() {
    return (datum: Link) => `${datum.sourceAddress}-${datum.targetAddress}-${datum.tokenAddress}`;
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

    this.prepareGraphData();
    this.updateGraph();
  }

  ngOnInit() {
    this.prepareGraphData();
    this.initSvg();
    this.updateGraph();
    this.drawLegend();
  }

  private prepareGraphData() {
    this.graphData.nodes = [];
    this.graphData.links = [];

    this.data.nodes.forEach(value => {
      const node: SimulationNode = {
        id: value.id,
        openChannels: value.openChannels,
        tokenAddress: value.tokenAddress
      };

      this.graphData.nodes.push(node);
    });

    this.data.links.forEach(value => {
      const matchSource = simNode => simNode.id === value.sourceAddress && simNode.tokenAddress === value.tokenAddress;
      const matchTarget = simNode => simNode.id === value.targetAddress && simNode.tokenAddress === value.tokenAddress;

      const link: SimulationLink = {
        source: this.graphData.nodes.find(matchSource),
        target: this.graphData.nodes.find(matchTarget),
        sourceAddress: value.sourceAddress,
        targetAddress: value.targetAddress,
        status: value.status,
        tokenAddress: value.tokenAddress,
      };

      this.graphData.links.push(link);
    });
  }


  private updateGraph() {
    this.updateCircleCalculation();
    this.drawGraph();
    this.initialized = true;
  }

  private updateCircleCalculation() {
    const nodes = this.graphData.nodes;
    nodes.sort((a, b) => a.openChannels - b.openChannels);
    const oldRange = (nodes[nodes.length - 1].openChannels - 1);
    this.circleSize = (value: number) => (((value - 1) * 3) / oldRange) + 5;
  }

  private initSvg() {
    this.width = 960;
    this.height = 800;
    this.svg = d3.select<SVGElement, NetworkGraph>(this.graph.nativeElement)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);


    this.link = this.svg.append('g')
      .attr('class', 'links')
      .attr('stroke-width', '2')
      .attr('stroke-opacity', 0.6)
      .selectAll('.link');

    this.node = this.svg.append('g')
      .attr('class', 'nodes')
      .attr('fill', '#1A237E')
      .attr('stroke-width', '1')
      .attr('stroke', '#fff')
      .selectAll('.node');

    this.color = d3Scale.scaleOrdinal()
      .domain(['opened', 'closed', 'settled'])
      .range(['#089000', '#E50000', '#8e24aa']);

  }

  private drawGraph() {
    this.simulation = d3.forceSimulation<SimulationNode, SimulationLink>()
      .force('link', d3.forceLink().id((node1: SimulationNode) => node1.id + node1.tokenAddress))
      .force('charge', d3.forceManyBody().distanceMax(180))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .stop();

    const links = this.link.data(this.graphData.links, NetworkGraphComponent.linkCompare());

    this.svg.selectAll('.link').remove().exit();

    const link = links
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', datum => this.color(datum.status))
      .merge(links);

    const nodes = this.node.data(this.graphData.nodes, NetworkGraphComponent.nodeCompare());

    this.svg.selectAll('.node').remove().exit();

    const node = nodes
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('r', datum => this.circleSize(datum.openChannels))
      .call(d3.drag<any, any, any>()
        .on('start', datum => this.dragstarted(datum, this.simulation))
        .on('drag', this.dragged)
        .on('end', datum => this.dragended(datum, this.simulation)))
      .merge(nodes);

    node.append('title').text(d => d.id);


    this.simulation.nodes(this.graphData.nodes).on('tick', ticked);

    // @ts-ignore
    this.simulation.force('link').links(this.graphData.links);

    if (this.initialized) {
      for (let i = 0; i < 300; ++i) {
        this.simulation.tick();
      }
      ticked();
    } else {
      this.simulation.alpha(1).restart();
      this.initialized = true;
    }

    function ticked() {
      link
        .attr('x1', d => (d.source as SimulationNode).x)
        .attr('y1', d => (d.source as SimulationNode).y)
        .attr('x2', d => (d.target as SimulationNode).x)
        .attr('y2', d => (d.target as SimulationNode).y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    }
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
      .attr('transform', (d, i) => `translate(${this.width - 100},${this.height - (i * legendHeight) - 28})`);

    legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize / 5)
      .style('fill', this.color)
      .style('stroke', this.color);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 5)
      .text((d: string) => d)
      .style('fill', '#000')
      .style('font-size', '12px');
  }

  //noinspection JSMethodCanBeStatic
  private dragstarted(node: SimulationNode, simulation: Simulation<SimulationNode, SimulationLink>) {
    if (!d3.event.active) {
      simulation.alphaTarget(0.3).restart();
    }
    node.fx = node.x;
    node.fy = node.y;
  }

  //noinspection JSMethodCanBeStatic
  private dragged(node: SimulationNode) {
    node.fx = d3.event.x;
    node.fy = d3.event.y;
  }

  //noinspection JSMethodCanBeStatic
  private dragended(node: SimulationNode, simulation: Simulation<SimulationNode, SimulationLink>) {
    if (!d3.event.active) {
      simulation.alphaTarget(0);
    }
    node.fx = null;
    node.fy = null;
  }
}
