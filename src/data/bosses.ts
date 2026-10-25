import { CATALOG } from '../assets/registry';
export interface BossData {
  stage: number;
  name: string;
  subtitle: string;
  reward: string;
  stageName: string;
  stageTitle: string;
  lore: string;
  posterKey: string;
  posterPath: string;
}

export const BOSSES: BossData[] = [
  {
    stage: 1,
    name: 'Simon Greedwell',
    subtitle: 'THE FARM TYCOON',
    reward: '$5,000',
    stageName: 'STAGE 1: OUTLAW CANYON PASS',
    stageTitle: 'OUTLAW CANYON PASS',
    lore: 'Outlaws hold the canyon pass. Defeat Simon Greedwell and clear the trail!',
    posterKey: 'boss_poster_1',
    posterPath: CATALOG.images.boss_poster_1,
  },
  {
    stage: 2,
    name: 'Hawkeye Hank Hatfield',
    subtitle: 'THE FASTEST GUN',
    reward: '$6,000',
    stageName: 'STAGE 2: STEAM TRAIN AMBUSH',
    stageTitle: 'STEAM TRAIN AMBUSH',
    lore: 'Sharpshooters surround the steam express. Take down Hank Hatfield atop the railcars!',
    posterKey: 'boss_poster_2',
    posterPath: CATALOG.images.boss_poster_2,
  },
  {
    stage: 3,
    name: 'Dark Horse',
    subtitle: 'THE ARMORED BANDIT',
    reward: '$8,000',
    stageName: 'STAGE 3: BURNING TOWN SUNSET',
    stageTitle: 'BURNING TOWN SUNSET',
    lore: 'The frontier town burns under a cavalry attack. Face Dark Horse and his war stallion!',
    posterKey: 'boss_poster_3',
    posterPath: CATALOG.images.boss_poster_3,
  },
  {
    stage: 4,
    name: 'The Smith Brothers',
    subtitle: 'THE DYNAMITE DUO',
    reward: '$10,000',
    stageName: 'STAGE 4: SALOON INFERNO',
    stageTitle: 'SALOON INFERNO',
    lore: 'The saloon is a battlefield of powder barrels. Watch for the Smith brothers and their dynamite!',
    posterKey: 'boss_poster_4',
    posterPath: CATALOG.images.boss_poster_4,
  },
  {
    stage: 5,
    name: 'El Greco',
    subtitle: 'THE BULLWHIP WARLORD',
    reward: '$12,000',
    stageName: 'STAGE 5: CABOOSE SHOWDOWN',
    stageTitle: 'CABOOSE SHOWDOWN',
    lore: 'The caboose races across the plains. Break through El Greco’s shield and deadly whip!',
    posterKey: 'boss_poster_5',
    posterPath: CATALOG.images.boss_poster_5,
  },
  {
    stage: 6,
    name: 'Chief Wigwam',
    subtitle: 'THE MOUNTAIN CHIEFTAIN',
    reward: '$15,000',
    stageName: 'STAGE 6: SACRED MOUNTAIN TRAIL',
    stageTitle: 'SACRED MOUNTAIN TRAIL',
    lore: 'Among rocky cliffs and biting winds, native warriors defend the sacred mountain. Survive the trial!',
    posterKey: 'boss_poster_6',
    posterPath: CATALOG.images.boss_poster_6,
  },
  {
    stage: 7,
    name: 'Paco Loco',
    subtitle: 'THE GATLING REBEL',
    reward: '$20,000',
    stageName: 'STAGE 7: FORTIFIED HACIENDA',
    stageTitle: 'FORTIFIED HACIENDA',
    lore: 'The walled hacienda bristles with guns and barricades. Storm the fortress and silence Paco Loco’s Gatling!',
    posterKey: 'boss_poster_7',
    posterPath: CATALOG.images.boss_poster_7,
  },
  {
    stage: 8,
    name: 'Sir Richard Rose',
    subtitle: 'THE BRITISH MASTERMIND',
    reward: '$30,000',
    stageName: 'STAGE 8: THE FINAL MANOR SHOWDOWN',
    stageTitle: 'THE FINAL MANOR SHOWDOWN',
    lore: 'The crime baron awaits in his lavish manor. Win the final duel and bring peace to the frontier!',
    posterKey: 'boss_poster_8',
    posterPath: CATALOG.images.boss_poster_8,
  },
];

export function getBossForStage(stage: number): BossData {
  const found = BOSSES.find((b) => b.stage === stage);
  return found || BOSSES[0];
}
