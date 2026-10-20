import type { EnemyKind } from './enemies';

export type StageTheme = 'canyon' | 'railroad' | 'burning-town' | 'saloon' | 'caboose' | 'mountain' | 'hacienda' | 'manor';
export type StageHazard = 'stampede' | 'train' | 'fire' | 'powder' | 'crossfire' | 'rockfall' | 'artillery' | 'volley';
export interface StageConfig {
  id: number;
  title: string;
  duration: number;
  theme: StageTheme;
  ground: number;
  accent: number;
  props: string[];
  enemies: Partial<Record<EnemyKind, number>>;
  signature: EnemyKind;
  hazard: StageHazard;
  hazardLabel: string;
  hazardEvery: number;
  objective: string;
  objectiveColor: number;
}

export const STAGES: StageConfig[] = [
  { id: 1, title: 'OUTLAW CANYON PASS', duration: 600, theme: 'canyon', ground: 0xb0773a, accent: 0xffc52a, props: ['rock', 'cactus', 'wagon'], enemies: { bandit: 55, knife_bandit: 30, coyote: 25, snake: 15, dynamiter: 8 }, signature: 'coyote', hazard: 'stampede', hazardLabel: 'ESTOURO DA BOIADA — SAIA DA TRILHA!', hazardEvery: 70, objective: 'RESGATE AS PROVISOES DO COMBOIO', objectiveColor: 0xffc52a },
  { id: 2, title: 'STEAM TRAIN AMBUSH', duration: 660, theme: 'railroad', ground: 0x68503d, accent: 0xff791c, props: ['crate', 'wagon', 'barrel'], enemies: { bandit: 25, knife_bandit: 25, rifle_guard: 45, dynamiter: 20, heavy: 12 }, signature: 'rifle_guard', hazard: 'train', hazardLabel: 'TREM EXPRESSO — LIBERE OS TRILHOS!', hazardEvery: 62, objective: 'RECUPERE A CARGA DO EXPRESSO', objectiveColor: 0xff791c },
  { id: 3, title: 'BURNING TOWN SUNSET', duration: 720, theme: 'burning-town', ground: 0x6b3b25, accent: 0xe52b20, props: ['ruin', 'barrel', 'wagon'], enemies: { bandit: 30, knife_bandit: 35, dynamiter: 30, heavy: 20, coyote: 12 }, signature: 'dynamiter', hazard: 'fire', hazardLabel: 'BRASAS CAINDO — PROCURE UMA SAIDA!', hazardEvery: 55, objective: 'SALVE OS SUPRIMENTOS DA VILA', objectiveColor: 0xe52b20 },
  { id: 4, title: 'SALOON INFERNO', duration: 750, theme: 'saloon', ground: 0x603719, accent: 0xffc52a, props: ['table', 'barrel', 'crate'], enemies: { knife_bandit: 50, dynamiter: 40, heavy: 20, bandit: 20 }, signature: 'dynamiter', hazard: 'powder', hazardLabel: 'POLVORA ACESA — AFASTE-SE DOS BARRIS!', hazardEvery: 52, objective: 'ABRA O COFRE DO SALOON', objectiveColor: 0xffc52a },
  { id: 5, title: 'CABOOSE SHOWDOWN', duration: 780, theme: 'caboose', ground: 0x654430, accent: 0xf2d49a, props: ['crate', 'barrel', 'wagon'], enemies: { knife_bandit: 40, rifle_guard: 40, dynamiter: 25, heavy: 25 }, signature: 'knife_bandit', hazard: 'crossfire', hazardLabel: 'EMBOSCADA NOS VAGOES — EVITE A MIRA!', hazardEvery: 48, objective: 'PROTEJA A CAIXA FORTE DO FURGAO', objectiveColor: 0xf2d49a },
  { id: 6, title: 'SACRED MOUNTAIN TRAIL', duration: 810, theme: 'mountain', ground: 0x66536b, accent: 0xc49ac5, props: ['rock', 'pine', 'tent'], enemies: { knife_scout: 55, coyote: 35, rifle_guard: 20, heavy: 18, snake: 10 }, signature: 'knife_scout', hazard: 'rockfall', hazardLabel: 'DESMORONAMENTO — OBSERVE AS SOMBRAS!', hazardEvery: 52, objective: 'RECUPERE O MAPA DO DESFILADEIRO', objectiveColor: 0xc49ac5 },
  { id: 7, title: 'FORTIFIED HACIENDA', duration: 840, theme: 'hacienda', ground: 0x7c7140, accent: 0x9bb94c, props: ['barricade', 'crate', 'palm'], enemies: { rifle_guard: 50, heavy: 35, dynamiter: 30, knife_bandit: 20, coyote: 10 }, signature: 'rifle_guard', hazard: 'artillery', hazardLabel: 'BATERIA DA HACIENDA — SAIAM DA ZONA!', hazardEvery: 46, objective: 'SABOTE AS RESERVAS DA GUARNICAO', objectiveColor: 0x9bb94c },
  { id: 8, title: 'THE FINAL MANOR SHOWDOWN', duration: 900, theme: 'manor', ground: 0x58505b, accent: 0xffc52a, props: ['statue', 'barricade', 'barrel'], enemies: { rifle_guard: 45, heavy: 40, dynamiter: 30, knife_bandit: 25, knife_scout: 15 }, signature: 'heavy', hazard: 'volley', hazardLabel: 'GUARDA REAL — DESVIE DA SALVA!', hazardEvery: 42, objective: 'TOME O OURO DO BARAO', objectiveColor: 0xffc52a },
];
export function getStage(stage: number): StageConfig { return STAGES.find(s => s.id === stage) ?? STAGES[0]; }
export type StagePhase = 'arrival' | 'pressure' | 'surge' | 'respite' | 'last-stand' | 'boss';
export function stagePhase(stage: StageConfig, elapsed: number): StagePhase {
  if (elapsed >= stage.duration) return 'boss';
  if (elapsed >= stage.duration - 60) return 'last-stand';
  if (elapsed < 45) return 'arrival';
  const cycle = elapsed % 180;
  return cycle >= 145 ? 'respite' : cycle >= 105 ? 'surge' : 'pressure';
}
export function pressureMultiplier(phase: StagePhase): number {
  return { arrival: 0.65, pressure: 1, surge: 1.3, respite: 0.55, 'last-stand': 1.45, boss: 0.5 }[phase];
}
export function isBossDue(stage: StageConfig, elapsed: number): boolean { return elapsed >= stage.duration; }
export function safeEventPoint(px: number, py: number, angle: number, distance = 300): { x: number; y: number } {
  return { x: Math.max(200, Math.min(7800, px + Math.cos(angle) * distance)), y: Math.max(200, Math.min(7800, py + Math.sin(angle) * distance)) };
}
export function objectiveProgress(progress: number, inside: boolean, deltaSeconds: number): number {
  return Math.min(8, Math.max(0, progress + (inside ? deltaSeconds : -deltaSeconds * 0.5)));
}
