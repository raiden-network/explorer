import { AfterViewChecked, ChangeDetectorRef, Component } from '@angular/core';
import { NetMetricsService } from '../../services/net.metrics/net.metrics.service';
import { Observable } from 'rxjs';
import { RaidenNetworkMetrics, TokenNetwork } from '../../models/TokenNetwork';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { SharedService } from '../../services/net.metrics/shared.service';
import { Message } from '../../services/net.metrics/message';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
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
export class HomeComponent implements AfterViewChecked {
  metrics$: Observable<RaidenNetworkMetrics>;
  messages$: Observable<Message>;

  constructor(
    private netMetricsService: NetMetricsService,
    private sharedService: SharedService,
    private config: NetMetricsConfig,
    private cd: ChangeDetectorRef
  ) {
    this.metrics$ = netMetricsService.metrics$.pipe(tap(() => (this._loading = false)));
    this.messages$ = sharedService.messages;
  }

  private _currentNetwork?: TokenNetwork;

  public get currentNetwork(): TokenNetwork | undefined {
    return this._currentNetwork;
  }

  private _loading = true;

  public get loading(): boolean {
    return this._loading;
  }

  public get network(): string {
    return this.config.configuration.network_name;
  }

  ngAfterViewChecked(): void {
    this.cd.detectChanges();
  }

  selectedNetwork(tokenNetwork: TokenNetwork) {
    this._currentNetwork = tokenNetwork;
  }
}
