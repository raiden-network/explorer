import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { RaidenNetworkMetrics, TokenNetwork } from '../../models/TokenNetwork';
import { FormControl } from '@angular/forms';
import { flatMap, map, startWith, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Token } from '../../models/NMNetwork';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-active-networks-section',
  templateUrl: './active-networks-section.component.html',
  styleUrls: ['./active-networks-section.component.css'],
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
export class ActiveNetworksSectionComponent implements OnInit, OnChanges {

  @Input() metrics: RaidenNetworkMetrics;
  @Output() selectionChange: EventEmitter<TokenNetwork> = new EventEmitter();
  readonly searchControl = new FormControl();
  filteredOptions$: Observable<TokenNetwork[]>;
  private selectedNetwork: TokenNetwork;
  private _allNetworks: TokenNetwork[];

  constructor() {

  }

  private _visibleNetworks: TokenNetwork[] = [];

  public get visibleNetworks(): TokenNetwork[] {
    return this._visibleNetworks;
  }

  private _isExpanded: boolean;

  public get isExpanded(): boolean {
    return this._isExpanded;
  }

  private _numberOfNetworks = 0;

  public get numberOfNetworks(): number {
    return this._numberOfNetworks;
  }

  private static onlyActive(networks: TokenNetwork[]): TokenNetwork[] {
    return networks.filter(value => value.openedChannels > 0);
  }

  ngOnInit() {
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

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.hasOwnProperty('metrics')) {
      return;
    }

    this.update(changes['metrics'].currentValue);
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

  //noinspection JSMethodCanBeStatic
  trackByFn(network: TokenNetwork) {
    return network.token;
  }

  networkSelected(value?: TokenNetwork) {
    if (value) {
      const selectedToken = value.token;
      const network = this._allNetworks.find(currentNetwork => currentNetwork.token.address === selectedToken.address);
      if (network) {
        this._numberOfNetworks = 1;
        this.selectedNetwork = network;
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

    this.selectedNetwork = this._allNetworks[current];
    this.selectionChange.emit(this.selectedNetwork);

    if (current === this._allNetworks.length) {
      end = current;
    } else {
      end = current + 2;
    }

    this._visibleNetworks = this._allNetworks.slice(start, end);
  }

  setExpanded(expanded: boolean) {
    this._isExpanded = expanded;
  }

  private update(metrics: RaidenNetworkMetrics) {
    if (metrics.tokenNetworks.length === 1) {
      this._allNetworks = metrics.tokenNetworks;
      this.updateVisible(0);
    } else {
      this._allNetworks = ActiveNetworksSectionComponent.onlyActive(metrics.tokenNetworks);
    }

    const isTheSame = (value: TokenNetwork, other: TokenNetwork) => value.token.address === other.token.address;

    if (this.selectedNetwork) {
      const tokenIndex = this._allNetworks.findIndex(value => isTheSame(value, this.selectedNetwork));

      if (tokenIndex >= 0) {
        this.selectedNetwork = this._allNetworks[tokenIndex];
        this.selectionChange.emit(this.selectedNetwork);
      }

      const visibleIndex = this._visibleNetworks.findIndex(value => isTheSame(value, this.selectedNetwork));
      if (visibleIndex >= 0) {
        this._visibleNetworks[visibleIndex] = this.selectedNetwork;
      }
    }
  }

  private _filter(value?: string): Observable<TokenNetwork[]> {
    const networks$ = of(this._allNetworks);
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
}
