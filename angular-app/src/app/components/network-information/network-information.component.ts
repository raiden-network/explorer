import { Component, Input, OnInit } from '@angular/core';
import { TokenNetwork } from '../../models/TokenNetwork';
import { ChannelData } from '../donut-chart/donut-chart.component';

@Component({
  selector: 'app-network-information',
  templateUrl: './network-information.component.html',
  styleUrls: ['./network-information.component.css']
})
export class NetworkInformationComponent implements OnInit {

  @Input() tokenNetwork: TokenNetwork;
  @Input() topChannels: boolean;

  constructor() {
  }

  ngOnInit() {
  }

  chart(tokenNetwork: TokenNetwork): ChannelData[] {
    const chartData: ChannelData[] = [];

    if (tokenNetwork.openedChannels) {
      chartData.push({
        status: 'open',
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
