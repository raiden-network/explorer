import { Component, Input } from '@angular/core';
import {Node} from '../../../../services/d3';

@Component({
  selector: '[nodeVisual]',
  template: `
    <svg:g [attr.transform]="'translate(' + node.x + ',' + node.y + ')'">
      <svg:circle
        class="node"
        [attr.fill]="node.color"
        cx="0"
        cy="0"
        [attr.r]="node.r">
      </svg:circle>
      <svg:text class="node-name">
        {{node.linkCount}}
      </svg:text>
      <svg:title>
        <svg:text>
          {{node.id}}
        </svg:text>
      </svg:title>
    </svg:g>
  `,
  styleUrls: ['./node-visual.component.css']
})
export class NodeVisualComponent {
  @Input('nodeVisual') node: Node;
}
