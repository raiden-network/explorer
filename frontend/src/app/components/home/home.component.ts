import { Component, HostListener, OnInit } from '@angular/core';
import { NetMetricsService } from '../../services/net.metrics/net.metrics.service';
import { Observable } from 'rxjs';
import { RaidenNetworkMetrics, TokenNetwork } from '../../models/TokenNetwork';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { SharedService } from '../../services/net.metrics/shared.service';
import { Message } from '../../services/net.metrics/message';
import { flatMap, map, startWith, tap } from 'rxjs/operators';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';
import { FormControl } from '@angular/forms';
import { Token } from '../../models/NMNetwork';
import { OverlayContainer } from '@angular/cdk/overlay';

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

  readonly searchControl = new FormControl();

  filteredOptions$: Observable<TokenNetwork[]>;
  private _scrollPosition = 0;
  private _allNetworks: TokenNetwork[] = [];

  constructor(
    private netMetricsService: NetMetricsService,
    private sharedService: SharedService,
    private config: NetMetricsConfig,
    private overlayContainer: OverlayContainer
  ) {
    this.metrics$ = netMetricsService.metrics$.pipe(tap((metrics) => {
      this._allNetworks = HomeComponent.onlyActive(metrics.tokenNetworks);
      this._loading = false;

      if (this._visibleNetworks.length === 0) {
        this.updateVisible(0);
      }
    }));
    this.messages$ = sharedService.messages;
    this.filteredOptions$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      tap(x => {
        if (x === '') {
          this.updateVisible(0);
        }
      }),
      flatMap(value => this._filter(value))
    );
  }

  private _currentNetwork?: TokenNetwork;

  public get currentNetwork(): TokenNetwork | undefined {
    return this._currentNetwork;
  }

  private _visibleNetworks: TokenNetwork[] = [];

  public get visibleNetworks(): TokenNetwork[] {
    return this._visibleNetworks;
  }

  private _numberOfNetworks = 0;

  public get numberOfNetworks(): number {
    return this._numberOfNetworks;
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

  private static onlyActive(networks: TokenNetwork[]): TokenNetwork[] {
    return networks.filter(value => value.openedChannels > 0);
  }

  ngOnInit() {
    this.checkIfShouldShowDots();
  }

  @HostListener('window:scroll', ['$event'])
  onListenerTriggered(): void {
    const element = document.querySelector('.network-section');
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

  // noinspection JSMethodCanBeStatic
  displayFn(network: TokenNetwork | null): string {
    if (network === null || network === undefined) {
      return '';
    }
    const token = network.token;
    const tokenDisplay: string[] = [];

    if (token.symbol) {
      tokenDisplay.push(`[${token.symbol}]`);
    }

    if (token.name) {
      tokenDisplay.push(token.name);
    }

    tokenDisplay.push(token.address);

    return tokenDisplay.join(' ');
  }

  networkSelected(value?: TokenNetwork) {
    if (value) {
      const selectedToken = value.token;
      const network = this._allNetworks.find(currentNetwork => currentNetwork.token.address === selectedToken.address);
      if (network) {
        this._numberOfNetworks = 1;
        this._currentNetwork = network;
        this._visibleNetworks = [network];
      } else {
      }
    } else {
      this.updateVisible(0);
    }
  }

  clearFilter() {
    this.searchControl.setValue(null);
    this.updateVisible(0);
  }

  updateVisible(current: number) {
    this._numberOfNetworks = this._allNetworks.length;

    let start: number;
    let end: number;
    if (current > 0) {
      start = current - 1;
    } else {
      start = 0;
    }

    this._currentNetwork = this._allNetworks[current];

    if (current === this._allNetworks.length) {
      end = current;
    } else {
      end = current + 2;
    }

    this._visibleNetworks = this._allNetworks.slice(start, end);
  }

  private checkIfShouldShowDots() {
    let height = window.innerHeight;
    if (screen.height < height) {
      height = screen.height;
    }

    this._displayDots = height >= 960;
  }

  private _filter(value?: string): Observable<TokenNetwork[]> {
    const networks$ = this.metrics$.pipe(map(metrics => HomeComponent.onlyActive(metrics.tokenNetworks)));
    if (!value || typeof value !== 'string') {
      return networks$;
    }

    const keyword = value.toLowerCase();

    function matches(token: Token): boolean {
      const name = token.name.toLocaleLowerCase();
      const symbol = token.symbol.toLocaleLowerCase();
      const address = token.address.toLocaleLowerCase();
      return name.startsWith(keyword) || symbol.startsWith(keyword) || address.startsWith(keyword);
    }

    return networks$.pipe(map(networks => networks.filter(network => matches(network.token))));
  }

  onOpened() {
    this.overlayContainer.getContainerElement().classList.add('dark-theme');
  }

  onClosed() {
    this.overlayContainer.getContainerElement().classList.remove('dark-theme');
  }
}
