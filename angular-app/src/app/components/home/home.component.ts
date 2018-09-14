import { Component } from '@angular/core';
import { NetMetricsService } from '../../services/net.metrics/net.metrics.service';
import { Observable } from 'rxjs';
import { RaidenNetworkMetrics, TokenNetwork } from '../../models/TokenNetwork';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { SharedService } from '../../services/net.metrics/shared.service';
import { Message } from '../../services/net.metrics/message';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    trigger('flyInOut', [
      state('in', style({transform: 'translateX(0)'})),
      transition('void => *', [
        animate(300, keyframes([
          style({opacity: 0, transform: 'translateX(-100%)', offset: 0}),
          style({opacity: 1, transform: 'translateX(15px)', offset: 0.3}),
          style({opacity: 1, transform: 'translateX(0)', offset: 1.0})
        ]))
      ]),
      transition('* => void', [
        animate(300, keyframes([
          style({opacity: 1, transform: 'translateX(0)', offset: 0}),
          style({opacity: 1, transform: 'translateX(-15px)', offset: 0.7}),
          style({opacity: 0, transform: 'translateX(100%)', offset: 1.0})
        ]))
      ])
    ])
  ]
})
export class HomeComponent {

  refreshToggle: boolean;
  metrics$: Observable<RaidenNetworkMetrics>;
  messages$: Observable<Message>;

  constructor(private netMetricsService: NetMetricsService, private sharedService: SharedService) {
    this.metrics$ = netMetricsService.metrics$;
    this.messages$ = sharedService.messages;
  }

  // noinspection JSMethodCanBeStatic
  public scrollToA(loc: string) {
    document.getElementById(loc).scrollIntoView();
  }

  //noinspection JSMethodCanBeStatic
  trackByFn(network: TokenNetwork) {
    return network.networkAddress;
  }
}
