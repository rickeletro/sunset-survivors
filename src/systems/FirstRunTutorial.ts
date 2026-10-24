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

/** Actual movement and actual weapon fire drive learning; scene clocks never drive the campaign here. */
export class FirstRunTutorial {
  phase: TutorialPhase;
  mode: TutorialInput;
  hasFired = false;
  private distance = 0;
  private age = 0;
  private shotAge = 0;
  private lootHintPending: boolean;
  constructor(completed: boolean, mode: TutorialInput, private remember: () => void) {
    this.phase = completed ? 'reminder' : 'move';
    this.mode = mode;
    this.lootHintPending = !completed;
  }
  get blocking(): boolean { return this.phase === 'move' || this.phase === 'shoot'; }
  get visible(): boolean { return this.phase !== 'idle'; }
  setInput(mode: TutorialInput): void { this.mode = mode; }
  tick(delta: number, moved = 0): void {
    const dt = Number.isFinite(delta) ? Math.max(0, delta) : 0;
    this.age += dt;
    if (this.phase === 'move') {
      this.distance += Number.isFinite(moved) ? Math.max(0, moved) : 0;
      if (this.distance >= 56) { this.phase = 'shoot'; this.age = 0; }
    } else if (this.phase === 'shoot' && this.hasFired) {
      this.shotAge += dt;
      if (this.shotAge >= 2200) this.finish();
    } else if ((this.phase === 'ready' && this.age >= 3000) || (this.phase === 'reminder' && this.age >= 4500) || (this.phase === 'loot' && this.age >= 5000)) {
      this.phase = 'idle';
    }
  }
  fired(): void { if (this.phase === 'shoot') this.hasFired = true; }
  skip(): void {
    if (this.blocking) this.finish();
    else if (this.phase === 'reminder') this.phase = 'idle';
  }
  collectedXp(): void {
    if (!this.lootHintPending || this.blocking) return;
    this.lootHintPending = false; this.phase = 'loot'; this.age = 0;
  }
  private finish(): void { this.phase = 'ready'; this.age = 0; this.remember(); }
  get copy(): { title: string; body: string; keys: string; step: string } {
    const move = this.mode === 'touch' ? 'Drag your finger on the left side.' : 'Use WASD or arrow keys to move. No clicking needed.';
    if (this.phase === 'move') return { title: this.mode === 'touch' ? 'MOVE. YOUR GUN FIRES AUTOMATICALLY!' : 'YOU RUN. YOUR GUN FIRES AUTOMATICALLY!', body: move, keys: this.mode === 'touch' ? 'DRAG TO MOVE' : 'W A S D   /   ↑ ← ↓ →', step: '1 / 2 • FIRST STEPS' };
    if (this.phase === 'shoot') return {
      title: this.hasFired ? 'SEE? NO CLICKING!' : 'WATCH YOUR GUN FIRE!',
      body: this.mode === 'touch' ? 'Aiming and firing are automatic.' : 'Aiming and firing are automatic. This outlaw is just for practice.',
      keys: this.hasFired ? 'MOVE AND DODGE' : 'NO TAPPING TO FIRE', step: '2 / 2 • AUTOMATIC AIM AND FIRE',
    };
    if (this.phase === 'loot') return { title: 'LOOT BRINGS UPGRADES!', body: 'Collect XP and choose upgrades when you level up!', keys: 'MORE XP = MORE POWER', step: 'SHERIFF’S TIP' };
    if (this.phase === 'ready') return { title: 'YOUR TURN, PARTNER!', body: move, keys: 'MOVE • DODGE', step: 'THE STAGE HAS BEGUN!' };
    return { title: this.mode === 'touch' ? 'DRAG. AUTOMATIC FIRE.' : 'YOU RUN. YOUR GUN FIRES AUTOMATICALLY.', body: move, keys: this.mode === 'touch' ? 'AUTOMATIC FIRE' : 'AUTO AIM • NO CLICKING', step: 'HAPPY HUNTING!' };
  }
}
