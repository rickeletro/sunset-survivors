import type Phaser from 'phaser';
import { ECONOMY } from '../data/economy';
import { FaroTable, FARO_STAKES, faroRank } from '../data/faro';
import type { UpgradeChoice } from '../scenes/LevelUpScene';
import { sounds } from '../audio/SoundManager';
import { bindPulpKeys, pulpButton, pulpPaper, pulpText, pulpWood } from './layout/pulpSceneKit';
import { playingCard } from './components/FaroCard';
import type { WesternButton } from './components/WesternButton';

/** The combat scene owns bounty settlement; this view owns only the paused table. */
export class FaroTableView {
  private rank = 7;
  private inverted = false;
  private stakeIndex = 0;
  private pending = 0;
  private busy = false;
  private exited = false;
  private tutorial?: Phaser.GameObjects.Container;
  private ranks: { node: Phaser.GameObjects.Container; count: Phaser.GameObjects.Text; highlight: Phaser.GameObjects.Graphics }[] = [];
  private marker: Phaser.GameObjects.Container;
  private markerText: Phaser.GameObjects.Text;
  private status: Phaser.GameObjects.Text;
  private account: Phaser.GameObjects.Text;
  private prizeLabel: Phaser.GameObjects.Text;
  private action: WesternButton;
  private copper: WesternButton;
  private dealt: Phaser.GameObjects.Container[] = [];
  constructor(private scene: Phaser.Scene, private root: Phaser.GameObjects.Container, private table: FaroTable,
    prize: UpgradeChoice, private onExit: () => void) {
    pulpWood(scene, root, 0, -453, 1400, 90);
    pulpText(scene, root, 0, -453, 'LUCKY STAR • FARO', 58, '#ffc52a');
    if (scene.textures.exists('faro_dealer')) {
      const dealer = scene.add.image(-340, -301, 'faro_dealer');
      dealer.setScale(205 / dealer.height); root.add(dealer);
    }
    pulpText(scene, root, 85, -337, '“Place your bets, partner.”', 30, '#ffc52a');
    pulpText(scene, root, 50, -302, 'First card loses • Second wins\nMatching pair: lose half', 20);
    this.copper = pulpButton(scene, root, 50, -230, 'COPPER: OFF [C]', () => this.toggleCopper(), 340);
    const felt = scene.add.graphics();
    felt.fillStyle(0x321b10).fillRect(-711, -193, 1010, 526);
    felt.fillStyle(0x603719).fillRect(-701, -183, 990, 506);
    felt.fillStyle(0x204531).fillRect(-687, -169, 962, 478);
    felt.lineStyle(2, 0xc8a359).strokeRect(-679, -161, 946, 462); root.add(felt);
    for (let rank = 1; rank <= 13; rank++) {
      const row = rank > 7, col = row ? rank - 8 : rank - 1;
      const x = -205 + (col - (row ? 2.5 : 3)) * 127, y = row ? 82 : -77;
      const node = playingCard(scene, root, x, y, 87, { rank, suit: 0 });
      node.setInteractive({ useHandCursor: true, dropZone: true }).setData('faroRank', rank);
      node.on('pointerdown', () => this.select(rank));
      const count = pulpText(scene, root, x, y + 73, '', 15);
      const highlight = scene.add.graphics().lineStyle(3, 0xffc52a).strokeRoundedRect(-47, -68, 94, 136, 4).setPosition(x, y);
      root.add(highlight); this.ranks.push({ node, count, highlight });
    }
    for (const [x, label] of [[-576, 'SODA'], [-446, 'LOSING'], [-316, 'WINNING']] as const) {
      pulpText(scene, root, x, 178, label, 16);
      this.dealt.push(playingCard(scene, root, x, 246, 69, label === 'SODA' ? table.soda : undefined));
    }
    FARO_STAKES.forEach((amount, index) => {
      const x = -123 + index * 137, y = 239;
      const chip = this.chip(x, y, amount, index).setSize(70, 70).setInteractive({ useHandCursor: true });
      scene.input.setDraggable(chip);
      chip.on('pointerdown', () => { if (!this.tutorial && !this.busy && !table.activeBet) { this.stakeIndex = index; sounds.playCards(); } });
      chip.on('dragstart', () => { if (!this.tutorial && !this.busy && !table.activeBet) sounds.playCards(); });
      chip.on('drag', (_pointer: unknown, dragX: number, dragY: number) => {
        if (!this.tutorial && !this.busy && !table.activeBet) chip.setPosition(dragX, dragY);
      });
      chip.on('drop', (_pointer: unknown, zone: Phaser.GameObjects.Container) => this.drop(zone.getData('faroRank'), amount));
      chip.on('dragend', () => chip.setPosition(x, y));
      pulpText(scene, root, x, 287, index ? `$${amount} CHIP` : '$2 COIN', 15);
    });
    this.marker = this.chip(0, 0, 0, 1);
    this.markerText = this.marker.getAt(1) as Phaser.GameObjects.Text;
    // Same standalone artwork and live parchment attribute plate as LevelUpScene.
    const key = `card_${prize.id}`;
    const poster = scene.add.container(519, 36); root.add(poster);
    const posterWidth = 360, posterHeight = 552;
    if (scene.textures.exists(key)) {
      const image = scene.add.image(0, 0, key);
      image.setScale(Math.min(posterWidth / image.width, posterHeight / image.height)); poster.add(image);
    }
    const plateWidth = posterWidth - 28, plateHeight = 158, plateY = posterHeight / 2 - plateHeight / 2 - 17;
    const plate = scene.add.graphics().fillStyle(0xefbb77).fillRect(-plateWidth / 2, plateY - plateHeight / 2, plateWidth, plateHeight);
    plate.lineStyle(2, 0x3d2314).strokeRect(-plateWidth / 2, plateY - plateHeight / 2, plateWidth, plateHeight);
    plate.lineStyle(1, 0x8c531d, .7).strokeRect(-plateWidth / 2 + 3, plateY - plateHeight / 2 + 3, plateWidth - 6, plateHeight - 6); poster.add(plate);
    this.prizeLabel = pulpText(scene, poster, 0, plateY - 49, `★ LV. ${prize.currentLevel} → ${prize.nextLevel} ★`, 24, '#1a0d00');
    pulpText(scene, poster, 0, plateY + 16, prize.description, 19, '#21130b').setWordWrapWidth(plateWidth - 26);
    this.account = pulpText(scene, root, 0, 354, '', 22);
    this.status = pulpText(scene, root, -205, 325, '', 16, '#ffc52a');
    this.status.setWordWrapWidth(900);
    this.action = pulpButton(scene, root, -467, 422, 'PLACE BET & DEAL', () => this.play(), 458, true);
    pulpButton(scene, root, 0, 422, 'TUTORIAL', () => this.showTutorial(), 400);
    pulpButton(scene, root, 467, 422, 'COLLECT & LEAVE', () => this.leave(), 458);
    bindPulpKeys(scene, {
      LEFT: () => this.select((this.rank + 11) % 13 + 1), RIGHT: () => this.select(this.rank % 13 + 1), C: () => this.toggleCopper(),
      F: () => { if (this.tutorial || this.busy) return; this.stakeIndex = (this.stakeIndex + 1) % FARO_STAKES.length; this.status.setText(`Selected $${FARO_STAKES[this.stakeIndex]} chip. Click a rank or drag to stack.`); },
      BACKSPACE: () => { if (!this.busy && !this.tutorial) { table.withdrawBet(); this.pending = 0; sounds.playCards(); this.refresh(); } },
      ENTER: () => this.play(), SPACE: () => this.play(), ESC: () => this.tutorial ? this.closeTutorial() : this.leave(), H: () => this.showTutorial(),
    });
    sounds.playShuffle(); this.refresh();
  }
  private showTutorial() {
    if (this.busy || this.tutorial || this.exited) return;
    const modal = this.scene.add.container(0, 0).setSize(3000, 2000).setInteractive();
    this.root.add(modal); this.tutorial = modal;
    modal.add(this.scene.add.graphics().fillStyle(0x120b08, .88).fillRect(-1500, -1000, 3000, 2000));
    pulpPaper(this.scene, modal, 0, 0, 1120, 860);
    pulpText(this.scene, modal, 0, -345, 'HOW TO PLAY FARO', 54, '#a51e16');
    const rules = [
      'Drag coins or chips onto a rank. Drop again to stack your stake.',
      'Chips cost their face value in collected bounty. Enter confirms the bet.',
      'The exposed soda is discarded. The first dealt card loses; the second wins.',
      'A winning rank pays 1:1 profit plus your stake. Copper reverses the result.',
      'Matching ranks take half your stake. No match leaves the same bet in play.',
      `Win a $${ECONOMY.faro.itemStake}+ bet to claim the poster: +5 levels, up to the item’s level cap.`,
      'You may return with more bounty until this saloon’s prize is won.',
      'Three bets per visit. Stake cap: 20% of entry bounty ($2–$100).',
      `Visit loss budget: ${ECONOMY.faro.lossFraction * 100}% of entry bounty. Limits round down to even dollars.`,
      '[← →] Rank   [F] Chip   [C] Copper   [BACKSPACE] Withdraw / clear',
      '[ENTER] Deal   [ESC] Leave / close tutorial. Unresolved stakes are refunded.',
    ];
    rules.forEach((rule, i) => pulpText(this.scene, modal, 0, -250 + i * 48, rule, 22, '#321b10').setWordWrapWidth(1000));
    pulpButton(this.scene, modal, 0, 350, 'BACK TO THE TABLE', () => this.closeTutorial(), 580, true);
    sounds.playCards(); this.scene.tweens.add({ targets: modal, alpha: { from: 0, to: 1 }, duration: 160 });
  }
  private closeTutorial() { this.tutorial?.destroy(); this.tutorial = undefined; }
  private chip(x: number, y: number, value: number, index: number) {
    const node = this.scene.add.container(x, y), g = this.scene.add.graphics();
    g.fillStyle(0x120b08, .5).fillCircle(3, 5, 30);
    g.fillStyle([0xc89827, 0xa51e16, 0x294e78][index]).fillCircle(0, 0, 30);
    g.lineStyle(3, 0xf2d49a).strokeCircle(0, 0, 25);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.lineBetween(Math.cos(a) * 24, Math.sin(a) * 24, Math.cos(a) * 30, Math.sin(a) * 30); }
    node.add(g); pulpText(this.scene, node, 0, 0, `$${value}`, 20, '#f2d49a'); this.root.add(node); return node;
  }
  private select(rank: number) { if (this.tutorial || this.busy || this.table.activeBet || this.table.finished) return; this.rank = rank; sounds.playCards(); this.refresh(); }
  private toggleCopper() { if (!this.tutorial && !this.busy && !this.table.activeBet) { this.inverted = !this.inverted; this.refresh(); } }
  private drop(rank: number, amount: number) {
    if (this.tutorial || this.busy || this.table.activeBet || !this.table.rankRemaining(rank)) return;
    const sum = (this.rank === rank ? this.pending : 0) + amount;
    if (!this.table.canWager(sum)) { this.status.setText(`Bet limit $${this.table.availableStake}. Use a smaller chip or clear the stack.`); return; }
    this.rank = rank; this.pending = sum; sounds.playCards(); this.refresh();
  }
  private refresh() {
    this.ranks.forEach(({ node, count, highlight }, i) => { const left = this.table.rankRemaining(i + 1); node.setAlpha(left ? 1 : .35); count.setText(`${left} LEFT`); highlight.setVisible(i + 1 === this.rank); });
    const bet = this.table.activeBet, amount = bet?.stake ?? this.pending;
    const card = this.ranks[(bet?.rank ?? this.rank) - 1].node;
    this.marker.setPosition(card.x + 18, card.y + 26).setVisible(amount > 0);
    this.markerText.setText(`${this.inverted ? 'C ' : ''}$${amount}`);
    this.copper.setText(this.inverted ? 'COPPER: FIRST WINS' : 'COPPER: OFF [C]');
    this.action.setText(this.table.finished ? 'TABLE CLOSED' : bet ? 'DEAL NEXT PAIR' : `BET $${amount || FARO_STAKES[this.stakeIndex]} ON ${faroRank(this.rank)}`);
    this.account.setText(`BOUNTY $${this.table.balance}  •  BET LIMIT $${this.table.availableStake}  •  ${this.table.remainingBets} BETS LEFT  •  ${this.table.remainingCards} CARDS`);
    if (this.table.wonItem) this.prizeLabel.setText('★ PRIZE WON! ★');
  }
  private play() {
    if (this.tutorial || this.busy || this.exited || this.table.finished) return;
    if (!this.table.activeBet && !this.table.placeBet(this.rank, this.inverted ? 'banker' : 'player', this.pending || FARO_STAKES[this.stakeIndex])) { this.status.setText('Insufficient bounty, bet limit reached, or rank exhausted. Choose a smaller stake.'); return; }
    const result = this.table.deal(); if (!result) return;
    this.busy = true; this.action.setText('DEALING…');
    for (let i = 1; i <= 2; i++) {
      this.dealt[i].destroy(); const x = i === 1 ? -446 : -316;
      const back = playingCard(this.scene, this.root, -280, -215, 69);
      this.dealt[i] = back;
      this.scene.tweens.add({ targets: back, x, y: 246, angle: i === 1 ? -4 : 4, duration: 280, delay: (i - 1) * 420 });
      this.scene.time.delayedCall(300 + (i - 1) * 420, () => {
        if (this.exited) return;
        sounds.playCards();
        this.scene.tweens.add({ targets: back, scaleX: 0, duration: 110, onComplete: () => {
          back.destroy(); const face = playingCard(this.scene, this.root, x, 246, 69, i === 1 ? result.banker : result.player);
          this.dealt[i] = face; face.setScale(0, 1); this.scene.tweens.add({ targets: face, scaleX: 1, duration: 110 });
        } });
      });
    }
    this.scene.time.delayedCall(1020, () => {
      this.busy = false; if (!this.table.activeBet) this.pending = 0;
      const messages = { win: 'WIN! Your stake pays 1:1.', lose: 'HOUSE WINS', split: 'MATCHING PAIR — HALF STAKE RETURNED', push: 'NO MATCH — BET STAYS IN PLAY' };
      this.status.setText(result.outcome === 'push' && !this.table.activeBet ? 'End of shoe: unresolved stake refunded.' : messages[result.outcome]);
      if (result.outcome === 'win') { sounds.playCoin(); this.scene.cameras.main.flash(150, 255, 197, 42); }
      this.refresh();
    });
  }
  private leave() { if (this.tutorial || this.busy || this.exited) return; this.exited = true; this.table.close(); this.onExit(); }
}
