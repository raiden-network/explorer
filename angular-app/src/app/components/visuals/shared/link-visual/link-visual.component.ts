import { Link } from '../../../../services/d3';
import { Component, Input } from '@angular/core';

@Component({
  selector: '[linkVisual]',
  template: `
    <svg:line
      class="link"
      [attr.x1]="linkVisual.source.x"
      [attr.y1]="linkVisual.source.y"
      [attr.x2]="linkVisual.target.x"
      [attr.y2]="linkVisual.target.y"
    ></svg:line>
  `,
  styleUrls: ['./link-visual.component.css']
})
export class LinkVisualComponent {
  @Input() linkVisual: Link;
}

