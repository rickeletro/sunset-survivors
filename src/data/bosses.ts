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
    lore: 'Bandoleiros tomaram o desfiladeiro e impedem a passagem. Derrote Simon Greedwell e libere o caminho!',
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
    lore: 'O comboio expresso a vapor foi cercado por atiradores de elite. Derrube Hank Hatfield no topo dos vagões!',
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
    lore: 'A vila fronteiriça arde em chamas sob o ataque da cavalaria pesada. Enfrente Dark Horse e seu garanhão de guerra!',
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
    lore: 'O Saloon virou um campo de batalha repleto de barris de pólvora. Cuidado com as chuvas de dinamite dos irmãos Smith!',
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
    lore: 'O furgão final do trem corta a estepe a toda velocidade. Supere o escudo blindado e o chicote mortal de El Greco!',
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
    lore: 'Entre penhascos rochosos e ventos cortantes, guerreiros nativos defendem a montanha sagrada. Sobreviva ao teste!',
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
    lore: 'A fazenda murada virou um ninho de metralhadoras e barricadas. Invada a fortaleza e silencie a Gatling de Paco Loco!',
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
    lore: 'O barão do crime aguarda em sua opulenta mansão colonial. Este é o duelo final pela paz de toda a fronteira!',
    posterKey: 'boss_poster_8',
    posterPath: CATALOG.images.boss_poster_8,
  },
];

export function getBossForStage(stage: number): BossData {
  const found = BOSSES.find((b) => b.stage === stage);
  return found || BOSSES[0];
}
