import { Component, Input, OnInit } from '@angular/core';
import { TokenNetwork } from '../../models/TokenNetwork';
import { ChannelData } from '../donut-chart/donut-chart.component';

@Component({
  selector: 'app-channels-overview',
  templateUrl: './channels-overview.component.html',
  styleUrls: ['./channels-overview.component.scss']
})
export class ChannelsOverviewComponent implements OnInit {
  @Input() tokenNetwork: TokenNetwork;

  constructor() {}

  ngOnInit() {}

  //noinspection JSMethodCanBeStatic
  chart(tokenNetwork: TokenNetwork): ChannelData[] {
    const chartData: ChannelData[] = [];

    if (tokenNetwork.openedChannels) {
      chartData.push({
        status: 'opened',
        channels: tokenNetwork.openedChannels
      });
    }

    if (tokenNetwork.closedChannels) {
      chartData.push({
        status: 'closed',
        channels: tokenNetwork.closedChannels
      });
    }

    if (tokenNetwork.settledChannels) {
      chartData.push({
        status: 'settled',
        channels: tokenNetwork.settledChannels
      });
    }
    return chartData;
  }
}
