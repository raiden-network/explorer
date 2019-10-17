import { Component, OnInit, Renderer2, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Title, DomSanitizer } from '@angular/platform-browser';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MediaObserver } from '@angular/flex-layout';
import { MatIconRegistry } from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('flyInOut', [
      state('in', style({ transform: 'translateY(0)' })),
      transition('void => *', [
        style({
          transform: 'translateY(-100%)'
        }),
        animate('0.2s ease-in')
      ]),
      transition('* => void', [
        animate(
          '0.2s ease-out',
          style({
            transform: 'translateY(-100%)'
          })
        )
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  @ViewChild('topnav')
  public topnav: ElementRef;

  menuOpen = false;

  constructor(
    private titleService: Title,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private mediaObserver: MediaObserver
  ) {
    this.titleService.setTitle('Raiden Explorer');
    this.matIconRegistry.addSvgIcon(
      'burger',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/burger.svg')
    );
  }

  ngOnInit() {}

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (!this.topnav.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }
  }

  isMobile(): boolean {
    return this.mediaObserver.isActive('lt-md');
  }
}
