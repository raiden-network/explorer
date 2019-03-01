import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { throttle } from 'rxjs/operators';

@Directive({
  selector: '[appDebounceClick]'
})
export class DebounceClickDirective implements OnInit, OnDestroy {
  @Input() timePeriod = 500;
  @Output() debouncedClick = new EventEmitter();

  private clicks = new Subject();
  private subscription: Subscription;

  constructor() {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.clicks
      .pipe(throttle(() => interval(this.timePeriod)))
      .subscribe(value => this.debouncedClick.emit(value));
  }

  @HostListener('click', ['$event'])
  clickEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }
}
