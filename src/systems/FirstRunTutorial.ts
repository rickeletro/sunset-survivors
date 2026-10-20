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
    const move = this.mode === 'touch' ? 'Arraste o dedo no lado esquerdo.' : 'Use WASD ou as setas para andar. Não precisa clicar.';
    if (this.phase === 'move') return { title: this.mode === 'touch' ? 'ANDE. A ARMA ATIRA SOZINHA!' : 'VOCÊ CORRE. O GATILHO É AUTOMÁTICO!', body: move, keys: this.mode === 'touch' ? 'ARRASTE PARA ANDAR' : 'W A S D   /   ↑ ← ↓ →', step: '1 / 2 • PRIMEIROS PASSOS' };
    if (this.phase === 'shoot') return {
      title: this.hasFired ? 'VIU SÓ? SEM CLICAR!' : 'VEJA A ARMA ATIRAR!',
      body: this.mode === 'touch' ? 'Mira e tiros são automáticos.' : 'Mira e tiros são automáticos. Este bandido é só de treino.',
      keys: this.hasFired ? 'ANDE E DESVIE' : 'SEM TOCAR PARA ATIRAR', step: '2 / 2 • MIRA E TIROS AUTOMÁTICOS',
    };
    if (this.phase === 'loot') return { title: 'SAQUE DÁ MELHORIAS!', body: 'Junte XP e escolha melhorias ao subir de nível!', keys: 'MAIS XP = MAIS PODER', step: 'DICA DO XERIFE' };
    if (this.phase === 'ready') return { title: 'AGORA É COM VOCÊ!', body: move, keys: 'ANDE • DESVIE', step: 'A FASE COMEÇOU!' };
    return { title: this.mode === 'touch' ? 'ARRASTE. TIROS AUTOMÁTICOS.' : 'VOCÊ CORRE. A ARMA ATIRA SOZINHA.', body: move, keys: this.mode === 'touch' ? 'TIROS AUTOMÁTICOS' : 'MIRA AUTOMÁTICA • SEM CLICAR', step: 'BOA CAÇADA!' };
  }
}
