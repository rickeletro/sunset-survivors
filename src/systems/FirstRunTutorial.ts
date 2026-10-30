import { t } from '../i18n';

export type TutorialPhase = 'move' | 'shoot' | 'ready' | 'reminder' | 'loot' | 'idle';
export type TutorialInput = 'keyboard' | 'touch';
interface ProgressStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
const PROGRESS_KEY = 'sunset_survivors_controls_v1';

/** Session fallback prevents repeated training when browser storage is unavailable. */
export class TutorialProgress {
  private completed = false;
  constructor(private storage: () => ProgressStorage = () => globalThis.localStorage) {}
  hasCompleted(): boolean {
    if (this.completed) return true;
    try { return this.storage().getItem(PROGRESS_KEY) === 'done'; } catch { return false; }
  }
  complete(): void {
    this.completed = true;
    try { this.storage().setItem(PROGRESS_KEY, 'done'); } catch { /* Private browsing still remembers this session. */ }
  }
}
export const tutorialProgress = new TutorialProgress();

/** Pure movement instruction shown once on Stage 1; closes upon moving or timeout. */
export class FirstRunTutorial {
  phase: TutorialPhase;
  mode: TutorialInput;
  hasFired = false;
  private distance = 0;
  private age = 0;

  constructor(completed: boolean, mode: TutorialInput, private remember: () => void) {
    this.phase = completed ? 'idle' : 'move';
    this.mode = mode;
  }

  get blocking(): boolean { return this.phase === 'move'; }
  get visible(): boolean { return this.phase === 'move'; }

  setInput(mode: TutorialInput): void { this.mode = mode; }

  tick(delta: number, moved = 0): void {
    if (this.phase !== 'move') return;
    const dt = Number.isFinite(delta) ? Math.max(0, delta) : 0;
    this.age += dt;
    this.distance += Number.isFinite(moved) ? Math.max(0, moved) : 0;
    if ((this.distance >= 32 && this.age >= 300) || this.age >= 6000) {
      this.finish();
    }
  }

  fired(): void { this.hasFired = true; }

  skip(): void {
    if (this.phase === 'move') this.finish();
  }

  collectedXp(): void {}

  private finish(): void {
    this.phase = 'idle';
    this.remember();
  }

  get copy(): { title: string; body: string; keys: string; step: string } {
    return {
      title: t('tutorial.howToMove'),
      body: this.mode === 'touch' ? t('tutorial.bodyTouch') : t('tutorial.bodyKeyboard'),
      keys: this.mode === 'touch' ? t('tutorial.keysTouch') : t('tutorial.keysKeyboard'),
      step: t('tutorial.stepBadge'),
    };
  }
}
