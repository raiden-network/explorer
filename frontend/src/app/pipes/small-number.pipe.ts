import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({
  name: 'smallNumber'
})
export class SmallNumberPipe extends DecimalPipe implements PipeTransform {
  // FIXME
  // @ts-ignore
  transform(value: number, args?: any): string {
    if (value < 0.001 && value !== 0) {
      return '< 0.001';
    } else {
      return super.transform(value);
    }
  }
}
