import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';
import { Channel, TokenNetwork } from '../../models/TokenNetwork';

@Component({
  selector: 'app-total-channels-by-deposit',
  templateUrl: './total-channels-by-deposit.component.html',
  styleUrls: ['./total-channels-by-deposit.component.scss']
})
export class TotalChannelsByDepositComponent implements OnInit {
  @Input() tokenNetwork: TokenNetwork;
  @Input() isExpanded: boolean;
  @Output() expandedChanged: EventEmitter<boolean> = new EventEmitter();

  constructor(private config: NetMetricsConfig) {}

  ngOnInit() {}

  toggleExpanded(): void {
    this.expandedChanged.emit(!this.isExpanded);
  }

  public etherscanUrl(address: string): string {
    return `${this.config.configuration.etherscan_base_url}${address}`;
  }

  //noinspection JSMethodCanBeStatic
  trackByFn(channel: Channel): string {
    return channel.participant1 + channel.participant2;
  }
}
