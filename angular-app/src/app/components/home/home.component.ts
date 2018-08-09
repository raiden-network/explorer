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

  /*  Get data from server and update local values. 
      It has much repeated and redundant code; error prone and messy
      It calls `service.updateCurrentMetrics`, then runs redunant methods on the service
      (they are run within `updateCurrentMetrics`), then typed the same sequense again
      within a `setInterval`. 
  */
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
                    /*console.log('updateMetrics updateCurrentMetrics res3: that.nodes, that.links'
                      , that.nodes, that.links);*/
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

  /*  Set values to show/hide correct view */
  public showLargestNetworks() {
    this.largestTokenDisp = true;
    this.busiestTokenDisp = false;
  }

  /*  Set values to show/hide correct view */
  public showBusiestNetworks() {
    this.largestTokenDisp = false;
    this.busiestTokenDisp = true;
  }

  /*  Get data for d3 chart. Sets local `nodes` and `links` values. 
      Uses `netMetricsService.retrievePersistedDataForGraph` w `GET` 
      request to api. 
      Called at `setInterval` by `updateMetrics`. 
  */
  public initGraphData() {
    const that = this;
    that.netMetricsService.retrievePersistedDataForGraph()
      .then((res: NMResponse) => {
        const persistedData = res.body;
        // console.log('initGraphData: persistedData', persistedData);
        const psuedoNodes = persistedData['nodes'];
        const pseudoLinks = persistedData['links'];
        that.nodes = [];
        that.links = [];
        // Instantiate real Node insances iso literal object:
        for (const pseudoNode of psuedoNodes) {
          const node = new Node(pseudoNode['id']);
          // const node = new Node(pseudoNode['address']); // Here's where the bug is at: 'id' iso 'address'
          node.x = Math.floor(Math.random() * 600) + 100;
          node.y = Math.floor(Math.random() * 600) + 100;
          node.linkCount = pseudoNode['numChannels'];
          that.nodes.push(node);
        }
        // Get the real Node instance iso literal object:
        for (const pseudoLink of pseudoLinks) {
          // const link = new Link(pseudoLink['source'], pseudoLink['target']);
          const link = new Link(that.getMatchingNode(pseudoLink['source'], that.nodes), that.getMatchingNode(pseudoLink['target'], that.nodes));
          that.links.push(link);
        }
      })
      .catch((err: any) => {
        console.log('initGraphData error:', err);
      });
  }

  /*  Return the node matching the provided address:
  */
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

  /*  Get address string based on position in array. 
      Causes error when executed by angular when array does not exist yet. 
      Method redundant: Access data directly in template and use ng-for to repeat 4 times. 
  */
  public getIndexedNetworkAddress(i: number, list: Array<NMComparativeMetrics>) {
    // console.log('getIndexedNetworkAddress list ', typeof list);
    // if (typeof list === 'undefined') { console.log('getIndexedNetworkAddress no list'); list = []; }
    // if (typeof list === 'undefined') { console.log('getIndexedNetworkAddress no list'); return ''; }
    // if (!list || typeof list.length === 'undefined') { console.log('getIndexedNetworkAddress no list'); return; }
    if (i >= list.length) {
      return '';
    } else {
      return list[i].tokenAddress;
    }
  }

  /*  Get # channels based on position in array. 
      Causes error when executed by angular when array does not exist yet. 
      Method redundant: Access data directly in template and use ng-for to repeat 4 times. 
  */
  public getIndexedMetric(i: number, list: Array<NMComparativeMetrics>) {
    if (i >= list.length) {
      return null;
    } else {
      return list[i].metricValue;
    }
  }

  /*  Roughly the same as the 2 above ... */
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
