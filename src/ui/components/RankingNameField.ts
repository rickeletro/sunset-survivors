import type Phaser from 'phaser';
/** Native input preserves mobile keyboards, IME composition and accessible text selection. */
export class RankingNameField {
  private input?: HTMLInputElement;
  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, y: number, onSubmit: () => void) {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input'); this.input = input;
    input.type = 'text'; input.maxLength = 18; input.placeholder = 'YOUR NAME';
    input.setAttribute('autocomplete', 'nickname'); input.setAttribute('aria-label', 'Your ranking name');
    input.style.cssText = 'position:fixed;z-index:20;box-sizing:border-box;border:0;outline:none;background:#120b08;color:#f2d49a;caret-color:#ffc52a;text-shadow:0 0 8px #ffc52a88;text-align:center;font-family:"Press Start 2P",monospace;padding:8px;border-bottom:3px solid #ffc52a;border-radius:0;';
    const place = () => {
      const rect = scene.game.canvas.getBoundingClientRect();
      const sx = rect.width / scene.scale.width, sy = rect.height / scene.scale.height;
      input.style.left = `${rect.left + (root.x - 560*root.scaleX)*sx}px`;
      input.style.top = `${rect.top + (root.y + (y-44)*root.scaleY)*sy}px`;
      input.style.width = `${1120*root.scaleX*sx}px`; input.style.height = `${88*root.scaleY*sy}px`;
      input.style.fontSize = `${Math.max(14,32*root.scaleX*sx)}px`;
    };
    input.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); onSubmit(); }
      if (event.key === 'Escape') input.blur();
    });
    document.body.append(input); place(); input.focus();
    const hide = () => { input.style.display = 'none'; input.blur(); };
    const show = () => { input.style.display = ''; place(); };
    scene.scale.on('resize', place); window.addEventListener('resize', place);
    scene.events.on('pause',hide); scene.events.on('resume',show);
    scene.events.once('shutdown', () => {
      input.remove(); this.input = undefined; scene.scale.off('resize',place); window.removeEventListener('resize',place);
      scene.events.off('pause',hide); scene.events.off('resume',show);
    });
  }
  value() { return this.input?.value ?? ''; }
  focus() { this.input?.focus(); }
}
