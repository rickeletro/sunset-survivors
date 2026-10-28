import type Phaser from 'phaser';
interface NameFieldOptions { x?: number; width?: number; height?: number; fontSize?: number; autoFocus?: boolean; }
/** Native input preserves mobile keyboards, IME composition and accessible text selection. */
export class RankingNameField {
  private input?: HTMLInputElement;
  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, y: number, onSubmit: () => void, options: NameFieldOptions = {}) {
    if (typeof document === 'undefined') return;
    const {x=0,width=1120,height=88,fontSize=32,autoFocus=true}=options;
    const input=document.createElement('input');this.input=input;
    input.type='text';input.maxLength=18;input.placeholder='YOUR NAME';
    input.setAttribute('autocomplete','nickname');input.setAttribute('aria-label','Your Hall of Fame name');
    input.style.cssText='position:fixed;z-index:20;box-sizing:border-box;border:0;outline:none;background:#120b08;color:#f2d49a;caret-color:#ffc52a;text-shadow:0 0 8px #ffc52a88;text-align:left;font-family:"Press Start 2P",monospace;border-radius:0;';
    const keyboard=scene.input?.keyboard;let previousEnabled=true,locked=false;
    const unlock=()=>{if(keyboard&&locked){keyboard.enabled=previousEnabled;locked=false;}};
    input.addEventListener('focus',()=>{if(keyboard&&!locked){previousEnabled=keyboard.enabled;keyboard.enabled=false;locked=true;}});
    input.addEventListener('blur',unlock);
    const place=()=>{
      const rect=scene.game.canvas.getBoundingClientRect();
      const sx=rect.width/scene.scale.width,sy=rect.height/scene.scale.height;
      input.style.left=`${rect.left+(root.x+(x-width/2)*root.scaleX)*sx}px`;
      input.style.top=`${rect.top+(root.y+(y-height/2)*root.scaleY)*sy}px`;
      input.style.width=`${width*root.scaleX*sx}px`;input.style.height=`${height*root.scaleY*sy}px`;
      input.style.fontSize=`${Math.max(10,fontSize*root.scaleX*sx)}px`;
      input.style.padding=`${Math.max(2,8*root.scaleX*sx)}px`;
    };
    input.addEventListener('keydown',event=>{
      event.stopPropagation();
      if(event.key==='Enter'&&!event.isComposing){event.preventDefault();onSubmit();}
      if(event.key==='Escape'){event.preventDefault();input.blur();}
    });
    document.body.append(input);place();if(autoFocus)input.focus();
    const hide=()=>{input.style.display='none';input.blur();};
    const show=()=>{input.style.display='';place();};
    scene.scale.on('resize',place);window.addEventListener('resize',place);
    scene.events.on('pause',hide);scene.events.on('resume',show);
    scene.events.once('shutdown',()=>{
      unlock();input.remove();this.input=undefined;scene.scale.off('resize',place);window.removeEventListener('resize',place);
      scene.events.off('pause',hide);scene.events.off('resume',show);
    });
  }
  value(){return this.input?.value??'';}
  focus(){this.input?.focus();}
  isFocused(){return !!this.input&&typeof document!=='undefined'&&document.activeElement===this.input;}
  disable(){if(this.input){this.input.blur();this.input.disabled=true;}}
}
