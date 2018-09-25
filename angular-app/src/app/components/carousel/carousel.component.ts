import {
  AfterViewInit,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  HostListener,
  Input, OnInit,
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
export class CarouselComponent implements OnInit {
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

  ngOnInit() {
    this.updateItemWidth();
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

  private updateItemWidth() {
    setTimeout(() => {
      const itemWidth = this.itemsElements.first.nativeElement.getBoundingClientRect().width;

      this.calculateWidth(itemWidth);

      this.carouselWrapperStyle = {
        width: `${this.itemWidth}px`
      };
      this.goToCurrent();
    });
  }

  private calculateWidth(itemWidth = 0) {
    const windowWidth = window.innerWidth;
    if (windowWidth >= 960) {
      this.itemWidth = 818;
    } else if (windowWidth >= 412) {
      this.itemWidth = 380;
    } else if (windowWidth < 412 && windowWidth > 370) {
      this.itemWidth = itemWidth - 32;
    } else {
      this.itemWidth = 320;
    }
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
