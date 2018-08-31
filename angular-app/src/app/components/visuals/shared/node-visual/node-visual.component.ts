import { Component, Input } from '@angular/core';
import { Node } from '../../../../services/d3';

@Component({
  selector: '[nodeVisual]',
  template: `
    <svg:g [attr.transform]="'translate(' + nodeVisual.x + ',' + nodeVisual.y + ')'">
      <svg:circle
        class="node"
        [attr.fill]="nodeVisual.color"
        cx="0"
        cy="0"
        [attr.r]="10">
      </svg:circle>
      <svg:text class="node-name">
        {{nodeVisual.linkCount}}
      </svg:text>
      <svg:title>
        <svg:text>
          {{nodeVisual.id}}
        </svg:text>
      </svg:title>
    </svg:g>
  `,
  styleUrls: ['./node-visual.component.css']
})
export class NodeVisualComponent {
  @Input() nodeVisual: Node;
}
