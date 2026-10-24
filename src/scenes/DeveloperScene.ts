import Phaser from 'phaser';
import { developerEnabled } from '../dev/access';
import { developerSelection, type DeveloperSelection } from '../dev/selection';
import { STAGES } from '../data/stages';
import { CHARACTERS, type CharacterData } from '../data/characters';
import { DIFFICULTIES, DIFFICULTY_IDS } from '../data/difficulty';
import { CATALOG, preloadImages, preloadHeroSheets } from '../assets/registry';
import { preloadPixellabHeroes } from '../systems/PixellabHeroes';
import { SpriteGenerator } from '../utils/SpriteGenerator';
import { sounds } from '../audio/SoundManager';
import { createMenuRoot } from '../ui/layout/menuLayout';
import { heroPortrait } from '../ui/components/HeroPortrait';
import type { WesternButton } from '../ui/components/WesternButton';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText, pulpWood, pulpButton, bindPulpKeys } from '../ui/layout/pulpSceneKit';

/** Local stage launcher. Tests end here instead of writing campaign records or unlocks. */
export class DeveloperScene extends Phaser.Scene {
  private selection: DeveloperSelection = developerSelection();
  private leaving = false;
  private stageButtons: WesternButton[] = [];
  private heroButton!: WesternButton;
  private difficultyButton!: WesternButton;
  private portrait?: Phaser.GameObjects.Container;
  private description!: Phaser.GameObjects.Text;
  private weapon!: Phaser.GameObjects.Text;
  private root!: Phaser.GameObjects.Container;
  constructor() { super('DeveloperScene'); }
  init(data?: Partial<DeveloperSelection>): void { this.selection = developerSelection(data); this.leaving = false; }
  preload(): void {
    if (!developerEnabled()) return;
    preloadPulp(this); preloadHeroSheets(this); preloadPixellabHeroes(this);
    preloadImages(this, CATALOG.titleImages);
    preloadImages(this, ['hud_avatar_steve', 'hud_avatar_billy', 'hud_avatar_bob', 'hud_avatar_cormano']);
  }
  create(): void {
    if (!developerEnabled()) { this.scene.start('TitleScene'); return; }
    SpriteGenerator.generateAll(this);
    this.stageButtons = []; this.portrait = undefined;
    this.root = createMenuRoot(this); pulpBackdrop(this, this.root, true);
    pulpHeading(this, this.root, 'DEVELOPER', -385, 1260, 78, true);
    pulpText(this, this.root, 0, -282, 'CHOOSE A DESTINATION • JUMP STRAIGHT INTO A STAGE', 25);
    pulpText(this, this.root, -180, -235, 'FRONTIER STAGES', 24, '#ffc52a');
    this.stageButtons = STAGES.map((stage, i) => pulpButton(this, this.root,
      i % 2 ? 45 : -405, -155 + Math.floor(i / 2) * 100,
      `${String(stage.id).padStart(2, '0')}\n${stage.title}`, () => this.chooseStage(stage.id), 420));
    pulpWood(this, this.root, 510, -5, 350, 480);
    this.heroButton = pulpButton(this, this.root, 510, -48, '', () => this.cycleHero(), 330);
    this.weapon = pulpText(this, this.root, 510, 30, '', 23).setWordWrapWidth(300);
    this.difficultyButton = pulpButton(this, this.root, 510, 122, '', () => this.cycleDifficulty(), 330);
    pulpText(this, this.root, 510, 205, '[C] HERO • [D] MODE', 18);
    this.description = pulpText(this, this.root, -180, 235, '', 22).setWordWrapWidth(900);
    pulpButton(this, this.root, -300, 345, 'START TEST [ENTER]', () => this.launchTest(), 540, true);
    pulpButton(this, this.root, 300, 345, 'BACK TO TITLE [ESC]', () => this.back(), 540);
    pulpText(this, this.root, 0, 420, 'NORMAL COMBAT • SKIP TUTORIAL • NO SAVED STATS OR UNLOCKS', 22);
    pulpText(this, this.root, 0, 466, this.selection.result ?? '[1–8] STAGE • [← →] STAGE • [C] HERO • [D] DIFFICULTY', 21, '#ffc52a');
    bindPulpKeys(this, {
      ...Object.fromEntries(STAGES.map(stage => [String(stage.id), () => this.chooseStage(stage.id)])),
      LEFT: () => this.chooseStage((this.selection.stage + 6) % 8 + 1), RIGHT: () => this.chooseStage(this.selection.stage % 8 + 1),
      C: () => this.cycleHero(), D: () => this.cycleDifficulty(), ENTER: () => this.launchTest(), ESC: () => this.back(),
    });
    this.refresh();
  }
  private chooseStage(stage: number): void {
    if (this.leaving) return;
    this.selection.stage = stage; sounds.playReload(); this.refresh();
  }
  private cycleHero(): void {
    if (this.leaving) return;
    const heroes = Object.keys(CHARACTERS) as CharacterData['id'][];
    this.selection.hero = heroes[(heroes.indexOf(this.selection.hero) + 1) % heroes.length]; this.refresh();
  }
  private cycleDifficulty(): void {
    if (this.leaving) return;
    this.selection.difficulty = DIFFICULTY_IDS[(DIFFICULTY_IDS.indexOf(this.selection.difficulty) + 1) % DIFFICULTY_IDS.length]; this.refresh();
  }
  private refresh(): void {
    this.stageButtons.forEach((button, i) => button.setFocused(i + 1 === this.selection.stage));
    const hero = CHARACTERS[this.selection.hero];
    this.heroButton.setText(`${hero.name} [C]`);
    this.difficultyButton.setText(`${DIFFICULTIES[this.selection.difficulty].label} [D]`);
    this.weapon.setText(hero.subtitle);
    this.portrait?.destroy(); this.portrait = heroPortrait(this, 510, -157, hero.id); this.root.add(this.portrait);
    const stage = STAGES[this.selection.stage - 1];
    this.description.setText(`STAGE ${stage.id}: ${stage.title}\n${stage.id === 2 ? 'FARO SALOON • HOSPITALITY • EXPRESS TRAIN' : stage.objective}`);
  }
  private launchTest(): void {
    if (this.leaving || !developerEnabled()) return;
    this.leaving = true; sounds.playRevolver(); this.cameras.main.flash(90, 255, 197, 42);
    this.scene.start('GameScene', { stage: this.selection.stage, character: CHARACTERS[this.selection.hero], difficulty: this.selection.difficulty, developer: true });
  }
  private back(): void {
    if (this.leaving) return;
    this.leaving = true; this.scene.start('TitleScene');
  }
}
