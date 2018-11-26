import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TokenNetwork } from '../../models/TokenNetwork';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';
import { ObservableMedia } from '@angular/flex-layout';

export interface ExpandedAreas {
  readonly channelsByDeposit: boolean;
  readonly participantsByChannel: boolean;
}

@Component({
  selector: 'app-network-information',
  templateUrl: './network-information.component.html',
  styleUrls: ['./network-information.component.css']
})
export class NetworkInformationComponent implements OnChanges {

  @Input() tokenNetwork: TokenNetwork;
  @Input() topChannels: boolean;
  @Input() expandedAreas: ExpandedAreas;
  @Output() expandedChanged: EventEmitter<ExpandedAreas> = new EventEmitter();

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

  channelsExpanded(expanded: boolean) {
    this._channelsByDepositExpanded = expanded;
    if (!this.media$.isActive('lt-md')) {
      this._topParticipantsByChannelExpanded = expanded;
    }

    this.emitEvent();
  }

  participantsExpanded(expanded: boolean) {
    this._topParticipantsByChannelExpanded = expanded;
    if (!this.media$.isActive('lt-md')) {
      this._channelsByDepositExpanded = expanded;
    }
    this.emitEvent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.hasOwnProperty('expandedAreas')) {
      return;
    }

    const expandedAreas: ExpandedAreas | undefined = changes['expandedAreas'].currentValue;

    if (!expandedAreas) {
      return;
    }

    this._topParticipantsByChannelExpanded = expandedAreas.participantsByChannel;
    this._channelsByDepositExpanded = expandedAreas.channelsByDeposit;
  }

  private emitEvent() {
    this.expandedChanged.emit({
      channelsByDeposit: this._channelsByDepositExpanded,
      participantsByChannel: this._topParticipantsByChannelExpanded
    });
  }
}
