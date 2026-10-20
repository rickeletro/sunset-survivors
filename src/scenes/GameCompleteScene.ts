import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CharacterData, CHARACTERS } from '../data/characters';
import { statsManager } from '../data/GameStatsManager';
import { THEME } from '../ui/theme/tokens';
import { WesternButton } from '../ui/components/WesternButton';
import { WesternTitle } from '../ui/components/WesternTitle';
import { WesternPanel } from '../ui/components/WesternPanel';
import { ArcadeStatDisplay } from '../ui/components/ArcadeStatDisplay';

export interface GameCompleteData {
  character: CharacterData;
  stage: number;
  kills: number;
  bounty: number;
  timeSurvivedSeconds: number;
}

export class GameCompleteScene extends Phaser.Scene {
  private dataReceived!: GameCompleteData;
  private rootContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('GameCompleteScene');
  }

  init(data?: Partial<GameCompleteData>) {
    this.dataReceived = {
      character: data?.character || CHARACTERS.billy,
      stage: data?.stage || 8,
      kills: data?.kills || 1842,
      bounty: data?.bounty || 36250,
      timeSurvivedSeconds: data?.timeSurvivedSeconds || 2895,
    };
  }

  create() {
    const { width, height } = this.scale;
    sounds.playIntroMusic();

    // Dark Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // Root Container
    this.rootContainer = createMenuRoot(this);

    // 1. Golden Horizon Sunset Backdrop
    this.createSunsetBackdrop();

    // 2. Title Banner
    const title = new WesternTitle(this, {
      x: 0,
      y: -390,
      title: '★ GAME COMPLETE! ★',
      subtitle: 'THE FRONTIER IS SAVED • ALL 8 OUTLAW BOSSES DEFEATED',
      width: 820,
      fontSize: '36px',
      titleColor: '#ffc52a',
    });
    this.rootContainer.add(title);

    // 3. The Four Gunslingers Silhouettes (Steve, Billy, Bob, Cormano) looking into the sunset
    this.createFourGunslingersSunset();

    // 4. Final Cumulative Stats Card
    this.createFinalStatsCard();

    // 5. Congratulations Footer & Back to Title Button
    this.createFooterControls();

  }

  private createSunsetBackdrop() {
    const backdrop = this.add.graphics();
    backdrop.fillGradientStyle(0xff791c, 0xffa01a, 0x572449, 0x120b08, 1);
    backdrop.fillRect(-700, -320, 1400, 640);

    // Sun disc
    backdrop.fillStyle(0xfff2a8, 0.95);
    backdrop.fillCircle(0, 40, 90);

    // Desert hills
    backdrop.fillStyle(0x23140a, 1);
    backdrop.beginPath();
    backdrop.moveTo(-700, 200);
    backdrop.lineTo(-400, 140);
    backdrop.lineTo(-150, 180);
    backdrop.lineTo(150, 160);
    backdrop.lineTo(450, 130);
    backdrop.lineTo(700, 190);
    backdrop.lineTo(700, 320);
    backdrop.lineTo(-700, 320);
    backdrop.closePath();
    backdrop.fillPath();

    this.rootContainer.add(backdrop);
  }

  private createFourGunslingersSunset() {
    const heroesContainer = this.add.container(-320, 120);

    const heroes = ['steve', 'billy', 'bob', 'cormano'];
    heroes.forEach((heroKey, i) => {
      const charSpriteKey = `hero_${heroKey}`;
      const posX = -135 + i * 90;

      if (this.textures.exists(charSpriteKey)) {
        const sprite = this.add.sprite(posX, 0, charSpriteKey, 0);
        sprite.setScale(2.4);
        sprite.setTint(0x1a0d06); // Dark silhouette against the glowing sun
        heroesContainer.add(sprite);
      } else {
        const sGfx = this.add.graphics();
        sGfx.fillStyle(0x1a0d06, 1);
        sGfx.fillCircle(posX, -60, 20);
        sGfx.fillRect(posX - 20, -40, 40, 80);
        heroesContainer.add(sGfx);
      }
    });

    this.rootContainer.add(heroesContainer);
  }

  private createFinalStatsCard() {
    const cardContainer = this.add.container(260, 20);

    const parchment = new WesternPanel(this, {
      x: 0,
      y: 0,
      width: 520,
      height: 380,
      variant: 'parchment',
    });
    cardContainer.add(parchment);

    const allStats = statsManager.getStats();
    const finalScore = this.dataReceived.bounty * 10 + this.dataReceived.kills * 50 + allStats.totalScore;
    const mins = Math.floor(allStats.playTimeSeconds / 60);
    const secs = allStats.playTimeSeconds % 60;
    const playTimeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const statItems = [
      { label: 'FINAL SCORE:', value: finalScore, valueColor: '#ffc52a' },
      { label: 'TOTAL KILLS:', value: allStats.totalKills + this.dataReceived.kills, valueColor: '#ef4444' },
      { label: 'STAGES CLEARED:', value: '8 / 8', valueColor: '#22c55e' },
      { label: 'TOTAL TIME:', value: playTimeStr, valueColor: '#f5c518' },
    ];

    const statsDisplay = new ArcadeStatDisplay(this, -230, -110, statItems, 460, 42);
    cardContainer.add(statsDisplay);

    // Rank S Badge
    const rankBadge = this.add.container(0, 100);
    const shield = this.add.graphics();
    shield.fillStyle(0x321b10, 0.95);
    shield.lineStyle(3, 0xffc52a, 1);
    shield.fillCircle(0, 0, 46);
    shield.strokeCircle(0, 0, 46);
    rankBadge.add(shield);

    const rankText = this.add.text(0, 0, 'S', {
      fontFamily: THEME.typography.westernFont,
      fontSize: '48px',
      color: '#ffc52a',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    rankBadge.add(rankText);
    cardContainer.add(rankBadge);

    this.rootContainer.add(cardContainer);
  }

  private createFooterControls() {
    const footerContainer = this.add.container(0, 370);

    const banner = this.add.text(-180, 0, 'CONGRATULATIONS, GUNSLINGER!', {
      fontFamily: THEME.typography.westernFont,
      fontSize: '20px',
      color: '#ffc52a',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    footerContainer.add(banner);

    const backBtn = new WesternButton(this, {
      x: 200,
      y: 0,
      width: 280,
      height: 56,
      text: '⌂ BACK TO TITLE',
      variant: 'gold',
      onClick: () => this.returnToTitle(),
    });
    footerContainer.add(backBtn);

    this.rootContainer.add(footerContainer);

    this.input.keyboard?.once('keydown-ENTER', () => this.returnToTitle());
    this.input.keyboard?.once('keydown-SPACE', () => this.returnToTitle());
  }

  private returnToTitle() {
    sounds.playRevolver();

    this.scene.start('TitleScene');
  }

}
