import { Observable, of } from 'rxjs';

import { finalize, switchMap, tap, timeout } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';

import { SharedService } from './shared.service';

@Injectable()
export class NetMetricsInterceptor implements HttpInterceptor {
  constructor(private sharedService: SharedService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let obs = of(true).pipe(
      tap(() => this.sharedService.requestStarted(req)),
      switchMap(() => next.handle(req))
    );
    if (this.sharedService.httpTimeout) {
      obs = obs.pipe(timeout(this.sharedService.httpTimeout));
    }
    return obs.pipe(finalize(() => this.sharedService.requestFinished(req)));
  }
}
