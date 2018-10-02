import { Component, HostListener, OnInit } from '@angular/core';
import { NetMetricsService } from '../../services/net.metrics/net.metrics.service';
import { Observable } from 'rxjs';
import { RaidenNetworkMetrics, TokenNetwork } from '../../models/TokenNetwork';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { SharedService } from '../../services/net.metrics/shared.service';
import { Message } from '../../services/net.metrics/message';
import { tap } from 'rxjs/operators';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';

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
export class HomeComponent implements OnInit {

  metrics$: Observable<RaidenNetworkMetrics>;
  messages$: Observable<Message>;
  private _scrollPosition = 0;

  constructor(
    private netMetricsService: NetMetricsService,
    private sharedService: SharedService,
    private config: NetMetricsConfig
  ) {
    this.metrics$ = netMetricsService.metrics$.pipe(tap(() => this._loading = false));
    this.messages$ = sharedService.messages;
  }

  private _loading = true;

  public get loading(): boolean {
    return this._loading;
  }

  private _graphVisible = false;

  public get graphVisible(): boolean {
    return this._graphVisible;
  }

  private _displayDots = false;

  public get displayDots(): boolean {
    return this._displayDots;
  }

  public get main(): boolean {
    return this.config.main;
  }

  ngOnInit() {
    this.checkIfShouldShowDots();
  }

  @HostListener('window:scroll', ['$event'])
  onListenerTriggered(event: UIEvent): void {
    const element = document.querySelector('.graph-container');
    const bounds = element.getBoundingClientRect();

    let offset = 0.1 * bounds.top;
    if ((document.body.getBoundingClientRect()).top > this._scrollPosition) {
      offset *= -1;
    } else {
      offset *= 1;
    }

    // saves the new position for iteration.
    this._scrollPosition = (document.body.getBoundingClientRect()).top;

    this._graphVisible = (window.scrollY - bounds.top) - offset > 0;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkIfShouldShowDots();
  }

  // noinspection JSMethodCanBeStatic
  public scrollToA(loc: string) {
    document.getElementById(loc).scrollIntoView({behavior: 'smooth'});
  }

  //noinspection JSMethodCanBeStatic
  trackByFn(network: TokenNetwork) {
    return network.token;
  }

  //noinspection JSMethodCanBeStatic
  getVisible(tokenNetworks: TokenNetwork[], current: number) {
    let start: number;
    let end: number;
    if (current > 0) {
      start = current - 1;
    } else {
      start = 0;
    }

    if (current === tokenNetworks.length) {
      end = current;
    } else {
      end = current + 2;
    }

    return tokenNetworks.slice(start, end);
  }

  private checkIfShouldShowDots() {
    let height = window.innerHeight;
    if (screen.height < height) {
      height = screen.height;
    }

    this._displayDots = height >= 960;
  }
}
