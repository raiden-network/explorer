import { BehaviorSubject } from 'rxjs';
import { scan } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';

@Injectable()
export class SharedService {

    public httpTimeout: number;

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

}
