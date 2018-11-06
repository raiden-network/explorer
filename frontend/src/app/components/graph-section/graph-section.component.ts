import { Component, Input, OnInit } from '@angular/core';
import { NetworkGraph } from '../../models/NetworkGraph';

@Component({
  selector: 'app-graph-section',
  templateUrl: './graph-section.component.html',
  styleUrls: ['./graph-section.component.css']
})
export class GraphSectionComponent implements OnInit {

  @Input() graph: NetworkGraph;

  constructor() {
  }

  ngOnInit() {
  }

}
