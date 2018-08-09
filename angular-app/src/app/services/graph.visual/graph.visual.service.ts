import * as d3 from 'd3';
import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NetMetricsService} from '../net.metrics/net.metrics.service';
import {SharedService} from '../net.metrics/shared.service';

export class GraphVisualService implements OnInit {

  public restructuredMetrics: any;

  constructor(private http: HttpClient, private nmService: NetMetricsService, private sharedService: SharedService) {
    const that = this;
    nmService.retrievePersistedDataForGraph()
      .then((res: any) => {
        that.restructuredMetrics = res;
      })
      .catch((err: any) => {
        console.log(err);
      });
  }

  ngOnInit() {

  }


}
