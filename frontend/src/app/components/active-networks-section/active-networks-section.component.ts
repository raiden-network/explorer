import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { RaidenNetworkMetrics, TokenNetwork } from '../../models/TokenNetwork';
import { FormControl } from '@angular/forms';
import { flatMap, map, pairwise, startWith } from 'rxjs/operators';
import { Observable, of, Subscription } from 'rxjs';
import { Token } from '../../models/NMNetwork';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { ActiveNetworkSharedService } from '../../services/active-network-shared.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterAnimations } from './router.animations';
import { TokenNetworkRoutingService } from '../../services/token-network-routing.service';

@Component({
  selector: 'app-active-networks-section',
  templateUrl: './active-networks-section.component.html',
  styleUrls: ['./active-networks-section.component.css'],
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
    ]),
    RouterAnimations.routerSlide
  ]
})
export class ActiveNetworksSectionComponent implements OnInit, OnChanges, OnDestroy {
  @Input() metrics: RaidenNetworkMetrics;
  @Output() selectionChange: EventEmitter<TokenNetwork> = new EventEmitter();
  readonly searchControl = new FormControl();
  filteredOptions$: Observable<TokenNetwork[]>;
  private subscription: Subscription;
  private networksChange$: Observable<number>;

  constructor(
    private sharedService: ActiveNetworkSharedService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    networkRoutingService: TokenNetworkRoutingService
  ) {
    this.networksChange$ = networkRoutingService.networkChange$;
    this.setupRouting();
  }

  private _routeTrigger$: Observable<object>;

  public get routeTrigger$(): Observable<object> {
    return this._routeTrigger$;
  }

  public get showNavigation(): boolean {
    const control = this.searchControl;
    const isObject = control.value && typeof control.value === 'object';
    return this.sharedService.numberOfNetworks > 1 && !isObject;
  }

  setupRouting() {
    this._routeTrigger$ = this.networksChange$.pipe(
      startWith(0),
      pairwise(),
      map(([prev, curr]) => ({
        value: curr,
        params: prev > curr ? RouterAnimations.rightOffsets : RouterAnimations.leftOffsets
      }))
    );
  }

  ngOnInit() {
    this.filteredOptions$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      flatMap(value => this._filter(value))
    );

    const sharedService = this.sharedService;

    this.subscription = sharedService.tokenNotFound.subscribe(notFound => {
      if (notFound) {
        this.navigateToToken(this.sharedService.firstTokenAddress());
      }
    });

    this.subscription.add(
      sharedService.tokenNetworkSelected.subscribe(tokenNetwork => {
        this.selectionChange.emit(tokenNetwork);
      })
    );

    if (this.activatedRoute.children.length === 0) {
      this.navigateToToken(sharedService.firstTokenAddress());
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.hasOwnProperty('metrics')) {
      return;
    }

    this.sharedService.update(changes['metrics'].currentValue.tokenNetworks);
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

  networkSelected(tokenNetwork?: TokenNetwork) {
    if (tokenNetwork) {
      this.navigateToToken(tokenNetwork.token.address);
    }
  }

  clearFilter() {
    this.searchControl.setValue(null);
    this.navigateToToken(this.sharedService.firstTokenAddress());
  }

  previous() {
    this.navigateToToken(this.sharedService.previousTokenAddress());
  }

  next() {
    this.navigateToToken(this.sharedService.nextTokenAddress());
  }

  private navigateToToken(tokenAddress) {
    if (tokenAddress) {
      this.router.navigate([`tokens/${tokenAddress}`]);
    }
  }

  private _filter(value?: string): Observable<TokenNetwork[]> {
    const networks$ = of(this.sharedService.allNetworks);
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
