import { Component, Input, OnInit } from '@angular/core';
import { RaidenNetworkMetrics, UserAccountStatistics } from '../../models/TokenNetwork';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { ChannelData } from '../donut-chart/donut-chart.component';
import { NetMetricsConfig } from 'src/app/services/net.metrics/net.metrics.config';
import { MediaObserver } from '@angular/flex-layout';

@Component({
  selector: 'app-network-totals',
  templateUrl: './totals-section.component.html',
  styleUrls: ['./totals-section.component.css'],
  animations: [
    trigger('flyInOut', [
      state('in', style({ transform: 'translateX(0)' })),
      transition('void => *', [
        animate(
          300,
          keyframes([
            style({ opacity: 0, transform: 'translateX(-100%)', offset: 0 }),
            style({ opacity: 1, transform: 'translateX(15px)', offset: 0.3 }),
            style({ opacity: 1, transform: 'translateX(0)', offset: 1.0 })
          ])
        )
      ]),
      transition('* => void', [
        animate(
          300,
          keyframes([
            style({ opacity: 1, transform: 'translateX(0)', offset: 0 }),
            style({ opacity: 1, transform: 'translateX(-15px)', offset: 0.7 }),
            style({ opacity: 0, transform: 'translateX(100%)', offset: 1.0 })
          ])
        )
      ])
    ])
  ]
})
export class TotalsSectionComponent implements OnInit {
  @Input() network: string;
  @Input() metrics: RaidenNetworkMetrics;

  constructor(private config: NetMetricsConfig, private mediaObserver: MediaObserver) {}

  ngOnInit() {}

  chart(): ChannelData[] {
    const chartData: ChannelData[] = [];

    if (this.metrics.openChannels) {
      chartData.push({
        status: 'opened',
        channels: this.metrics.openChannels
      });
    }

    if (this.metrics.closedChannels) {
      chartData.push({
        status: 'closed',
        channels: this.metrics.closedChannels
      });
    }

    if (this.metrics.settledChannels) {
      chartData.push({
        status: 'settled',
        channels: this.metrics.settledChannels
      });
    }
    return chartData;
  }

  etherscanUrl(address: string): string {
    return `${this.config.configuration.etherscan_base_url}${address}`;
  }

  //noinspection JSMethodCanBeStatic
  trackByParticipant(participant: UserAccountStatistics): string {
    return participant.address;
  }

  isMobile(): boolean {
    return this.mediaObserver.isActive('lt-md');
  }
}
