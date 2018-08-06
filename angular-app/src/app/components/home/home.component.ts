import {Component, OnInit} from '@angular/core';
import {NetMetricsService} from '../../services/net.metrics/net.metrics.service';
import {SharedService} from '../../services/net.metrics/shared.service';
import {NMComparativeMetrics} from '../../models/NMComparativeMetrics';
import {Link, Node} from '../../services/d3/models';
import {NMResponse} from '../../models/NMResponse';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {

  public currentMetrics: any;
  public numUniqueUsers = 0;
  public numNetworks = 0;
  public numTotalChannels = 0;
  public largestNetworks: Array<NMComparativeMetrics>;
  public busiestNetworks: Array<NMComparativeMetrics>;
  public nodes: Array<Node> = [];
  public links: Array<Link> = [];
  public largestTokenDisp = true;
  public busiestTokenDisp = false;
  public refreshToggle = true;

  constructor(private netMetricsService: NetMetricsService, private sharedService: SharedService) {
    this.updateMetrics();
  }

  ngOnInit() {

  }

  public updateMetrics() {
    const that = this;
    this.netMetricsService.updateCurrentMetrics()
      .then((res: any) => {
        that.currentMetrics = that.netMetricsService.getCurrentMetrics();
        that.netMetricsService.updateTotalsAndComparativeMetrics();
        that.numUniqueUsers = that.netMetricsService.getNumUniqueUsers();
        that.numNetworks = that.netMetricsService.getNumNetworks();
        that.numTotalChannels = that.netMetricsService.getTotalChannels();
        that.largestNetworks = that.netMetricsService.getLargestNetworks();
        that.busiestNetworks = that.netMetricsService.getBusiestNetworks();
        that.netMetricsService.restructureAndPersistData()
          .then((res2: any) => {
          setInterval(() => {
            this.netMetricsService.updateCurrentMetrics()
              .then((res1: any) => {
                that.currentMetrics = that.netMetricsService.getCurrentMetrics();
                that.netMetricsService.updateTotalsAndComparativeMetrics();
                that.numUniqueUsers = that.netMetricsService.getNumUniqueUsers();
                that.numNetworks = that.netMetricsService.getNumNetworks();
                that.numTotalChannels = that.netMetricsService.getTotalChannels();
                that.largestNetworks = that.netMetricsService.getLargestNetworks();
                that.busiestNetworks = that.netMetricsService.getBusiestNetworks();
                that.netMetricsService.restructureAndPersistData()
                  .then((res3: any) => {
                    if (that.refreshToggle) {
                      that.initGraphData();
                      that.refreshToggle = false;
                    }
                    console.log(that.nodes);
                    console.log(that.links);
                  })
                  .catch();
              })
              .catch();
          }, 3000);
        })
          .catch();
      })
      .catch();
  }

  public showLargestNetworks() {
    this.largestTokenDisp = true;
    this.busiestTokenDisp = false;
  }

  public showBusiestNetworks() {
    this.largestTokenDisp = false;
    this.busiestTokenDisp = true;
  }

  public initGraphData() {
    const that = this;
    that.netMetricsService.retrievePersistedDataForGraph()
      .then((res: NMResponse) => {
        const persistedData = res.body;
        console.log(persistedData);
        const psuedoNodes = persistedData['nodes'];
        const pseudoLinks = persistedData['links'];
        that.nodes = [];
        that.links = [];
        for (const pseudoNode of psuedoNodes) {
          const node = new Node(pseudoNode['address']);
          node.x = Math.floor(Math.random() * 600) + 100;
          node.y = Math.floor(Math.random() * 600) + 100;
          node.linkCount = pseudoNode['numChannels'];
          that.nodes.push(node);
        }
        for (const pseudoLink of pseudoLinks) {
          const link = new Link(that.getMatchingNode(pseudoLink['source'], that.nodes), that.getMatchingNode(pseudoLink['target'], that.nodes));
          that.links.push(link);
        }
      })
      .catch((err: any) => {

      });
  }

  public getMatchingNode(address: string, nodes: Array<Node>) {
    let res: Node;
    for (const node of nodes) {
      if (address === node.id) {
        res = node;
        break;
      }
    }
    return res;
  }

  public getIndexedNetworkAddress(i: number, list: Array<NMComparativeMetrics>) {
    if (i >= list.length) {
      return '';
    } else {
      return list[i].tokenAddress;
    }
  }

  public getIndexedMetric(i: number, list: Array<NMComparativeMetrics>) {
    if (i >= list.length) {
      return null;
    } else {
      return list[i].metricValue;
    }
  }

  public getIndexedSecondaryMetric(i: number, list: Array<NMComparativeMetrics>) {
    if (i >= list.length) {
      return null;
    } else {
      return list[i].secondaryMetricValue;
    }
  }

  public scrollToA(loc: string) {
    document.getElementById(loc).scrollIntoView();
  }
}
