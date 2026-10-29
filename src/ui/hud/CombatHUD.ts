import { heroPortrait } from '../components/HeroPortrait';
import type Phaser from 'phaser';
import { THEME } from '../theme/tokens';
import { UpgradeRack } from './UpgradeRack';
import { ConsumableRack } from './ConsumableRack';
import type { ConsumableId } from '../../data/consumables';

export interface CombatHudState {
  characterId: string; hp: number; maxHp: number; currentXp: number; xpToNextLevel: number;
  level: number; bounty: number; kills: number;
}
/** Rendering only: combat and progression rules remain with gameplay systems. */
export class CombatHUD {
  readonly upgrades: UpgradeRack;
  readonly consumables: ConsumableRack;
  private xpBarFill!: Phaser.GameObjects.Graphics;
  private hpBarFill!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  readonly levelText!: Phaser.GameObjects.Text;
  readonly bountyText!: Phaser.GameObjects.Text;
  readonly timeText!: Phaser.GameObjects.Text;
  readonly killsText!: Phaser.GameObjects.Text;
  readonly bossBarContainer!: Phaser.GameObjects.Container;
  private bossHpFill!: Phaser.GameObjects.Graphics;
  readonly stageStatus!: Phaser.GameObjects.Text;
  readonly objectiveStatus!: Phaser.GameObjects.Text;
  constructor(private scene: Phaser.Scene, private state: CombatHudState, bossName: string, onUseConsumable?: (id: ConsumableId) => void) {
    this.upgrades = new UpgradeRack(scene);
    this.consumables = new ConsumableRack(scene, (id) => onUseConsumable?.(id));
    const { width } = this.scene.scale;

    // 1. Top XP Bar Frame (madeira escura no topo)
    const xpBg = this.scene.add.graphics().setDepth(50).setScrollFactor(0);
    xpBg.fillStyle(0x1a0f08, 0.95);
    xpBg.fillRect(0, 0, width, 14);
    xpBg.lineStyle(1, 0x8b5a2b, 1);
    xpBg.strokeRect(0, 0, width, 14);

    this.xpBarFill = this.scene.add.graphics().setDepth(51).setScrollFactor(0);
    this.updateXpBar();

    heroPortrait(this.scene, 68, 70, this.state.characterId).setDepth(52).setScrollFactor(0);

    // "LV. 1" em amarelo arcade acima da barra
    this.levelText = this.scene.add.text(126, 28, `LV. ${this.state.level}`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '18px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(52).setScrollFactor(0);

    // Barra de Vida com Moldura de Madeira e Borda Dourada
    const barW = 240;
    const barH = 26;
    const barX = 126;
    const barY = 56;

    const hpBg = this.scene.add.graphics().setDepth(50).setScrollFactor(0);
    // Fundo escuro
    hpBg.fillStyle(0x180b06, 1);
    hpBg.fillRoundedRect(barX, barY, barW, barH, 4);
    // Moldura dourada / pergaminho
    hpBg.lineStyle(3, 0xf5d6a1, 1);
    hpBg.strokeRoundedRect(barX, barY, barW, barH, 4);

    this.hpBarFill = this.scene.add.graphics().setDepth(51).setScrollFactor(0);

    // Texto de HP "100 / 100" em branco com contorno preto abaixo da barra
    this.hpText = this.scene.add.text(barX + 4, barY + barH + 6, `${Math.max(0, Math.round(this.state.hp))} / ${this.state.maxHp}`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(52).setScrollFactor(0);

    this.updateHpBar();

    // 3. CENTER: Timer (Madeira de Saloon & Tipografia Arcade)
    const timerBg = this.scene.add.graphics().setDepth(49).setScrollFactor(0);
    timerBg.fillStyle(0x1a0d06, 0.85);
    timerBg.fillRoundedRect(width / 2 - 70, 24, 140, 42, 6);
    timerBg.lineStyle(2, 0x48240f, 1);
    timerBg.strokeRoundedRect(width / 2 - 70, 24, 140, 42, 6);

    this.timeText = this.scene.add.text(width / 2, 45, '00:00', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#8b0e0e',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

    // Stage boss health, shared by both Smith brothers.
    this.bossBarContainer = this.scene.add.container(width / 2, 92).setDepth(55).setScrollFactor(0).setVisible(false);

    const bossBg = this.scene.add.graphics();
    bossBg.fillStyle(0x1a0f08, 0.95);
    bossBg.fillRoundedRect(-180, -14, 360, 28, 6);
    bossBg.lineStyle(2, 0xdc2626, 1);
    bossBg.strokeRoundedRect(-180, -14, 360, 28, 6);
    this.bossBarContainer.add(bossBg);

    this.bossHpFill = this.scene.add.graphics();
    this.bossBarContainer.add(this.bossHpFill);

    const bossLabel = this.scene.add.text(0, 0, `★ ${bossName.toUpperCase()} ★`, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '10px',
      color: '#fef08a',
      stroke: '#8b0e0e',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.bossBarContainer.add(bossLabel);
    this.stageStatus = this.scene.add.text(width / 2, 120, '', {
      fontFamily: THEME.typography.pixelFont, fontSize: '12px', color: '#ffc52a', stroke: '#120b08', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(55);
    this.objectiveStatus = this.scene.add.text(width / 2, 140, '', {
      fontFamily: THEME.typography.pixelFont, fontSize: '11px', color: '#f2d49a', stroke: '#120b08', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(55);

    // 4. RIGHT: Placa de Dinheiro (Moeda) e Caveira (Kills)
    const plaqueW = 250;
    const plaqueH = 78;
    const plaqueX = width - plaqueW - 24;
    const plaqueY = 24;

    const statsBg = this.scene.add.graphics().setDepth(50).setScrollFactor(0);
    statsBg.fillStyle(0x1a0d06, 0.85);
    statsBg.fillRoundedRect(plaqueX, plaqueY, plaqueW, plaqueH, 8);
    statsBg.lineStyle(2, 0x48240f, 1);
    statsBg.strokeRoundedRect(plaqueX, plaqueY, plaqueW, plaqueH, 8);

    // Linha 1: Moeda / Gold ($000000)
    if (this.scene.textures.exists('hud_coin_icon')) {
      this.scene.add.image(plaqueX + 28, plaqueY + 22, 'hud_coin_icon')
        .setDisplaySize(30, 30)
        .setDepth(51)
        .setScrollFactor(0);
    }
    const goldFormatted = `$${String(this.state.bounty).padStart(6, '0')}`;
    this.bountyText = this.scene.add.text(plaqueX + 54, plaqueY + 14, goldFormatted, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '16px',
      color: '#ffe066',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(51).setScrollFactor(0);

    // Linha 2: Caveira / Kills (0000)
    if (this.scene.textures.exists('hud_skull_icon')) {
      this.scene.add.image(plaqueX + 28, plaqueY + 56, 'hud_skull_icon')
        .setDisplaySize(26, 28)
        .setDepth(51)
        .setScrollFactor(0);
    }
    const killsFormatted = String(this.state.kills).padStart(4, '0');
    this.killsText = this.scene.add.text(plaqueX + 54, plaqueY + 48, killsFormatted, {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(51).setScrollFactor(0);
  }

  private updateXpBar() {
    const { width } = this.scene.scale;
    const pct = Math.min(this.state.currentXp / Math.max(1, this.state.xpToNextLevel), 1);
    this.xpBarFill.clear();
    this.xpBarFill.fillStyle(0xffc52a, 1);
    this.xpBarFill.fillRect(1, 1, (width - 2) * pct, 12);
    this.xpBarFill.fillStyle(0xf2d49a, 0.8);
    this.xpBarFill.fillRect(1, 1, (width - 2) * pct, 3);
  }

  private updateHpBar() {
    const barX = 126;
    const barY = 56;
    const barW = 240;
    const barH = 26;

    const hpPct = Math.max(0, Math.min(1, this.state.hp / Math.max(1, this.state.maxHp)));
    const fillW = Math.max(0, (barW - 6) * hpPct);
    this.hpBarFill.clear();
    if (fillW > 0) {
      this.hpBarFill.fillStyle(0xd91414, 1);
      this.hpBarFill.fillRect(barX + 3, barY + 3, fillW, barH - 6);
      this.hpBarFill.fillStyle(0xff6b6b, 0.6);
      this.hpBarFill.fillRect(barX + 3, barY + 3, fillW, 4);
    }
    if (this.hpText) {
      this.hpText.setText(`${Math.max(0, Math.round(this.state.hp))} / ${this.state.maxHp}`);
    }
  }


  setXp(currentXp: number, xpToNextLevel: number): void {
    Object.assign(this.state, { currentXp, xpToNextLevel }); this.updateXpBar();
  }
  setHealth(hp: number, maxHp: number): void {
    Object.assign(this.state, { hp, maxHp }); this.updateHpBar();
  }
  setBossHealth(hp: number, maxHp: number): void {
    const pct = Math.max(0, Math.min(hp / Math.max(1, maxHp), 1));
    this.bossHpFill.clear().fillStyle(0xdc2626, 1).fillRoundedRect(-178, -12, 356 * pct, 24, 4);
  }
}
