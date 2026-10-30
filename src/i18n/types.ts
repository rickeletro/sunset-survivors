export type Locale = 'pt' | 'en';

export interface TranslationDictionary {
  common: {
    start: string;
    play: string;
    pressStart: string;
    menu: string;
    store: string;
    back: string;
    skip: string;
    skipKey: string;
    close: string;
    resume: string;
    continue: string;
    restart: string;
    restartStage: string;
    quit: string;
    confirm: string;
    cancel: string;
    language: string;
    languageButton: string;
    level: string;
    kills: string;
    bounty: string;
    bank: string;
    gold: string;
    hp: string;
    credit: string;
    oneUp: string;
    copyright: string;
    loading: string;
    choose: string;
    select: string;
    locked: string;
    cost: string;
    equipped: string;
    owned: string;
    buy: string;
    leave: string;
  };
  tutorial: {
    howToMove: string;
    bodyKeyboard: string;
    bodyTouch: string;
    keysKeyboard: string;
    keysTouch: string;
    stepBadge: string;
  };
  menu: {
    title: string;
    frontierMenu: string;
    audio: string;
    difficulty: string;
    controls: string;
    ranking: string;
    stats: string;
    unlocks: string;
    saveProgress: string;
    generalStore: string;
    developer: string;
    backToTitle: string;
    resumeGame: string;
    pauseTitle: string;
    paused: string;
    testPanel: string;
    navHint: string;
  };
  characterSelect: {
    title: string;
    selectHero: string;
    navHint: string;
    rideOut: string;
    bankLabel: string;
    costLabel: string;
    steveName: string;
    steveTitle: string;
    steveBio: string;
    billyName: string;
    billyTitle: string;
    billyBio: string;
    bobName: string;
    bobTitle: string;
    bobBio: string;
    cormanoName: string;
    cormanoTitle: string;
    cormanoBio: string;
  };
  store: {
    title: string;
    welcome: string;
    multiplierNotice: string;
    insufficientFunds: string;
    whiskeyName: string;
    whiskeyDesc: string;
    badgeName: string;
    badgeDesc: string;
    dynamiteName: string;
    dynamiteDesc: string;
    lassoName: string;
    lassoDesc: string;
    bootsName: string;
    bootsDesc: string;
  };
  saloon: {
    title: string;
    rest: string;
    hospitality: string;
    faro: string;
    gallery: string;
    enter: string;
    doorLocked: string;
    healNotice: string;
  };
  combat: {
    stageBanner: string; // e.g. "FASE {stage} — {title}"
    stageLabel: string;
    stageClear: string;
    gameOver: string;
    levelUp: string;
    contractWon: string;
    bossApproaching: string;
    yourTurn: string;
    retry: string;
    summary: string;
  };
  difficulty: {
    title: string;
    normal: string;
    normalDesc: string;
    hardcore: string;
    hardcoreDesc: string;
    nightmare: string;
    nightmareDesc: string;
  };
  audio: {
    title: string;
    bgm: string;
    sfx: string;
    mute: string;
    unmute: string;
  };
}

export type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? `${K}.${NestedKeyOf<T[K]>}`
    : `${K}`;
}[keyof T & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationDictionary>;
