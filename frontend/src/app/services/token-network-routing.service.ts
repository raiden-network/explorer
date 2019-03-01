import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenNetworkRoutingService {
  constructor() {}

  private _networkChange$ = new BehaviorSubject(0);

  public get networkChange$(): Observable<number> {
    return this._networkChange$;
  }

  changed(index: number) {
    this._networkChange$.next(index);
  }
}
