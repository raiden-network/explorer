import { animate, group, query, style, transition, trigger } from '@angular/animations';

export class RouterAnimations {
  static routerSlide = trigger('routerTransition', [
    transition('* <=> *', [
      group([
        query(':enter', [
          style({transform: 'translateX({{enterStart}}%)'}),
          animate('0.3s ease-in-out', style({transform: 'translateX({{enterEnd}}%)'}))
        ], {optional: true}),
        query(':leave', [
          style({transform: 'translateX({{leaveStart}}%)'}),
          animate('0.3s ease-in-out', style({transform: 'translateX({{leaveEnd}}%)'}))
        ], {optional: true})
      ])
    ])
  ]);

  static rightOffsets = {
    enterStart: -100,
    enterEnd: 0,
    leaveStart: -100,
    leaveEnd: 0
  };

  static leftOffsets = {
    enterStart: 100,
    enterEnd: 0,
    leaveStart: -100,
    leaveEnd: -200
  };
}
