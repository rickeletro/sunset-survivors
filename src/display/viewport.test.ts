import { describe, expect, it } from 'vitest';
import { gameViewport } from './viewport';

describe('logical game viewport', () => {
  it.each([[360,640],[390,844],[430,932],[768,1024]])('uses undistorted 9:16 for compact portrait %ix%i', (width,height) => {
    const view=gameViewport(width,height);
    expect(view.width/view.height).toBe(9/16);
    expect(view).toEqual({width:1080,height:1920});
  });
  it('keeps a phone in portrait when opened sideways', () => {
    expect(gameViewport(844,390,true)).toEqual({width:1080,height:1920});
  });
  it.each([[1920,1080],[1366,768],[2560,1440]])('preserves desktop 16:9 at %ix%i', (width,height) => {
    expect(gameViewport(width,height)).toEqual({width:1920,height:1080});
  });
});
