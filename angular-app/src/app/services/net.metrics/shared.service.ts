import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { scan } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';
import { Message } from './message';

@Injectable()
export class SharedService {

  public httpTimeout: number;
  private _messages = new Subject<Message>();

  private requestsSubject = new BehaviorSubject<number>(0);
  public readonly requests$ = this.requestsSubject.asObservable().pipe(
    scan((acc, value) => Math.max(acc + value, 0), 0),
  );

  requestStarted(req?: HttpRequest<any>) {
    this.requestsSubject.next(+1);
  }

  requestFinished(req?: HttpRequest<any>) {
    this.requestsSubject.next(-1);
  }

  public post(message: Message) {
    this._messages.next(message);
  }

  public get messages(): Observable<Message> {
    return this._messages;
  }

}
