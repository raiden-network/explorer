import { animate, group, query, style, transition, trigger } from '@angular/animations';

export class RouterAnimations {
  static routerSlide = trigger('routerTransition', [
    transition('* <=> *', [
      group([
        query(
          ':enter',
          [
            style({ transform: 'translateX({{enterStart}}%)' }),
            animate('0.3s ease-in-out', style({ transform: 'translateX({{enterEnd}}%)' }))
          ],
          { optional: true }
        ),
        query(
          ':leave',
          [
            style({ transform: 'translateX({{leaveStart}}%)' }),
            animate('0.3s ease-in-out', style({ transform: 'translateX({{leaveEnd}}%)' }))
          ],
          { optional: true }
        )
      ])
    ])
  ]);

  static rightOffsets = {
    enterStart: -200,
    enterEnd: -100,
    leaveStart: 0,
    leaveEnd: 100
  };

  static leftOffsets = {
    enterStart: 0,
    enterEnd: -100,
    leaveStart: 0,
    leaveEnd: -100
  };
}
