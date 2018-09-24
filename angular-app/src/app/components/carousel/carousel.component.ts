import {
  AfterViewInit,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  HostListener,
  Input,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { animate, AnimationBuilder, AnimationFactory, AnimationPlayer, style } from '@angular/animations';
import { CarouselItemDirective } from '../../directives/carousel-item.directive';

@Directive({
  selector: '.carousel-item'
})
export class CarouselItemElementDirective {
}

@Component({
  selector: 'carousel',
  exportAs: 'carousel',
  templateUrl: 'carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements AfterViewInit {
  @ContentChildren(CarouselItemDirective) items: QueryList<CarouselItemDirective>;
  @Input() timing = '250ms ease-in';
  @Input() showControls = true;
  carouselWrapperStyle = {};
  @ViewChildren(CarouselItemElementDirective, {read: ElementRef}) private itemsElements: QueryList<ElementRef>;
  @ViewChild('carousel') private carousel: ElementRef;
  private player: AnimationPlayer;
  private itemWidth: number;
  private currentSlide = 0;

  public get width(): number {
    return this.itemWidth;
  }

  constructor(private builder: AnimationBuilder) {
  }

  showNext() {
    if (this.currentSlide + 1 === this.items.length) {
      return;
    }

    this.currentSlide = (this.currentSlide + 1) % this.items.length;
    const offset = this.currentSlide * this.itemWidth;
    const myAnimation: AnimationFactory = this.buildAnimation(offset);
    this.player = myAnimation.create(this.carousel.nativeElement);
    this.player.play();
  }

  showPrev() {
    if (this.currentSlide === 0) {
      return;
    }

    this.currentSlide = ((this.currentSlide - 1) + this.items.length) % this.items.length;
    const offset = this.currentSlide * this.itemWidth;

    const myAnimation: AnimationFactory = this.buildAnimation(offset);
    this.player = myAnimation.create(this.carousel.nativeElement);
    this.player.play();
  }


  private goToCurrent() {
    this.currentSlide = (this.currentSlide + this.items.length) % this.items.length;
    const offset = this.currentSlide * this.itemWidth;

    const myAnimation: AnimationFactory = this.buildAnimation(offset);
    this.player = myAnimation.create(this.carousel.nativeElement);
    this.player.play();
  }

  ngAfterViewInit() {
    // For some reason only here I need to add setTimeout, in my local env it's working without this.
    this.updateItemWidth();
  }

  private updateItemWidth() {
    setTimeout(() => {
      const itemWidth = this.itemsElements.first.nativeElement.getBoundingClientRect().width;
      const windowWidth = window.innerWidth;

      if (windowWidth >= 960 && itemWidth <= 400) {
        this.itemWidth = 814.8;
      } else if (windowWidth - itemWidth < 74) {
        this.itemWidth = itemWidth - 74;
      } else {
        this.itemWidth = itemWidth;
      }

      console.log(`item width ${this.itemWidth} iw: ${itemWidth} window ${windowWidth}`)

      this.carouselWrapperStyle = {
        width: `${this.itemWidth}px`
      };
      this.goToCurrent()
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateItemWidth();
  }

  private buildAnimation(offset) {
    return this.builder.build([
      animate(this.timing, style({transform: `translateX(-${offset}px)`}))
    ]);
  }
}
