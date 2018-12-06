import { Injectable } from '@angular/core';
import { TokenNetwork } from '../models/TokenNetwork';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActiveNetworkSharedService {

  constructor() {
  }

  private _tokenNetworkSelected: BehaviorSubject<TokenNetwork> = new BehaviorSubject(this.tokenNetwork);

  public get tokenNetworkSelected(): Observable<TokenNetwork> {
    return this._tokenNetworkSelected;
  }

  private _tokenNotFound: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public get tokenNotFound(): Observable<boolean> {
    return this._tokenNotFound;
  }

  private _tokenNetwork: TokenNetwork;

  public get tokenNetwork(): TokenNetwork {
    return this._tokenNetwork;
  }

  public set tokenNetwork(tokenNetwork: TokenNetwork) {
    if (tokenNetwork) {
      this._tokenNetwork = tokenNetwork;
      this._tokenNetworkSelected.next(tokenNetwork);
    }
  }

  private _allNetworks: TokenNetwork[];

  get allNetworks(): TokenNetwork[] {
    return this._allNetworks;
  }

  private _channelsByDepositExpanded: boolean;

  public get channelsByDepositExpanded(): boolean {
    return this._channelsByDepositExpanded;
  }

  public set channelsByDepositExpanded(value: boolean) {
    this._channelsByDepositExpanded = value;
  }

  private _topParticipantsByChannelExpanded: boolean;

  public get topParticipantsByChannelExpanded(): boolean {
    return this._topParticipantsByChannelExpanded;
  }

  public set topParticipantsByChannelExpanded(value: boolean) {
    this._topParticipantsByChannelExpanded = value;
  }

  private _numberOfNetworks = 0;

  public get numberOfNetworks(): number {
    return this._numberOfNetworks;
  }

  private static onlyActive(networks: TokenNetwork[]): TokenNetwork[] {
    return networks.filter(value => value.openedChannels > 0);
  }

  public previousTokenAddress(): string {
    const allNetworks = this._allNetworks;
    const tokenNetwork = this.tokenNetwork;
    const index = allNetworks.findIndex(value => value.token.address === tokenNetwork.token.address);

    if (index > 0) {
      const previousNetwork = allNetworks[index - 1];
      this.tokenNetwork = previousNetwork;
      return previousNetwork.token.address;
    } else {
      return null;
    }
  }

  public nextTokenAddress(): string {
    const allNetworks = this._allNetworks;
    const tokenNetwork = this.tokenNetwork;
    const index = allNetworks.findIndex(value => value.token.address === tokenNetwork.token.address);

    if (index < allNetworks.length - 1) {
      const nextToken = allNetworks[index + 1];
      this.tokenNetwork = nextToken;
      return nextToken.token.address;
    } else {
      return null;
    }
  }

  loadTokenNetworkInformation(address: string): number {
    const allNetworks = this._allNetworks;

    const index = allNetworks.findIndex(value => value.token.address === address);

    if (index >= 0) {
      this.tokenNetwork = allNetworks[index];
    } else {
      this._tokenNotFound.next(true);
    }

    return index;
  }

  update(tokenNetworks: TokenNetwork[]) {
    if (tokenNetworks.length === 1) {
      this._allNetworks = tokenNetworks;
    } else {
      this._allNetworks = ActiveNetworkSharedService.onlyActive(tokenNetworks);
    }

    this._numberOfNetworks = this._allNetworks.length;

    const isTheSame = (value: TokenNetwork, other: TokenNetwork) => value.token.address === other.token.address;

    if (this.tokenNetwork) {
      const tokenIndex = this._allNetworks.findIndex(value => isTheSame(value, this.tokenNetwork));

      if (tokenIndex >= 0) {
        this.tokenNetwork = this._allNetworks[tokenIndex];
      }
    }
  }

  firstTokenAddress(): string {
    return this._allNetworks[0].token.address;
  }
}
