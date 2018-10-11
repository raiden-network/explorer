import { Component, HostListener, Input, OnChanges, OnInit, SimpleChange, ViewChild } from '@angular/core';
import { Link, NetworkGraph, Node } from '../../models/NetworkGraph';
import * as d3 from 'd3';
import { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3';
import * as d3Scale from 'd3-scale';
import * as deepEqual from 'deep-equal';
import { jab } from 'd3-cam02';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { NodeInfo } from '../../models/node-info';

interface SimulationNode extends SimulationNodeDatum, Node {
}

interface SimulationLink extends SimulationLinkDatum<SimulationNode>, Link {
}

enum ElementType {
  NODE,
  LINK
}

class FilterElement {
  constructor(readonly type: ElementType, readonly  element: SimulationNode | SimulationLink) {
  }

  node(): SimulationNode {
    return this.element as SimulationNode;
  }

  link(): SimulationLink {
    return this.element as SimulationLink;
  }
}


@Component({
  selector: 'app-network-graph',
  templateUrl: './network-graph.component.html',
  styleUrls: ['./network-graph.component.css']
})
export class NetworkGraphComponent implements OnInit, OnChanges {
  private static HIGHLIGHT_COLOR = '#2E41FF';
  private static SELECTED_COLOR = '#00b409';
  private static DEFAULT_COLOR = '#2637d6';

  private static OPEN_CHANNEL_COLOR = '#089000';
  private static CLOSED_CHANNEL_COLOR = '#E50000';
  private static SETTLED_CHANNEL_COLOR = '#8e24aa';

  private static DEFAULT_NODE_STROKE_OPACITY = 0.3;
  private static SELECTED_NODE_STROKE_OPACITY = 2;
  private static NODE_SELECTED_OPACITY = 1;
  private static NODE_HIGHLIGHT_OPACITY = 1;
  private static NODE_DEFAULT_OPACITY = 0.6;

  @Input() data: NetworkGraph;
  @ViewChild('graph') graph;

  readonly filterControl: FormControl = new FormControl();
  readonly filteredOptions$: Observable<FilterElement[]>;

  private width: number;
  private height: number;
  private initialWidth: number;
  private initialHeight: number;
  private svg: d3.Selection<any, NetworkGraph, any, any>;
  private link: any;
  private node: any;
  private color: d3.ScaleOrdinal<string, any>;
  private simulation: Simulation<SimulationNode, SimulationLink>;
  private circleSize: (value: number) => number;
  private initialized = false;
  private graphData: { nodes: SimulationNode[], links: SimulationLink[] } = {nodes: [], links: []};
  private tokenNetworks: string[];
  private nodeColor: d3.ScaleOrdinal<string, any>;

  constructor(private config: NetMetricsConfig) {
    this.filteredOptions$ = this.filterControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  private _selectionInfo?: NodeInfo;

  public get selectionInfo(): NodeInfo | undefined {
    return this._selectionInfo;
  }

  public get containerHeight(): number {
    return this.height;
  }

  public get containerWidth(): number {
    return this.width;
  }

  private _showAllChannels = false;

  // noinspection JSUnusedGlobalSymbols
  public get showAllChannels(): boolean {
    return this._showAllChannels;
  }

  public set showAllChannels(value: boolean) {
    this.initialized = false;
    this._showAllChannels = value;
    if (!value) {
      this.svg.selectAll('.legend').remove().exit();
    } else {
      this.drawLegend();
    }
    this.filterChanged();
  }

  private static nodeCompare() {
    return (datum: Node) => `${datum.id}-${datum.token.address}`;
  }

  private static linkCompare() {
    return (datum: Link) => `${datum.sourceAddress}-${datum.targetAddress}-${datum.tokenAddress}`;
  }

  public clearFilter() {
    this.filterControl.setValue(null);
    this.clearSelection();
  }

  // noinspection JSMethodCanBeStatic
  trackByFn(element: FilterElement): string {
    let trackProperty = '';
    if (element.type === ElementType.NODE) {
      trackProperty = (element.element as SimulationNode).id;
    } else if (element.type === ElementType.LINK) {
      const link = (element.element as SimulationLink);
      trackProperty = link.sourceAddress + link.targetAddress;
    }
    return trackProperty;
  }

  // noinspection JSMethodCanBeStatic
  displayFn(element: FilterElement | null): string {
    let displayText = '';
    if (element) {
      if (element.type === ElementType.NODE) {
        displayText = (element.element as SimulationNode).id;
      } else if (element.type === ElementType.LINK) {
        const link = (element.element as SimulationLink);
        displayText = `${link.sourceAddress} - ${link.targetAddress}`;
      }
    }

    return displayText;
  }

  // noinspection JSMethodCanBeStatic
  isNode(element: FilterElement): boolean {
    return ElementType.NODE === element.type;
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
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateWidth();
    this.updateHeight();

    d3.select<SVGElement, NetworkGraph>(this.graph.nativeElement)
      .select('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.svg.selectAll('.legend').remove().exit();

    if (this._showAllChannels) {
      this.drawLegend();
    }

    const translation = `translate(${(this.width - this.initialWidth) / 2},${(this.height - this.initialHeight) / 2})`;
    this.svg.selectAll('.nodes').attr('transform', translation);
    this.svg.selectAll('.links').attr('transform', translation);
    const info = this.svg.selectAll('.info');
    if (!info.empty()) {
      const boxX = parseInt(info.attr('box-x'), 10);
      const boxY = parseInt(info.attr('box-y'), 10);
      const width = boxX + ((this.width - this.initialWidth) / 2);
      const height = boxY + ((this.height - this.initialHeight) / 2);
      info.attr('transform', `translate(${width},${height})`);
    }
  }

  elementSelected(value: FilterElement) {
    if (value.type === ElementType.NODE) {
      const selectedNode = (value.element as SimulationNode);
      this.selectNode(selectedNode);
      this._selectionInfo = this.getChannels(selectedNode);
    } else if (value.type === ElementType.LINK) {
      this.linkSelected((value.element as SimulationLink));
    }
  }

  channelListClosed() {
    this._selectionInfo = undefined;
  }

  private _filter(value: string): FilterElement[] {
    const nodeElements = this.graphData.nodes.map(node => new FilterElement(ElementType.NODE, node));
    const linkElements = this.graphData.links.map(link => new FilterElement(ElementType.LINK, link));

    const allElements: FilterElement[] = [];
    allElements.push(...nodeElements);
    allElements.push(...linkElements);
    return allElements.filter(element => {
      let match = false;
      if (element.type === ElementType.NODE) {
        match = (element.element as SimulationNode).id.startsWith(value);
      } else if (element.type === ElementType.LINK) {
        const link = (element.element as SimulationLink);
        match = link.sourceAddress.startsWith(value) || link.targetAddress.startsWith(value);
      }
      return match;
    });
  }

  private updateHeight() {
    this.height = document.documentElement.clientHeight - 250;
  }

  private updateWidth() {
    this.width = document.documentElement.clientWidth - 60;
  }

  private filterChanged() {
    this.clearSelection();
    this.prepareGraphData();
    this.updateGraph();
  }

  private prepareGraphData() {
    this.graphData.nodes = [];
    this.graphData.links = [];

    let nodes = this.data.nodes;
    if (!this._showAllChannels) {
      nodes = nodes.filter(value => value.openChannels > 0);
    }

    nodes.forEach(value => {
      const node: SimulationNode = {
        id: value.id,
        openChannels: value.openChannels,
        closedChannels: value.closedChannels,
        settledChannels: value.settledChannels,
        token: value.token
      };

      this.graphData.nodes.push(node);
    });

    let links = this.data.links;

    if (!this._showAllChannels) {
      links = links.filter(value => value.status === 'opened');
    }

    links.forEach(value => {
      const matchSource = (simNode: Node) => simNode.id === value.sourceAddress && simNode.token.address === value.tokenAddress;
      const matchTarget = (simNode: Node) => simNode.id === value.targetAddress && simNode.token.address === value.tokenAddress;

      const link: SimulationLink = {
        source: this.graphData.nodes.find(matchSource),
        target: this.graphData.nodes.find(matchTarget),
        sourceAddress: value.sourceAddress,
        targetAddress: value.targetAddress,
        status: value.status,
        capacity: value.capacity,
        tokenAddress: value.tokenAddress
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
    let oldRange: number;
    if (nodes.length > 0) {
      const openChannels = nodes[nodes.length - 1].openChannels;
      oldRange = openChannels > 1 ? (openChannels - 1) : 1;
    } else {
      oldRange = 1;
    }
    this.circleSize = (value: number) => {
      let size: number;

      if (value === 0) {
        size = 5;
      } else {
        size = (((value - 1) * 3) / oldRange) + 5;
      }
      return size;
    };
  }

  private initSvg() {
    this.updateWidth();
    this.updateHeight();

    this.initialWidth = this.width;
    this.initialHeight = this.height;

    this.svg = d3.select<SVGElement, NetworkGraph>(this.graph.nativeElement)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.svg.on('click', () => {
      this.clearSelection();
      this.filterControl.setValue(null);
      this._selectionInfo = undefined;
    });

    this.link = this.svg.append('g')
      .attr('class', 'links')
      .selectAll('.link');

    this.node = this.svg.append('g')
      .attr('class', 'nodes')
      .attr('stroke-width', '1')
      .attr('stroke', '#fff')
      .selectAll('.node');

    this.color = d3Scale.scaleOrdinal()
      .domain(['opened', 'closed', 'settled'])
      .range([
        NetworkGraphComponent.OPEN_CHANNEL_COLOR,
        NetworkGraphComponent.CLOSED_CHANNEL_COLOR,
        NetworkGraphComponent.SETTLED_CHANNEL_COLOR
      ]);
  }

  private drawGraph() {
    this.svg.selectAll('.no-network-data').remove().exit();

    const simulationNodes = this.graphData.nodes;
    if (simulationNodes.length === 0) {
      this.svg.selectAll('.node').remove().exit();
      this.svg.selectAll('.link').remove().exit();

      this.svg.append('g')
        .classed('no-network-data', true)
        .attr('transform', `translate(${(this.width / 2) - 110},${this.height / 2})`)
        .append('text')
        .text('No channels to visualize!')
        .style('fill', '#000')
        .style('font-size', '20px');
      return;
    }
    this.tokenNetworks = d3.set(simulationNodes.map(value => value.token.address)).values();
    this.nodeColor = d3Scale.scaleOrdinal()
      .domain(this.tokenNetworks)
      .range(this.generateColors(this.tokenNetworks.length));

    this.simulation = d3.forceSimulation<SimulationNode, SimulationLink>()
      .force('link', d3.forceLink().id((node1: SimulationNode) => node1.id + node1.token.address))
      .force('charge', d3.forceManyBody().distanceMax(180))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .stop();

    const links = this.link.data(this.graphData.links, NetworkGraphComponent.linkCompare());

    this.svg.selectAll('.link').remove().exit();

    const link = links
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', '2')
      .attr('stroke', datum => this.color(datum.status))
      .merge(links);

    link.on('click', (datum: SimulationLink) => {
      d3.event.stopPropagation();
      this.linkSelected(datum);
    });

    link.on('mouseover', (datum: SimulationLink) => {
      d3.event.stopPropagation();
      this.clearSelection();
      this.linkSelected(datum);
    });

    const nodes = this.node.data(simulationNodes, NetworkGraphComponent.nodeCompare());

    this.svg.selectAll('.node').remove().exit();

    const node = nodes
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('fill', (datum: Node) => this.nodeColor(datum.token.address))
      .attr('r', (datum: Node) => this.circleSize(datum.openChannels))
      .call(d3.drag<any, any, any>()
        .on('start', (datum: Node) => this.dragstarted(datum, this.simulation))
        .on('drag', this.dragged)
        .on('end', (datum: Node) => this.dragended(datum, this.simulation)))
      .merge(nodes);

    node.on('click', (selectedNode: Node) => {
      d3.event.stopPropagation();
      this.clearSelection();
      this._selectionInfo = this.getChannels(selectedNode);
      return this.selectNode(selectedNode);
    });

    node.on('mouseover', (datum: SimulationNode) => {
      d3.event.stopPropagation();
      this.clearSelection();
      return this.selectNode(datum);
    });

    this.simulation.nodes(simulationNodes).on('tick', ticked);

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
      .attr('transform', (_d, i: number) => `translate(${this.width - 100},${(i * legendHeight) + 20})`);

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

  private linkSelected(datum: SimulationLink) {
    this.highlightLink(datum);

    const source = (datum.source as SimulationNodeDatum);
    const target = (datum.target as SimulationNodeDatum);

    const x1 = source.x || 0;
    const x2 = target.x || 0;
    const y1 = source.y || 0;
    const y2 = target.y || 0;

    const data = [
      `Source: ${datum.sourceAddress}`,
      `Target: ${datum.targetAddress}`,
      `Channel capacity: ${datum.capacity.toFixed((source as Node).token.decimals)} tokens`
    ];

    const boxHeight = data.length * 15 + 10;
    const boxWidth = 320;
    const boxMargin = 20;

    const boxX = this.getBoxX(x1, x2, boxWidth);
    const boxY = this.getBoxY(y1, y2, boxMargin, boxHeight);

    this.drawInformationBox(boxX, boxY, boxWidth, boxHeight, data);
  }

  private drawInformationBox(boxX: number, boxY: number, boxWidth: number, boxHeight: number, data: string[]) {
    this.svg.selectAll('.info').remove().exit();

    const info = this.svg
      .append('g')
      .classed('info', true)
      .on('click', () => {
        d3.event.stopPropagation();
      });

    const translation = `translate(${boxX},${boxY})`;
    info.attr('transform', translation)
      .attr('box-x', boxX)
      .attr('box-y', boxY);


    info.append('rect')
      .attr('width', `${boxWidth}px`)
      .attr('height', `${boxHeight}px`)
      .style('fill', '#fff')
      .style('stroke', '#000')
      .style('stroke-width', '1px');

    const appendText = (text, index) => info
      .append('text')
      .attr('x', 10)
      .attr('y', 15 + (index * 15))
      .text(text)
      .style('fill', '#000')
      .style('font-size', '11px');

    for (let i = 0; i < data.length; i++) {
      appendText(data[i], i);
    }
  }

  private highlightLink(datum: SimulationLink) {
    this.svg.selectAll('.link')
      .attr('stroke-opacity', (link: Link) => {
        if (link === datum) {
          return NetworkGraphComponent.SELECTED_NODE_STROKE_OPACITY;
        } else {
          return NetworkGraphComponent.DEFAULT_NODE_STROKE_OPACITY;
        }
      })
      .attr('z-index', (link: Link) => {
        if (link === datum) {
          return 10;
        } else {
          return 1;
        }
      })
      .attr('stroke-width', (link: Link) => {
        if (link === datum) {
          return 3;
        } else {
          return 2;
        }
      });
  }

  private getBoxX(x1: number, x2: number, boxWidth: number): number {
    const maxX = Math.max(x1, x2);
    const minX = Math.min(x1, x2);

    let boxX = (((maxX - minX) / 2) + minX) - (boxWidth / 2);
    boxX += (this.width - this.initialWidth) / 2;
    if (boxX < 0) {
      boxX = 10;
    } else if (boxX + boxWidth > this.width) {
      boxX = boxX - Math.abs(boxX + boxWidth - this.width);
    }

    return boxX;
  }

  private getBoxY(y1: number, y2: number, boxMargin: number, boxHeight: number) {
    const smY = Math.min(y1, y2);
    const mxY = Math.max(y1, y2);

    const heightBelow = this.height - mxY;
    let boxY;
    if (heightBelow > smY) {
      boxY = mxY + boxMargin;
    } else {
      boxY = smY - boxMargin - boxHeight;
    }
    const offset = this.height - this.initialHeight;
    return boxY + (offset / 2);
  }

  // noinspection JSMethodCanBeStatic
  private nodeInfo(d: Node): string[] {
    const strings: string[] = [];

    if (d.id === this.config.configuration.echo_node_address) {
      strings.push('Raiden Echo Node');
    }

    const token = d.token;
    strings.push(
      d.id,
      '',
      `Token`,
      `Address: ${token.address}`
    );

    if (token.symbol) {
      strings.push(`Symbol: ${token.symbol}`);
    }

    if (token.name) {
      strings.push(`Name: ${token.name}`);
    }

    strings.push(
      '',
      `Open Channels: ${d.openChannels}`,
      `Closed Channels: ${d.closedChannels}`,
      `Settled Channels: ${d.settledChannels}`
    );

    return strings;
  }

  private clearSelection() {
    this.svg.selectAll('.node')
      .attr('fill', (datum: Node) => this.nodeColor(datum.token.address))
      .attr('opacity', 1);
    this.svg.selectAll('.link')
      .attr('stroke-opacity', NetworkGraphComponent.DEFAULT_NODE_STROKE_OPACITY)
      .attr('z-index', 1);

    this.svg.selectAll('.info').remove().exit();
  }

  private selectNode(selectedNode: Node) {
    const neighbors: Node[] = this.getNeighbors(selectedNode);
    this.svg.selectAll('.node')
      .attr('fill', (node: Node) => this.ifNodeElse(selectedNode, node, neighbors, [
        NetworkGraphComponent.SELECTED_COLOR,
        NetworkGraphComponent.HIGHLIGHT_COLOR,
        this.nodeColor(node.token.address)
      ]))
      .attr('opacity', (node: Node) => {
        return this.ifNodeElse(selectedNode, node, neighbors, [
          NetworkGraphComponent.NODE_SELECTED_OPACITY,
          NetworkGraphComponent.NODE_HIGHLIGHT_OPACITY,
          NetworkGraphComponent.NODE_DEFAULT_OPACITY
        ]);
      });
    this.svg.selectAll('.link')
      .attr('stroke-opacity', (link: Link) => this.ifNeighborElse(selectedNode, link, [
        NetworkGraphComponent.SELECTED_NODE_STROKE_OPACITY,
        NetworkGraphComponent.DEFAULT_NODE_STROKE_OPACITY
      ]))
      .attr('z-index', (link: Link) => this.ifNeighborElse(selectedNode, link, [10, 1]))
      .attr('stroke-width', (link: Link) => this.ifNeighborElse(selectedNode, link, [3, 2]));

    const simNode = selectedNode as SimulationNodeDatum;
    const info = this.nodeInfo(selectedNode);

    const boxHeight = info.length * 15 + 10;
    const boxWidth = 320;

    const neighborY = (neighbors as SimulationNodeDatum[]).map(value => value.y).sort();

    const boxX = this.getBoxX(simNode.x, simNode.x, boxWidth);

    const minY = Math.min(simNode.y, neighborY[0]);
    const maxY = Math.max(simNode.y, neighborY[neighborY.length - 1]);
    const boxY = this.getBoxY(minY, maxY, 10, boxHeight);

    this.drawInformationBox(boxX, boxY, boxWidth, boxHeight, info);
  }

  private getChannels(node: Node): NodeInfo {
    const filter = channel => {
      const opened = channel.status === 'opened';
      const sameTokenNetwork = channel.tokenAddress === node.token.address;
      const isSource = channel.sourceAddress === node.id;
      const isTarget = channel.targetAddress === node.id;
      return opened && sameTokenNetwork && (isTarget || isSource);
    };
    const links = this.graphData.links.filter(filter);
    return new NodeInfo(node, links);
  }

  private getNeighbors(node: Node): Node[] {
    return this.graphData.links
      .reduce((neighbors, link) => {
        if (link.targetAddress === node.id && link.tokenAddress === node.token.address) {
          neighbors.push(link.source);
        } else if (link.sourceAddress === node.id && link.tokenAddress === node.token.address) {
          neighbors.push(link.target);
        }
        return neighbors;
      }, []);
  }

  // noinspection JSMethodCanBeStatic
  private isNeighbor(node: Node, link: Link): boolean {
    const sameNetwork = node.token.address === link.tokenAddress;
    const sourceMatches = sameNetwork && node.id === link.sourceAddress;
    const targetMatches = sameNetwork && node.id === link.targetAddress;
    return sourceMatches || targetMatches;
  }

  private ifNeighborElse<T>(node: Node, link: Link, tuple: [T, T]): T {
    if (this.isNeighbor(node, link)) {
      return tuple[0];
    } else {
      return tuple[1];
    }
  }

  private ifNodeElse<T>(selectedNode: Node, node: Node, neighbors: Node[], states: [T, T, T]): T {
    if (node === selectedNode) {
      return states[0];
    } else if (this.nodeInNeighbors(node, neighbors)) {
      return states[1];
    } else {
      return states[2];
    }
  }

  private nodeInNeighbors(node: Node, neighbors: Node[]) {
    return neighbors.find(current => this.isSameNode(node, current));
  }

  // noinspection JSMethodCanBeStatic
  private isSameNode(node1: Node, node2: Node): boolean {
    return node1.token.address === node2.token.address && node1.id === node2.id;
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

  private generateColors(number: number): string[] {
    const transform = (x, os, oe, ns, ne) => (((x - os) * (ne - ns)) / (oe - os)) + ns;
    const colors: string[] = [];

    for (let i = 0; i < number; i++) {
      const transform1 = Math.round(transform(i, 0, number, 10, 90));
      const color = this.findColor(transform1);
      colors.push(color);
    }
    return colors;
  }

  private findColor(j: number) {
    for (let b = -40; b < 40; b++) {
      for (let a = -40; a < 40; a++) {
        const ja = jab(j, a, b);
        const rgb = ja.rgb();
        if (rgb.displayable()) {
          return `#${this.formatHex(rgb.r)}${this.formatHex(rgb.g)}${this.formatHex(rgb.b)}`;
        }
      }
    }

    return NetworkGraphComponent.DEFAULT_COLOR;
  }

  // noinspection JSMethodCanBeStatic
  private formatHex(v: number) {
    return ('00' + Math.round(v).toString(16)).substr(-2);
  }
}
