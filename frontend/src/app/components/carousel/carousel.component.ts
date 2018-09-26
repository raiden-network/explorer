import {
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
import { animate, AnimationBuilder, AnimationFactory, AnimationPlayer, AnimationStyleMetadata, style } from '@angular/animations';
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
  @Input() slides: number;
  carouselWrapperStyle = {};
  @ViewChildren(CarouselItemElementDirective, {read: ElementRef}) private itemsElements: QueryList<ElementRef>;
  @ViewChild('carousel') private carousel: ElementRef;
  private player: AnimationPlayer;
  private itemWidth: number;
  private currentSlide = 0;

  public get width(): number {
    return this.itemWidth;
  }

  public get current(): number {
    return this.currentSlide;
  }

  constructor(private builder: AnimationBuilder) {
  }

  ngOnInit() {
    this.updateItemWidth();
  }

  showNext() {
    if (this.currentSlide + 1 === this.slides) {
      return;
    }

    this.currentSlide = (this.currentSlide + 1) % this.slides;
    const offset = this.calculateOffset();
    const myAnimation: AnimationFactory = this.buildAnimation(offset);
    this.player = myAnimation.create(this.carousel.nativeElement);
    this.player.play();
  }

  showPrev() {
    if (this.currentSlide === 0) {
      return;
    }

    this.currentSlide = ((this.currentSlide - 1) + this.slides) % this.slides;
    const offset = this.calculateOffset();

    const myAnimation: AnimationFactory = this.buildAnimation(offset, false);
    this.player = myAnimation.create(this.carousel.nativeElement);
    this.player.play();
  }


  private goToCurrent() {
    this.currentSlide = (this.currentSlide + this.slides) % this.slides;
    const offset = this.calculateOffset();

    const myAnimation: AnimationFactory = this.buildAnimation(offset);
    this.player = myAnimation.create(this.carousel.nativeElement);
    this.player.play();
  }

  private calculateOffset() {
    let offset: number;
    if (this.currentSlide === 0) {
      offset = 0;
    } else {
      offset = this.itemWidth;
    }
    return offset;
  }

  private updateItemWidth() {
    setTimeout(() => {

      this.calculateWidth();

      this.carouselWrapperStyle = {
        width: `${this.itemWidth}px`
      };
      this.goToCurrent();
    });
  }

  private calculateWidth() {
    let availableWidth: number;

    if (window.innerWidth > screen.width) {
      availableWidth = screen.width;
    } else {
      availableWidth = window.innerWidth;
    }
    if (availableWidth >= 960) {
      this.itemWidth = 818;
    } else if (availableWidth >= 444) {
      this.itemWidth = 380;
    } else {
      this.itemWidth = availableWidth - 64;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateItemWidth();
  }

  private buildAnimation(offset: number, next: boolean = true) {
    const animateMetadata = animate(this.timing, style({
      transform: `translateX(-${offset}px)`
    }));

    const meta = [
      animateMetadata
    ];

    if (offset !== 0) {
      let currentElementFutureOffset: number;
      if (!next) {
        currentElementFutureOffset = (offset * 2);
      } else {
        currentElementFutureOffset = 0;
      }
      const styles: AnimationStyleMetadata = style({
        transform: `translateX(-${currentElementFutureOffset}px)`
      });

      const animateMetadataPre = animate(0, styles);
      meta.push(animateMetadataPre);
      meta.reverse();
    }

    return this.builder.build(meta);
  }
}
