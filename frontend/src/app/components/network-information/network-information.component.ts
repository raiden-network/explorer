import { Component, OnDestroy, OnInit } from '@angular/core';
import { TokenNetwork } from '../../models/TokenNetwork';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';
import { ObservableMedia } from '@angular/flex-layout';
import { ActiveNetworkSharedService } from '../../services/active-network-shared.service';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TokenNetworkRoutingService } from '../../services/token-network-routing.service';

@Component({
  selector: 'app-network-information',
  templateUrl: './network-information.component.html',
  styleUrls: ['./network-information.component.css']
})
export class NetworkInformationComponent implements OnInit, OnDestroy {

  private subscription: Subscription;

  constructor(
    private config: NetMetricsConfig,
    private sharedService: ActiveNetworkSharedService,
    private route: ActivatedRoute,
    public readonly media$: ObservableMedia,
    private routingService: TokenNetworkRoutingService
  ) {
  }

  public get topParticipantsByChannelExpanded(): boolean {
    return this.sharedService.topParticipantsByChannelExpanded;
  }

  public get channelsByDepositExpanded(): boolean {
    return this.sharedService.channelsByDepositExpanded;
  }

  public get tokenNetwork(): TokenNetwork {
    return this.sharedService.tokenNetwork;
  }

  public etherscanUrl(address: string): string {
    return `${this.config.configuration.etherscan_base_url}${address}`;
  }

  channelsExpanded(expanded: boolean) {
    this.sharedService.channelsByDepositExpanded = expanded;
    if (!this.media$.isActive('lt-md')) {
      this.sharedService.topParticipantsByChannelExpanded = expanded;
    }
  }

  participantsExpanded(expanded: boolean) {
    this.sharedService.topParticipantsByChannelExpanded = expanded;
    if (!this.media$.isActive('lt-md')) {
      this.sharedService.channelsByDepositExpanded = expanded;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.route.params.pipe(map(params => params.token_address))
      .subscribe(address => {
        const index = +this.sharedService.loadTokenNetworkInformation(address);
        this.routingService.changed(index);
      });
  }
}
