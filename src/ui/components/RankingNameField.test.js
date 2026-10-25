import { afterEach,expect,it,vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { RankingNameField } from './RankingNameField';
afterEach(() => vi.unstubAllGlobals());
it('fits the native name input to canvas scaling, isolates typing and cleans up on shutdown', () => {
  const handlers = new Map(), windowHandlers = new Map();
  const input = { style:{}, setAttribute:vi.fn(), addEventListener:(key,fn) => handlers.set(key,fn), focus:vi.fn(), blur:vi.fn(), remove:vi.fn(), value:'THE KID' };
  vi.stubGlobal('document', { createElement:() => input, body:{ append:vi.fn() } });
  vi.stubGlobal('window', { addEventListener:(key,fn) => windowHandlers.set(key,fn), removeEventListener:(key) => windowHandlers.delete(key) });
  const scene = { game:{ canvas:{ getBoundingClientRect:() => ({ left:20,top:10,width:768,height:512 }) } }, scale:Object.assign(new EventEmitter(), { width:1536,height:1024 }), events:new EventEmitter() };
  const submit = vi.fn(); const field = new RankingNameField(scene,{ x:768,y:512,scaleX:1,scaleY:1 },195,submit);
  expect(input.style.width).toBe('560px'); expect(input.style.left).toBe('124px'); expect(input.style.cssText).toContain('caret-color:#ffc52a'); expect(input.focus).toHaveBeenCalledOnce();
  const event = { key:'Enter',isComposing:false,stopPropagation:vi.fn(),preventDefault:vi.fn() }; handlers.get('keydown')(event);
  expect(event.stopPropagation).toHaveBeenCalledOnce(); expect(submit).toHaveBeenCalledOnce(); expect(field.value()).toBe('THE KID');
  handlers.get('keydown')({ ...event,isComposing:true }); expect(submit).toHaveBeenCalledOnce();
  scene.events.emit('pause'); expect(input.style.display).toBe('none');
  scene.events.emit('resume'); expect(input.style.display).toBe('');
  scene.events.emit('shutdown'); expect(input.remove).toHaveBeenCalledOnce(); expect(scene.scale.listenerCount('resize')).toBe(0); expect(windowHandlers.size).toBe(0); expect(scene.events.listenerCount('resume')).toBe(0);
});
