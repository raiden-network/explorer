import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChange,
  ViewChild
} from '@angular/core';
import { Link, NetworkGraph, Node } from '../../models/NetworkGraph';
import * as d3 from 'd3';
import { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3';
import * as d3Scale from 'd3-scale';
import * as deepEqual from 'deep-equal';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';
import { FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { delay, filter, map, startWith, tap } from 'rxjs/operators';
import { Viewport, Layer } from 'concretejs';
import { NodeInfo } from '../../models/node-info';
import { ActivatedRoute } from '@angular/router';

interface SimulationNode extends SimulationNodeDatum, Node {
  key: number;
}

interface SimulationLink extends SimulationLinkDatum<SimulationNode>, Link {
  key: number;
}

enum ElementType {
  NODE,
  LINK
}

class FilterElement {
  constructor(readonly type: ElementType, readonly element: SimulationNode | SimulationLink) {}

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
export class NetworkGraphComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private static DEFAULT_ONLINE_COLOR = '#00B35C';
  private static HIGHLIGHT_ONLINE_COLOR = '#00E676';
  private static HIGHLIGHT_NEIGHBOR_ONLINE_COLOR = '#006635';
  private static DEFAULT_OFFLINE_COLOR = '#3D51C3';
  private static HIGHTLIGHT_OFFLINE_COLOR = '#30D9E6';
  private static HIGHLIGHT_NEIGHBOR_OFFLINE_COLOR = '#011CB7';

  private static OPEN_CHANNEL_COLOR = '#4CAF50';
  private static CLOSED_CHANNEL_COLOR = '#F44336';
  private static SETTLED_CHANNEL_COLOR = '#673AB7';

  private static NODE_HIGHLIGHT_OPACITY = 1;
  private static NODE_DEFAULT_OPACITY = 0.6;
  private static LINK_HIGHLIGHT_STROKE_WIDTH = 3;
  private static LINK_DEFAULT_STROKE_WIDTH = 2;
  private static LINK_HIGHLIGHT_STROKE_OPACITY = 1;
  private static LINK_DEFAULT_STROKE_OPACITY = 0.3;

  @Input() data: NetworkGraph;
  @ViewChild('graph', { static: true }) graph;
  @ViewChild('overlay', { static: true }) overlay;

  readonly filterControl: FormControl = new FormControl();
  readonly filteredOptions$: Observable<FilterElement[]>;

  private width: number;
  private height: number;
  private base: d3.Selection<HTMLElement, NetworkGraph, any, any>;
  private canvas: d3.Selection<HTMLCanvasElement, NetworkGraph, any, any>;
  private infoBoxOverlay: d3.Selection<SVGElement, any, any, any>;
  private viewport: Viewport;
  private infoLayer: Layer;
  private drawingLayer: Layer;
  private links: d3.Selection<SVGLineElement, SimulationLink, SVGGElement, NetworkGraph>;
  private nodes: d3.Selection<SVGCircleElement, SimulationNode, SVGGElement, NetworkGraph>;
  private channelColors: d3.ScaleOrdinal<string, any>;
  private simulation: Simulation<SimulationNode, SimulationLink>;
  private circleSize: (value: number) => number;
  private graphData: { nodes: SimulationNode[]; links: SimulationLink[] } = {
    nodes: [],
    links: []
  };
  private tokenNetworks: string[];
  private selectedLink: SimulationLink;
  private selectedNode: SimulationNode;

  private nextKey = 0;
  private keyToDatum = {};

  private subscription: Subscription;

  constructor(private config: NetMetricsConfig, private route: ActivatedRoute) {
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

  public get showAllChannels(): boolean {
    return this._showAllChannels;
  }

  public set showAllChannels(value: boolean) {
    this._showAllChannels = value;
    this.updateLegend();
    this.showGraph();
  }

  private static nodeCompare() {
    return (datum: SimulationNode) => `${datum.id}-${datum.token.address}`;
  }

  private static linkCompare() {
    return (datum: SimulationLink) =>
      `${datum.sourceAddress}-${datum.targetAddress}-${datum.tokenAddress}`;
  }

  public clearFilter() {
    this.filterControl.setValue('');
    this.clearSelection();
    this.drawCanvas();
  }

  trackByFn(element: FilterElement): string {
    let trackProperty = '';
    if (element.type === ElementType.NODE) {
      trackProperty = (element.element as SimulationNode).id;
    } else if (element.type === ElementType.LINK) {
      const link = element.element as SimulationLink;
      trackProperty = link.sourceAddress + link.targetAddress;
    }
    return trackProperty;
  }

  displayFn(element: FilterElement | null): string {
    let displayText = '';
    if (element) {
      if (element.type === ElementType.NODE) {
        displayText = (element.element as SimulationNode).id;
      } else if (element.type === ElementType.LINK) {
        const link = element.element as SimulationLink;
        displayText = `${link.sourceAddress} - ${link.targetAddress}`;
      }
    }

    return displayText;
  }

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

    this.showGraph();
  }

  ngOnInit() {
    this.initCanvas();
    this.showGraph();
  }

  ngAfterViewInit() {
    this.subscription = this.route.queryParamMap
      .pipe(
        map(params => params.get('node')),
        filter(value => !!value),
        map(query => {
          const results = this._filter(query).filter(element => element.type === ElementType.NODE);
          if (results.length !== 1) {
            this.showQueryError(query);
          }
          return results;
        }),
        filter(results => results.length === 1),
        map(results => results[0]),
        tap(() => document.querySelector('#network-graph').scrollIntoView()),
        delay(0)
      )
      .subscribe(element => {
        this.filterControl.setValue(element);
        this.elementSelected(element);
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateWidth();
    this.updateHeight();

    this.viewport.setSize(this.width, this.height);
    this.showGraph();
  }

  elementSelected(value: FilterElement) {
    this.clearSelection();
    if (value.type === ElementType.NODE) {
      const selectedNode = value.element as SimulationNode;
      this.selectNode(selectedNode);
      this._selectionInfo = this.getChannels(selectedNode);
    } else if (value.type === ElementType.LINK) {
      this.selectLink(value.element as SimulationLink);
    }
    this.drawCanvas();
  }

  channelListClosed() {
    this._selectionInfo = undefined;
  }

  private _filter(value: string): FilterElement[] {
    const nodeElements = this.graphData.nodes.map(
      node => new FilterElement(ElementType.NODE, node)
    );
    const linkElements = this.graphData.links.map(
      link => new FilterElement(ElementType.LINK, link)
    );

    const allElements: FilterElement[] = [];
    allElements.push(...nodeElements);
    allElements.push(...linkElements);
    return allElements.filter(element => {
      let match = false;
      if (element.type === ElementType.NODE) {
        match = (element.element as SimulationNode).id.startsWith(value);
      } else if (element.type === ElementType.LINK) {
        const link = element.element as SimulationLink;
        match = link.sourceAddress.startsWith(value) || link.targetAddress.startsWith(value);
      }
      return match;
    });
  }

  private initCanvas() {
    this.updateWidth();
    this.updateHeight();

    this.viewport = new Viewport({
      width: this.width,
      height: this.height,
      container: this.graph.nativeElement
    });
    this.infoLayer = new Layer();
    this.drawingLayer = new Layer();
    this.viewport.add(this.infoLayer);
    this.viewport.add(this.drawingLayer);

    this.canvas = d3.select<HTMLElement, NetworkGraph>(this.graph.nativeElement).select('canvas');
    this.base = d3.select(document.createElement('virtual'));
    this.infoBoxOverlay = d3.select(this.overlay.nativeElement);

    this.links = this.base
      .append('g')
      .attr('class', 'links')
      .selectAll('.link');

    this.nodes = this.base
      .append('g')
      .attr('class', 'nodes')
      .selectAll('.node');

    this.channelColors = d3Scale
      .scaleOrdinal()
      .domain(['opened', 'closed', 'settled'])
      .range([
        NetworkGraphComponent.OPEN_CHANNEL_COLOR,
        NetworkGraphComponent.CLOSED_CHANNEL_COLOR,
        NetworkGraphComponent.SETTLED_CHANNEL_COLOR
      ]);

    this.initEventHandlers();
  }

  private initEventHandlers() {
    const isLink = (u: any): u is SimulationLink => u && u['status'];

    const isNode = (u: any): u is SimulationNode => u && u['id'];

    this.canvas.on('mousemove', () => {
      this.drawHitCanvas();
      const key = this.viewport.getIntersection(d3.event.offsetX, d3.event.offsetY);
      const datum = this.keyToDatum[key];

      if (isLink(datum)) {
        this.clearSelection();
        this.selectLink(datum);
        this.drawCanvas();
      }

      if (isNode(datum)) {
        this.clearSelection();
        this.selectNode(datum);
        this.drawCanvas();
      }
    });

    this.canvas.on('mousedown', () => {
      this.drawHitCanvas();
      const key = this.viewport.getIntersection(d3.event.offsetX, d3.event.offsetY);
      const datum = this.keyToDatum[key];

      if (datum === undefined) {
        this.clearSelection();
        this.filterControl.setValue('');
        this._selectionInfo = undefined;
        this.drawCanvas();
      }
    });

    this.canvas.on('click', () => {
      this.drawHitCanvas();
      const key = this.viewport.getIntersection(d3.event.offsetX, d3.event.offsetY);
      const datum = this.keyToDatum[key];

      if (isNode(datum)) {
        this.clearSelection();
        this._selectionInfo = this.getChannels(datum);
        this.selectNode(datum);
        this.drawCanvas();
      }
    });
  }

  private updateHeight() {
    this.height = document.documentElement.clientHeight - 250;
  }

  private updateWidth() {
    this.width = document.documentElement.clientWidth - 60;
  }

  private showGraph() {
    this.prepareGraphData(this.getNodes());
    this.updateGraph();
  }

  private getNodes() {
    let nodes = this.data.nodes;
    if (!this._showAllChannels) {
      nodes = nodes.filter(value => value.openChannels > 0);
    }
    return nodes;
  }

  private prepareGraphData(nodes: Node[]) {
    this.graphData.nodes = [];
    this.graphData.links = [];

    nodes.forEach(value => {
      const key = this.getNextKey();
      const node = Object.assign({ key: key }, value);

      this.keyToDatum[key] = node;
      this.graphData.nodes.push(node);
    });

    let links = this.data.links;

    if (!this._showAllChannels) {
      links = links.filter(value => value.status === 'opened');
    }

    links.forEach(value => {
      const matchSource = (simNode: Node) =>
        simNode.id === value.sourceAddress && simNode.token.address === value.tokenAddress;
      const matchTarget = (simNode: Node) =>
        simNode.id === value.targetAddress && simNode.token.address === value.tokenAddress;

      const source = this.graphData.nodes.find(matchSource);
      const target = this.graphData.nodes.find(matchTarget);

      if (source && target) {
        const key = this.getNextKey();
        const link: SimulationLink = {
          source: source,
          target: target,
          sourceAddress: value.sourceAddress,
          targetAddress: value.targetAddress,
          status: value.status,
          capacity: value.capacity,
          tokenAddress: value.tokenAddress,
          key: key
        };

        this.keyToDatum[key] = link;
        this.graphData.links.push(link);
      }
    });
  }

  private updateGraph() {
    this.updateCircleCalculation();
    this.drawVirtualGraph();
  }

  private updateCircleCalculation() {
    const nodes = this.graphData.nodes;
    nodes.sort((a, b) => a.openChannels - b.openChannels);
    let oldRange: number;
    if (nodes.length > 0) {
      const openChannels = nodes[nodes.length - 1].openChannels;
      oldRange = openChannels > 1 ? openChannels - 1 : 1;
    } else {
      oldRange = 1;
    }
    this.circleSize = (value: number) => {
      let size: number;

      if (value === 0) {
        size = 5;
      } else {
        size = ((value - 1) * 3) / oldRange + 5;
      }
      return size;
    };
  }

  private drawVirtualGraph() {
    this.resetGraph();
    const simulationNodes = this.graphData.nodes;
    if (simulationNodes.length === 0) {
      this.base
        .append('g')
        .classed('no-network-data', true)
        .attr('x', this.width / 2 - 110)
        .attr('y', this.height / 2)
        .append('text')
        .text('No channels to visualize!');
      this.drawCanvas();
      return;
    }

    this.updateLegend();

    this.simulation = d3
      .forceSimulation<SimulationNode, SimulationLink>()
      .force(
        'link',
        d3.forceLink().id((node1: SimulationNode) => node1.id + node1.token.address)
      )
      .force('charge', d3.forceManyBody().distanceMax(180))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    this.links = this.links.data(this.graphData.links, NetworkGraphComponent.linkCompare());

    this.links = this.links
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', (datum: SimulationLink) => this.channelColors(datum.status))
      .attr('stroke-opacity', NetworkGraphComponent.LINK_DEFAULT_STROKE_OPACITY)
      .attr('stroke-width', NetworkGraphComponent.LINK_DEFAULT_STROKE_WIDTH)
      .merge(this.links);

    this.nodes = this.nodes.data(simulationNodes, NetworkGraphComponent.nodeCompare());

    this.nodes = this.nodes
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('fill', (datum: SimulationNode) =>
        datum.online
          ? NetworkGraphComponent.DEFAULT_ONLINE_COLOR
          : NetworkGraphComponent.DEFAULT_OFFLINE_COLOR
      )
      .attr('r', (datum: SimulationNode) => this.circleSize(datum.openChannels))
      .attr('opacity', NetworkGraphComponent.NODE_HIGHLIGHT_OPACITY)
      .merge(this.nodes);

    const ticked = () => {
      this.links
        .attr('x1', d => (d.source as SimulationNode).x)
        .attr('y1', d => (d.source as SimulationNode).y)
        .attr('x2', d => (d.target as SimulationNode).x)
        .attr('y2', d => (d.target as SimulationNode).y);

      this.nodes.attr('cx', (d: SimulationNode) => d.x).attr('cy', (d: SimulationNode) => d.y);
      this.drawCanvas();
      this.drawNodeInfoBox();
      this.drawLinkInfoBox();
    };

    this.simulation.nodes(simulationNodes).on('tick', ticked);

    // @ts-ignore
    this.simulation.force('link').links(this.graphData.links);
  }

  private drawCanvas() {
    this.infoLayer.scene.clear();
    this.drawingLayer.scene.clear();

    const infoContext: CanvasRenderingContext2D = this.infoLayer.scene.context;
    const drawingContext: CanvasRenderingContext2D = this.drawingLayer.scene.context;

    const noData = this.base.selectAll('.no-network-data');
    noData.each((d: any, i: number, elements: SVGGElement[]) => {
      const text = d3.select(elements[i]);
      infoContext.font = '20px sans-serif';
      infoContext.textBaseline = 'top';
      const textWidth = infoContext.measureText(text.text()).width;
      const x = Number(text.attr('x'));
      const y = Number(text.attr('y'));
      infoContext.fillStyle = '#ffffff';
      infoContext.fillRect(x, y, textWidth, 20);
      infoContext.fillStyle = '#000000';
      infoContext.fillText(text.text(), x, y);
    });

    const legend = this.base.selectAll('.legend');
    legend.each((d: string, i: number, elements: SVGGElement[]) => {
      const group = d3.select(elements[i]);

      const rect = group.select('.rect');
      if (!rect.empty()) {
        infoContext.fillStyle = rect.attr('fill');
        infoContext.strokeStyle = rect.attr('stroke');
        infoContext.fillRect(
          Number(group.attr('x')),
          Number(group.attr('y')),
          Number(rect.attr('width')),
          Number(rect.attr('height'))
        );
      }

      const circle = group.select('.circle');
      if (!circle.empty()) {
        infoContext.beginPath();
        infoContext.arc(
          Number(group.attr('x')) + Number(circle.attr('r')),
          Number(group.attr('y')),
          Number(circle.attr('r')),
          0,
          2 * Math.PI
        );
        infoContext.fillStyle = circle.attr('fill');
        infoContext.fill();
      }

      const text = group.select('.text');
      infoContext.font = '12px sans-serif';
      infoContext.fillStyle = '#000000';
      infoContext.fillText(
        text.text(),
        Number(group.attr('x')) + Number(text.attr('x')),
        Number(group.attr('y')) + Number(text.attr('y'))
      );
    });

    this.links.each((d: SimulationLink, i: number, elements: SVGLineElement[]) => {
      const link = d3.select(elements[i]);
      drawingContext.beginPath();
      drawingContext.strokeStyle = link.attr('stroke');
      drawingContext.globalAlpha = Number(link.attr('stroke-opacity'));
      drawingContext.lineWidth = Number(link.attr('stroke-width'));
      drawingContext.moveTo(Number(link.attr('x1')), Number(link.attr('y1')));
      drawingContext.lineTo(Number(link.attr('x2')), Number(link.attr('y2')));
      drawingContext.stroke();
    });

    drawingContext.strokeStyle = '#ffffff';
    drawingContext.lineWidth = 1;
    this.nodes.each((d: SimulationNode, i: number, elements: SVGCircleElement[]) => {
      const node = d3.select(elements[i]);
      drawingContext.beginPath();
      drawingContext.arc(
        Number(node.attr('cx')),
        Number(node.attr('cy')),
        Number(node.attr('r')),
        0,
        2 * Math.PI
      );
      drawingContext.fillStyle = node.attr('fill');
      drawingContext.globalAlpha = Number(node.attr('opacity'));
      drawingContext.fill();
      drawingContext.stroke();
    });

    this.infoLayer.moveToTop();
    this.viewport.render();
  }

  private drawHitCanvas() {
    this.drawingLayer.hit.clear();
    const hitContext: CanvasRenderingContext2D = this.drawingLayer.hit.context;

    hitContext.lineWidth = 6;
    this.links.each((d: SimulationLink, i: number, elements: SVGLineElement[]) => {
      const link = d3.select(elements[i]);
      hitContext.beginPath();
      hitContext.strokeStyle = this.drawingLayer.hit.getColorFromIndex(d.key);
      hitContext.moveTo(Number(link.attr('x1')), Number(link.attr('y1')));
      hitContext.lineTo(Number(link.attr('x2')), Number(link.attr('y2')));
      hitContext.stroke();
    });

    this.nodes.each((d: SimulationNode, i: number, elements: SVGCircleElement[]) => {
      const node = d3.select(elements[i]);
      hitContext.fillStyle = this.drawingLayer.hit.getColorFromIndex(d.key);
      hitContext.beginPath();
      hitContext.arc(
        Number(node.attr('cx')),
        Number(node.attr('cy')),
        Number(node.attr('r')) + 1,
        0,
        2 * Math.PI
      );
      hitContext.fill();
    });

    this.viewport.render();
  }

  private resetGraph() {
    this.clearSelection();
    this.filterControl.setValue('');
    this._selectionInfo = undefined;
    this.base.selectAll('.no-network-data').remove();

    this.nodes.each((datum: SimulationNode) => {
      delete this.keyToDatum[datum.key];
    });
    this.links.each((datum: SimulationLink) => {
      delete this.keyToDatum[datum.key];
    });
    this.base
      .selectAll('.node')
      .exit()
      .remove();
    this.base
      .selectAll('.link')
      .exit()
      .remove();
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  private updateLegend() {
    this.base.selectAll('.legend').remove();
    this.drawLegend();
  }

  private drawLegend() {
    if (!this._showAllChannels) {
      return;
    }

    const legendElementHeight = 12;
    const legendSpacing = 7;
    const legendHeight = legendElementHeight + legendSpacing;
    const offset = 20;
    const legend = this.base.selectAll('.legend');

    const channelLegend = legend
      .data(this.channelColors.domain())
      .enter()
      .append('g')
      .classed('legend', true)
      .attr('x', this.width - 100)
      .attr('y', (d, i: number) => i * legendHeight + offset);

    channelLegend
      .append('rect')
      .classed('rect', true)
      .attr('width', legendElementHeight)
      .attr('height', legendElementHeight / 6)
      .attr('fill', this.channelColors);

    channelLegend
      .append('text')
      .classed('text', true)
      .attr('x', 20)
      .attr('y', 5)
      .text((d: string) => d);
  }

  private selectLink(link: SimulationLink) {
    this.highlightLink(link);
    this.selectedLink = link;
    this.drawLinkInfoBox();
  }

  private drawLinkInfoBox() {
    if (!this.selectedLink) {
      return;
    }
    const source = this.selectedLink.source as SimulationNodeDatum;
    const target = this.selectedLink.target as SimulationNodeDatum;

    const x1 = source.x || 0;
    const x2 = target.x || 0;
    const y1 = source.y || 0;
    const y2 = target.y || 0;

    const data = [
      this.tooltipLine('Source:', this.selectedLink.sourceAddress),
      this.tooltipLine('Target:', this.selectedLink.targetAddress),
      this.tooltipLine(
        'Channel capacity:',
        `${this.selectedLink.capacity.toFixed((source as Node).token.decimals)} ${
          (source as Node).token.symbol
        }`
      )
    ];

    const boxHeight = data.length * 15 + 20;
    const boxWidth = 320;
    const boxMargin = 20;

    const boxX = this.getBoxX(x1, x2, boxWidth);
    const boxY = this.getBoxY(y1, y2, boxMargin, boxHeight);

    this.drawInformationBox(boxX, boxY, boxWidth, data);
  }

  private highlightLink(selectedLink: SimulationLink) {
    this.links
      .attr('stroke-opacity', (link: Link) => {
        if (link === selectedLink) {
          return NetworkGraphComponent.LINK_HIGHLIGHT_STROKE_OPACITY;
        } else {
          return NetworkGraphComponent.LINK_DEFAULT_STROKE_OPACITY;
        }
      })
      .attr('stroke-width', (link: Link) => {
        if (link === selectedLink) {
          return NetworkGraphComponent.LINK_HIGHLIGHT_STROKE_WIDTH;
        } else {
          return NetworkGraphComponent.LINK_DEFAULT_STROKE_WIDTH;
        }
      });
  }

  private tooltipLine(label: string, content: string | number): string {
    return `<span class="tooltip-label">${label}</span> ${content}`;
  }

  private drawInformationBox(boxX: number, boxY: number, boxWidth: number, data: string[]) {
    this.infoBoxOverlay.selectAll('.info').remove();

    const info = this.infoBoxOverlay.append('div').classed('info', true);

    const translation = `translate(${boxX}px,${boxY}px)`;
    info
      .attr('box-x', boxX)
      .attr('box-y', boxY)
      .style('width', `${boxWidth}px`)
      .style('transform', translation)
      .style('pointer-events', 'auto');

    const appendText = text => `<div class="truncate">${text}</div>`;
    let html = '';
    for (let i = 0; i < data.length; i++) {
      html += appendText(data[i]);
    }

    info.html(`<div class="graph-tooltip">${html}</div>`);
  }

  private getBoxX(x1: number, x2: number, boxWidth: number): number {
    const maxX = Math.max(x1, x2);
    const minX = Math.min(x1, x2);

    let boxX = (maxX - minX) / 2 + minX - boxWidth / 2;
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
    return boxY;
  }

  private nodeInfo(d: Node): string[] {
    const strings: string[] = [];

    if (d.id === this.config.configuration.echo_node_address) {
      strings.push(`<strong>Raiden Echo Node</strong>`);
    }

    const token = d.token;
    strings.push(
      `<strong>${d.id}</strong>`,
      `Status: ${d.online ? 'online' : 'offline'}`,
      '',
      `<strong>Token</strong>`,
      this.tooltipLine('Address:', token.address)
    );

    if (token.symbol) {
      strings.push(this.tooltipLine('Symbol:', token.symbol));
    }

    if (token.name) {
      strings.push(this.tooltipLine('Name:', token.name));
    }

    strings.push(
      '',
      this.tooltipLine('Open Channels:', d.openChannels),
      this.tooltipLine('Closed Channels:', d.closedChannels),
      this.tooltipLine('Settled Channels:', d.settledChannels)
    );

    return strings;
  }

  private clearSelection() {
    this.base.selectAll('.query-error').remove();
    this.selectedLink = undefined;
    this.selectedNode = undefined;
    this.nodes
      .attr('fill', (datum: Node) =>
        datum.online
          ? NetworkGraphComponent.DEFAULT_ONLINE_COLOR
          : NetworkGraphComponent.DEFAULT_OFFLINE_COLOR
      )
      .attr('opacity', NetworkGraphComponent.NODE_HIGHLIGHT_OPACITY);
    this.links
      .attr('stroke-opacity', NetworkGraphComponent.LINK_DEFAULT_STROKE_OPACITY)
      .attr('stroke-width', NetworkGraphComponent.LINK_DEFAULT_STROKE_WIDTH);
    this.infoBoxOverlay.selectAll('.info').remove();
  }

  private selectNode(node: SimulationNode) {
    this.highlightNode(node);
    this.selectedNode = node;
    this.drawNodeInfoBox();
  }

  private drawNodeInfoBox() {
    if (!this.selectedNode) {
      return;
    }
    const neighbors: Node[] = this.getNeighbors(this.selectedNode);
    const info = this.nodeInfo(this.selectedNode);

    const boxHeight = info.length * 15 + 10;
    const boxWidth = 320;

    const neighborY = (neighbors as SimulationNodeDatum[]).map(value => value.y).sort();

    const boxX = this.getBoxX(this.selectedNode.x, this.selectedNode.x, boxWidth);

    const minY = Math.min(this.selectedNode.y, neighborY[0]);
    const maxY = Math.max(this.selectedNode.y, neighborY[neighborY.length - 1]);
    const boxY = this.getBoxY(minY, maxY, 10, boxHeight);

    this.drawInformationBox(boxX, boxY, boxWidth, info);
  }

  private highlightNode(selectedNode: SimulationNode) {
    const neighbors: Node[] = this.getNeighbors(selectedNode);

    this.nodes
      .attr('fill', (node: Node) => {
        if (node.online) {
          return this.ifNodeElse(selectedNode, node, neighbors, [
            NetworkGraphComponent.HIGHLIGHT_ONLINE_COLOR,
            NetworkGraphComponent.HIGHLIGHT_NEIGHBOR_ONLINE_COLOR,
            NetworkGraphComponent.DEFAULT_ONLINE_COLOR
          ]);
        }
        return this.ifNodeElse(selectedNode, node, neighbors, [
          NetworkGraphComponent.HIGHTLIGHT_OFFLINE_COLOR,
          NetworkGraphComponent.HIGHLIGHT_NEIGHBOR_OFFLINE_COLOR,
          NetworkGraphComponent.DEFAULT_OFFLINE_COLOR
        ]);
      })
      .attr('opacity', (node: Node) =>
        this.ifNodeElse(selectedNode, node, neighbors, [
          NetworkGraphComponent.NODE_HIGHLIGHT_OPACITY,
          NetworkGraphComponent.NODE_HIGHLIGHT_OPACITY,
          NetworkGraphComponent.NODE_DEFAULT_OPACITY
        ])
      );
    this.links
      .attr('stroke-opacity', (link: Link) =>
        this.ifNeighborElse(selectedNode, link, [
          NetworkGraphComponent.LINK_HIGHLIGHT_STROKE_OPACITY,
          NetworkGraphComponent.LINK_DEFAULT_STROKE_OPACITY
        ])
      )
      .attr('stroke-width', (link: Link) => this.ifNeighborElse(selectedNode, link, [3, 2]));
  }

  private getChannels(node: Node): NodeInfo {
    const filterChannels = channel => {
      const opened = channel.status === 'opened';
      const sameTokenNetwork = channel.tokenAddress === node.token.address;
      const isSource = channel.sourceAddress === node.id;
      const isTarget = channel.targetAddress === node.id;
      return opened && sameTokenNetwork && (isTarget || isSource);
    };
    const links = this.graphData.links.filter(filterChannels);
    return new NodeInfo(node, links);
  }

  private getNeighbors(node: Node): Node[] {
    return this.graphData.links.reduce((neighbors, link) => {
      if (link.targetAddress === node.id && link.tokenAddress === node.token.address) {
        neighbors.push(link.source);
      } else if (link.sourceAddress === node.id && link.tokenAddress === node.token.address) {
        neighbors.push(link.target);
      }
      return neighbors;
    }, []);
  }

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

  private isSameNode(node1: Node, node2: Node): boolean {
    return node1.token.address === node2.token.address && node1.id === node2.id;
  }

  private showQueryError(query: string) {
    this.base.selectAll('.query-error').remove();
    this.base
      .append('g')
      .classed('no-network-data', true)
      .classed('query-error', true)
      .attr('x', this.width / 2 - 80)
      .attr('y', this.height / 2 + 20)
      .append('text')
      .text('No node for query:');
    this.base
      .append('g')
      .classed('no-network-data', true)
      .classed('query-error', true)
      .attr('x', this.width / 2 - 80)
      .attr('y', this.height / 2 + 40)
      .append('text')
      .text(query);
    this.drawCanvas();
    document.querySelector('#network-graph').scrollIntoView();
    console.error(`There is no node to highlight for query parameter: ${query}`);
  }

  private getNextKey(): number {
    this.nextKey += 10;
    return this.nextKey;
  }
}
