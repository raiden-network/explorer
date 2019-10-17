import { SmallNumberPipe } from './small-number.pipe';

describe('SmallNumberPipe', () => {
  it('create an instance', () => {
    const pipe = new SmallNumberPipe('0');
    expect(pipe).toBeTruthy();
  });
});
