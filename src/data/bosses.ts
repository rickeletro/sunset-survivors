export interface BossData {
  stage: number;
  name: string;
  subtitle: string;
  reward: string;
  stageName: string;
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
    posterKey: 'boss_poster_1',
    posterPath: 'assets/bosses/01_simon_greedwell.png',
  },
  {
    stage: 2,
    name: 'Hawkeye Hank Hatfield',
    subtitle: 'THE FASTEST GUN',
    reward: '$6,000',
    stageName: 'STAGE 2: STEAM TRAIN AMBUSH',
    posterKey: 'boss_poster_2',
    posterPath: 'assets/bosses/02_hawkeye_hank_hatfield.png',
  },
  {
    stage: 3,
    name: 'Dark Horse',
    subtitle: 'THE ARMORED BANDIT',
    reward: '$8,000',
    stageName: 'STAGE 3: BURNING TOWN SUNSET',
    posterKey: 'boss_poster_3',
    posterPath: 'assets/bosses/03_dark_horse.png',
  },
  {
    stage: 4,
    name: 'The Smith Brothers',
    subtitle: 'THE DYNAMITE DUO',
    reward: '$10,000',
    stageName: 'STAGE 4: SALOON INFERNO',
    posterKey: 'boss_poster_4',
    posterPath: 'assets/bosses/04_the_smith_brothers.png',
  },
  {
    stage: 5,
    name: 'El Greco',
    subtitle: 'THE BULLWHIP WARLORD',
    reward: '$12,000',
    stageName: 'STAGE 5: CABOOSE SHOWDOWN',
    posterKey: 'boss_poster_5',
    posterPath: 'assets/bosses/05_el_greco.png',
  },
  {
    stage: 6,
    name: 'Chief Wigwam',
    subtitle: 'THE MOUNTAIN CHIEFTAIN',
    reward: '$15,000',
    stageName: 'STAGE 6: SACRED MOUNTAIN TRAIL',
    posterKey: 'boss_poster_6',
    posterPath: 'assets/bosses/06_chief_wigwam.png',
  },
  {
    stage: 7,
    name: 'Paco Loco',
    subtitle: 'THE GATLING REBEL',
    reward: '$20,000',
    stageName: 'STAGE 7: FORTIFIED HACIENDA',
    posterKey: 'boss_poster_7',
    posterPath: 'assets/bosses/07_paco_loco.png',
  },
  {
    stage: 8,
    name: 'Sir Richard Rose',
    subtitle: 'THE BRITISH MASTERMIND',
    reward: '$30,000',
    stageName: 'STAGE 8: THE FINAL MANOR SHOWDOWN',
    posterKey: 'boss_poster_8',
    posterPath: 'assets/bosses/08_sir_richard_rose.png',
  },
];

export function getBossForStage(stage: number): BossData {
  const found = BOSSES.find((b) => b.stage === stage);
  return found || BOSSES[0];
}
