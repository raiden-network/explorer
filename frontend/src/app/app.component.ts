import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Title, DomSanitizer } from '@angular/platform-browser';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MediaObserver } from '@angular/flex-layout';
import { MatIconRegistry } from '@angular/material/icon';
import { MatomoTracker } from 'ngx-matomo';
import { NetMetricsConfig } from './services/net.metrics/net.metrics.config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('flyInOut', [
      state('in', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', [
        style({
          transform: 'translateY(-100%)',
          opacity: 0
        }),
        animate('0.2s ease-in')
      ]),
      transition('* => void', [
        animate(
          '0.2s ease-out',
          style({
            transform: 'translateY(-100%)',
            opacity: 0
          })
        )
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  @ViewChild('topnav', { static: true })
  public topnav: ElementRef;

  menuOpen = false;

  constructor(
    private titleService: Title,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private mediaObserver: MediaObserver,
    private matomoTracker: MatomoTracker,
    private config: NetMetricsConfig
  ) {
    this.titleService.setTitle('Raiden Explorer');
    this.matomoTracker.setDocumentTitle(
      `Raiden Explorer ${this.config.configuration.network_name}`
    );
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
