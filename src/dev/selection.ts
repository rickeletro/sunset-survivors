import { CHARACTERS, type CharacterData } from '../data/characters';
import { normalizeDifficulty, type DifficultyId } from '../data/difficulty';
import { STAGES } from '../data/stages';
export interface DeveloperSelection { stage: number; hero: CharacterData['id']; difficulty: DifficultyId; result?: string; }
export function developerSelection(data?: Partial<DeveloperSelection>): DeveloperSelection {
  return {
    stage: STAGES.some(s => s.id === data?.stage) ? data!.stage! : 1,
    hero: data?.hero && Object.hasOwn(CHARACTERS, data.hero) ? data.hero : 'billy',
    difficulty: normalizeDifficulty(data?.difficulty),
    result: data?.result,
  };
}
