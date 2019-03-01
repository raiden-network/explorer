import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { NodeInfo } from '../../models/node-info';
import { NetMetricsConfig } from '../../services/net.metrics/net.metrics.config';

@Component({
  selector: 'app-active-channel-list',
  templateUrl: './open-channel-list.component.html',
  styleUrls: ['./open-channel-list.component.css']
})
export class OpenChannelListComponent implements OnInit {
  @Input() height: number;
  @Input() info: NodeInfo;
  @Output() closed: EventEmitter<boolean> = new EventEmitter();

  constructor(private config: NetMetricsConfig) {}

  private _listHeight: number;

  public get listHeight(): number {
    return this._listHeight;
  }

  ngOnInit() {
    this.updateListHeight();
  }

  public etherscanUrl(address: string): string {
    return `${this.config.configuration.etherscan_base_url}${address}`;
  }

  private updateListHeight() {
    const element = document.querySelector('.channels-header');
    const bounds = element.getBoundingClientRect();
    this._listHeight = this.height - (bounds.height + 23);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateListHeight();
  }
}
