import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { ForceDirectedGraph, Node } from '../models';
import { D3Service } from '../d3.service';

@Directive({
  selector: '[draggableNode]'
})
export class DraggableDirective implements OnInit {
  @Input() draggableNode: Node;
  @Input() draggableInGraph: ForceDirectedGraph;

  constructor(private d3Service: D3Service, private _element: ElementRef) {
  }

  ngOnInit() {
    this.d3Service.applyDraggableBehaviour(this._element.nativeElement, this.draggableNode, this.draggableInGraph);
  }
}
