import { SmallNumberPipe } from './small-number.pipe';

describe('SmallNumberPipe', () => {
  it('create an instance', () => {
    const pipe = new SmallNumberPipe();
    expect(pipe).toBeTruthy();
  });
});
