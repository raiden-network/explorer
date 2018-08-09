import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {NetMetricsService} from './services/net.metrics/net.metrics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Raiden Network';

  public constructor(private titleService: Title, netMetricsService: NetMetricsService) {}

  ngOnInit() {

  }

  public setTitle(title: string) {
    this.titleService.setTitle(title);
  }

}
