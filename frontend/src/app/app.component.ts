import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('flyInOut', [
      state('in', style({ opacity: 1, transform: 'translateX(0)' })),
      transition('void => *', [
        style({
          opacity: 0,
          transform: 'translateX(-100%)'
        }),
        animate('0.2s ease-in')
      ]),
      transition('* => void', [
        animate(
          '0.2s 0.1s ease-out',
          style({
            opacity: 0,
            transform: 'translateX(100%)'
          })
        )
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  public constructor(private titleService: Title) {
    titleService.setTitle('Raiden Explorer');
  }

  ngOnInit() {}
}
