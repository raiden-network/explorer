import { Component, Input, OnInit } from '@angular/core';
import { TokenNetwork } from '../../models/TokenNetwork';

@Component({
  selector: 'app-network-averages',
  templateUrl: './network-averages.component.html',
  styleUrls: ['./network-averages.component.scss']
})
export class NetworkAveragesComponent implements OnInit {
  @Input() tokenNetwork: TokenNetwork;

  constructor() {}

  ngOnInit() {}
}
