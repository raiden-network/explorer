import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TokenNetwork } from '../../models/TokenNetwork';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';
import { ObservableMedia } from '@angular/flex-layout';

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

  constructor(private config: NetMetricsConfig, public readonly media$: ObservableMedia) {
  }

  private _channelsByDepositExpanded: boolean;

  public get channelsByDepositExpanded(): boolean {
    return this._channelsByDepositExpanded;
  }

  private _topParticipantsByChannelExpanded: boolean;

  public get topParticipantsByChannelExpanded(): boolean {
    return this._topParticipantsByChannelExpanded;
  }

  public etherscanUrl(address: string): string {
    return `${this.config.configuration.etherscan_base_url}${address}`;
  }

  ngOnInit() {
  }

  channelsExpanded(expanded: boolean) {
    this._channelsByDepositExpanded = expanded;
    if (!this.media$.isActive('xs')) {
      this._topParticipantsByChannelExpanded = expanded;
    }
  }

  participantsExpanded(expanded: boolean) {
    this._topParticipantsByChannelExpanded = expanded;
    if (!this.media$.isActive('xs')) {
      this._channelsByDepositExpanded = expanded;
    }
  }
}
