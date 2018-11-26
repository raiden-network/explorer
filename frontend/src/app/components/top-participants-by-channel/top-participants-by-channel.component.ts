import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Participant, TokenNetwork } from '../../models/TokenNetwork';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';

@Component({
  selector: 'app-top-participants-by-channel',
  templateUrl: './top-participants-by-channel.component.html',
  styleUrls: ['./top-participants-by-channel.component.scss']
})
export class TopParticipantsByChannelComponent implements OnInit {

  @Input() tokenNetwork: TokenNetwork;
  @Input() isExpanded: boolean;
  @Output() expandedChanged: EventEmitter<boolean> = new EventEmitter();

  constructor(private config: NetMetricsConfig) { }

  ngOnInit() {
  }

  toggleExpanded(): void {
    this.expandedChanged.emit(!this.isExpanded);
  }

  public etherscanUrl(address: string): string {
    return `${this.config.configuration.etherscan_base_url}${address}`;
  }

  //noinspection JSMethodCanBeStatic
  trackByParticipant(participant: Participant): string {
    return participant.address;
  }

}
