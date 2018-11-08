import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Channel, Participant, TokenNetwork } from '../../models/TokenNetwork';
import { ChannelData } from '../donut-chart/donut-chart.component';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';

@Component({
  selector: 'app-network-information',
  templateUrl: './network-information.component.html',
  styleUrls: ['./network-information.component.css']
})
export class NetworkInformationComponent implements OnInit {

  @Input() tokenNetwork: TokenNetwork;
  @Input() topChannels: boolean;
  @Input() isExpanded: boolean;
  @Output() expandedChanged: EventEmitter<boolean> = new EventEmitter();

  constructor(private config: NetMetricsConfig) {
  }

  public etherscanUrl(address: string): string {
    return `${this.config.configuration.etherscan_base_url}${address}`;
  }

  ngOnInit() {
  }

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

  //noinspection JSMethodCanBeStatic
  trackByFn(channel: Channel): string {
    return channel.participant1 + channel.participant2;
  }

  //noinspection JSMethodCanBeStatic
  trackByParticipant(participant: Participant): string {
    return participant.address;
  }

  toggleExpanded(): void {
    this.expandedChanged.emit(!this.isExpanded);
  }

  close(): void {
    this.expandedChanged.emit(false);
  }
}
