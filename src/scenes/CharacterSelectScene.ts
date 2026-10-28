import { HERO_STYLE } from '../data/gunslingerStyle';
import { BankHUD } from '../ui/hud/BankHUD';
import { statsManager } from '../data/GameStatsManager';
import { ECONOMY } from '../data/economy';
import { preloadPulp, pulpBackdrop, pulpHeading, pulpText } from '../ui/layout/pulpSceneKit';
import { pulpSurface } from '../ui/components/PulpSurface';
import { normalizeDifficulty, difficultySettings, type DifficultyId } from '../data/difficulty';
import { preloadHeroSheets, preloadImages } from '../assets/registry';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CHARACTERS } from '../data/characters';
import { THEME } from '../ui/theme/tokens';

// Selection-only firing poses; avoid cycling through back-facing travel frames.
const PREVIEW_FRAMES = { steve: [0, 1, 3, 4], billy: [0, 2, 3, 5], bob: [4, 5, 6, 7], cormano: [0, 1, 2, 3] };

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private difficulty: DifficultyId = 'normal';
  init(data?: { difficulty?: DifficultyId }) { this.difficulty = normalizeDifficulty(data?.difficulty ?? difficultySettings.get()); }
  private readonly characterKeys: Array<'steve' | 'billy' | 'bob' | 'cormano'> = [
    'steve',
    'billy',
    'bob',
    'cormano',
  ];

  // Visual Containers & Objects
  private rootContainer!: Phaser.GameObjects.Container;
  private cardContainers: Phaser.GameObjects.Container[] = [];
  private cardPosters: Phaser.GameObjects.Image[] = [];
  private cardGlows: Phaser.GameObjects.Graphics[] = [];
  private cardSelectedFrames: Phaser.GameObjects.Image[] = [];
  private tagContainers: Phaser.GameObjects.Container[] = [];
  private tagGraphics: Phaser.GameObjects.Graphics[] = [];
  private tagTexts: Phaser.GameObjects.Text[] = [];

  // Bottom Details Panel Objects
  private infoNameTitle!: Phaser.GameObjects.Text;
  private infoSubtitle!: Phaser.GameObjects.Text;
  private infoWeaponVal!: Phaser.GameObjects.Text;
  private infoTraitVal!: Phaser.GameObjects.Text;
  private infoQuote!: Phaser.GameObjects.Text;
  private heroPreviewSprite!: Phaser.GameObjects.Sprite;
  private rideOutGlow!: Phaser.GameObjects.Graphics;
  private rideOutTween?: Phaser.Tweens.Tween;

  private isConfirmed: boolean = false;
  private lockOverlays: Phaser.GameObjects.Container[] = [];
  private bankHud!: BankHUD;
  private styleLabel!: Phaser.GameObjects.Text;
  private rideLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterSelectScene');
  }

  preload() {
    preloadHeroSheets(this);
    preloadPulp(this);
    if (!this.textures.exists('poster_steve')) {
      preloadImages(this, ['poster_steve']);
    }
    if (!this.textures.exists('poster_billy')) {
      preloadImages(this, ['poster_billy']);
    }
    if (!this.textures.exists('poster_bob')) {
      preloadImages(this, ['poster_bob']);
    }
    if (!this.textures.exists('poster_cormano')) {
      preloadImages(this, ['poster_cormano']);
    }
    if (!this.textures.exists('ui_card_selected_frame')) {
      preloadImages(this, ['ui_card_selected_frame']);
    }
  }

  create() {
    const { width, height } = this.scale;
    this.isConfirmed = false;
    this.cardContainers = [];
    this.cardPosters = [];
    this.cardGlows = [];
    this.cardSelectedFrames = [];
    this.tagContainers = [];
    this.tagGraphics = [];
    this.tagTexts = [];
    this.lockOverlays = [];
    for (const hero of this.characterKeys) {
      if (this.textures.exists(`hero_${hero}`) && !this.anims.exists(`select_preview_${hero}`)) {
        this.anims.create({ key: `select_preview_${hero}`, frames: PREVIEW_FRAMES[hero].map(frame => ({ key: `hero_${hero}`, frame })), frameRate: 6, repeat: -1 });
      }
    }

    // 1. Dark letterbox screen background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Reference Resolution Root Container (1536 x 1024)

    statsManager.refresh();
    this.rootContainer = createMenuRoot(this);

    pulpBackdrop(this, this.rootContainer, false);
    pulpHeading(this, this.rootContainer, 'SELECT YOUR PLAYER', -390, 1120, 58, true);
    pulpText(this, this.rootContainer, 0, -305, '[← →] CHOOSE   •   [ENTER] RIDE OUT', 21);

    this.bankHud = new BankHUD(this, this.rootContainer);
    this.styleLabel=pulpText(this,this.rootContainer,0,-282,'',16,'#ffc52a');

    // 4. Create the 4 Wanted Poster Character Cards
    this.createCharacterCards();

    // 5. Create the Bottom Wood Saloon Info Panel
    this.createBottomPanel();

    // 6. Setup Keyboard, Mouse & Gamepad Controls
    this.setupControls();

    // 7. Initialize selection to Steve (0) without sound on initial build
    this.selectIndex(0, false);

    // 8. Handle window resizing to keep everything centered and scaled


    // 9. Ensure intro soundtrack is playing
    sounds.playIntroMusic();

    // 10. Efeito de carregando arma ao entrar na tela de escolher o jogador
    sounds.playGunReload();

    // 11. Soft entrance camera fade-in
    this.cameras.main.fadeIn(350, 0, 0, 0);
  }

  // -------------------------------------------------------------
  // 4 CHARACTER CARDS CREATION (Steve, Billy, Bob, Cormano)
  // -------------------------------------------------------------
  private createCharacterCards() {
    const cardWidth = 300;
    const cardHeight = 465;
    const cardXPositions = [-546, -182, 182, 546];
    const cardBaseY = -32;

    this.characterKeys.forEach((key, idx) => {
      const cx = cardXPositions[idx];

      const container = this.add.container(cx, cardBaseY);

      // Poster Image
      const posterKey = `poster_${key}`;
      const poster = this.add.image(0, 0, posterKey);
      poster.setDisplaySize(cardWidth, cardHeight);
      container.add(poster);
      this.cardPosters.push(poster);

      // Amber / Golden Glow Graphics (for selected state)
      const glow = this.add.graphics();
      container.add(glow);
      this.cardGlows.push(glow);

      // Golden Ornate Selected Frame
      let selFrame: Phaser.GameObjects.Image;
      if (this.textures.exists('ui_card_selected_frame')) {
        selFrame = this.add.image(0, 0, 'ui_card_selected_frame');
        selFrame.setDisplaySize(cardWidth + 18, cardHeight + 20);
      } else {
        // Fallback transparent dummy
        selFrame = this.add.image(0, 0, posterKey).setAlpha(0);
      }
      selFrame.setVisible(false);
      container.add(selFrame);
      this.cardSelectedFrames.push(selFrame);

      // Top 1UP Badge Tag (Only shown on active selection)
      const tagContainer = this.add.container(0, -cardHeight / 2 - 2);
      const tagGfx = this.add.graphics();
      tagContainer.add(tagGfx);
      this.tagGraphics.push(tagGfx);

      const tagText = this.add.text(0, 0, '★ 1UP READY ★', {
        fontFamily: THEME.typography.pixelFont,
        fontSize: '11px',
        color: '#ffe066',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      tagContainer.add(tagText);
      this.tagTexts.push(tagText);
      tagContainer.setVisible(false);
      this.tagContainers.push(tagContainer);

      container.add(tagContainer);

      const locked = this.add.container(0, 144), plate = this.add.graphics();
      plate.fillStyle(0x120b08,.94).fillRect(-126,-40,252,80);
      plate.lineStyle(2,0xffc52a).strokeRect(-126,-40,252,80);
      plate.lineStyle(4,0xffc52a).strokeRoundedRect(-103,-18,22,23,10);
      plate.fillStyle(0xc49a55).fillRect(-108,-3,32,27);
      plate.fillStyle(0x120b08).fillCircle(-92,8,3).fillRect(-94,8,4,9);
      locked.add(plate);
      const cost = key === 'bob' || key === 'cormano' ? ECONOMY.characters[key] : 0;
      locked.add(this.add.text(23,-17,'LOCKED',{fontFamily:THEME.typography.pixelFont,fontSize:'12px',color:'#ffc52a'}).setOrigin(.5));
      locked.add(this.add.text(23,14,`$${cost.toLocaleString()}`,{fontFamily:THEME.typography.westernFont,fontSize:'30px',color:'#f2d49a'}).setOrigin(.5));
      locked.setVisible(!statsManager.isCharacterUnlocked(key)); container.add(locked); this.lockOverlays.push(locked);

      // Interactive Hit Area
      const hitZone = this.add.zone(0, 0, cardWidth, cardHeight).setInteractive({ useHandCursor: true });
      hitZone.on('pointerover', () => {
        if (this.selectedIndex !== idx && !this.isConfirmed) {
          this.tweens.add({
            targets: container,
            y: cardBaseY - 5,
            duration: 120,
            ease: 'Power1',
          });
        }
      });

      hitZone.on('pointerout', () => {
        if (this.selectedIndex !== idx && !this.isConfirmed) {
          this.tweens.add({
            targets: container,
            y: cardBaseY,
            duration: 120,
            ease: 'Power1',
          });
        }
      });

      hitZone.on('pointerdown', () => {
        if (this.isConfirmed) return;
        if (this.selectedIndex === idx) {
          this.confirmSelection();
        } else {
          this.selectIndex(idx, true);
        }
      });

      container.add(hitZone);
      this.rootContainer.add(container);
      this.cardContainers.push(container);
    });
  }

  // -------------------------------------------------------------
  // BOTTOM DETAILS SALOON WOOD PANEL
  // -------------------------------------------------------------
  private createBottomPanel() {
    const panelW = 1400;
    const panelH = 251;
    const panelY = 360;

    // Panel container centered at (0, panelY)
    const panelContainer = this.add.container(0, panelY);

    panelContainer.add(pulpSurface(this, 0, 0, panelW, panelH, 'paper'));
    const rule = this.add.graphics();
    rule.lineStyle(2, 0xa51e16, 0.55).lineBetween(-635, -46, 130, -46);
    panelContainer.add(rule);

    this.infoNameTitle = this.add.text(-635, -98, '', {
      fontFamily: THEME.typography.westernFont, fontSize: '34px', color: '#a51e16',
    });
    this.infoSubtitle = this.add.text(-485, -89, '', {
      fontFamily: THEME.typography.westernFont, fontSize: '22px', color: '#120b08',
    });
    panelContainer.add(this.infoNameTitle);
    panelContainer.add(this.infoSubtitle);

    const labelStyle = {
      fontFamily: THEME.typography.narrativeFont, fontSize: '18px', fontStyle: 'bold', color: '#a51e16',
    };
    panelContainer.add(this.add.text(-635, -29, 'STARTER WEAPON', labelStyle));
    panelContainer.add(this.add.text(-635, 13, 'SPECIAL TRAIT', labelStyle));
    const valueStyle = {
      fontFamily: THEME.typography.narrativeFont, fontSize: '21px', fontStyle: 'bold', color: '#120b08',
      wordWrap: { width: 550, useAdvancedWrap: true }, lineSpacing: 3,
    };
    this.infoWeaponVal = this.add.text(-435, -31, '', valueStyle);
    this.infoTraitVal = this.add.text(-435, 11, '', valueStyle);
    this.infoQuote = this.add.text(-635, 78, '', {
      fontFamily: THEME.typography.narrativeFont, fontSize: '22px', fontStyle: 'italic', color: '#321b10',
      wordWrap: { width: 770, useAdvancedWrap: true },
    });
    panelContainer.add(this.infoWeaponVal);
    panelContainer.add(this.infoTraitVal);
    panelContainer.add(this.infoQuote);

    // 5. Hero Boot Shadow
    const shadowGfx = this.add.graphics();
    shadowGfx.fillStyle(0x000000, 0.4);
    shadowGfx.fillEllipse(265, 94, 110, 16);
    panelContainer.add(shadowGfx);

    // 6. Live 32-bit Animated Neo Geo Hero Sprite
    const initialKey = this.textures.exists('hero_steve') ? 'hero_steve' : 'player_steve';
    this.heroPreviewSprite = this.add.sprite(265, 90, initialKey, 0);
    this.heroPreviewSprite.setOrigin(0.5, 1).setScale(1.35);
    this.cameras.main.setRoundPixels(true);
    if (this.anims.exists('select_preview_steve')) {
      this.heroPreviewSprite.play('select_preview_steve');
    }
    panelContainer.add(this.heroPreviewSprite);

    // 7. Right Side "PRESS ENTER TO RIDE OUT!" Button
    // Positioned over the right button plaque
    const btnCenterX = 512;
    const btnCenterY = 0;
    const btnW = 270;
    const btnH = 120;

    panelContainer.add(pulpSurface(this, btnCenterX, 0, btnW + 16, 152, 'wood'));
    const rideLabel = this.rideLabel = this.add.text(btnCenterX, -8, 'PRESS ENTER\nTO RIDE OUT!', {
      fontFamily: THEME.typography.westernFont, fontSize: '25px', color: '#ffc52a',
      align: 'center', lineSpacing: 9, stroke: '#120b08', strokeThickness: 2,
    }).setOrigin(0.5);
    panelContainer.add(rideLabel);
    panelContainer.add(this.add.text(btnCenterX, 52, '★', {
      fontFamily: THEME.typography.narrativeFont, fontSize: '30px', color: '#ffc52a',
    }).setOrigin(0.5));

    // Glowing border overlay for arcade attraction
    this.rideOutGlow = this.add.graphics();
    this.rideOutGlow.lineStyle(3, 0xffe066, 0.85);
    this.rideOutGlow.strokeRoundedRect(btnCenterX - btnW / 2, btnCenterY - btnH / 2, btnW, btnH, 8);
    this.rideOutGlow.fillStyle(0xffe066, 0.12);
    this.rideOutGlow.fillRoundedRect(btnCenterX - btnW / 2, btnCenterY - btnH / 2, btnW, btnH, 8);
    panelContainer.add(this.rideOutGlow);

    this.rideOutTween = this.tweens.add({
      targets: this.rideOutGlow,
      alpha: 0.25,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Interactive Click Zone for Ride Out Button
    const rideOutZone = this.add.zone(btnCenterX, btnCenterY, btnW, btnH).setInteractive({ useHandCursor: true });
    rideOutZone.on('pointerover', () => {
      this.rideOutGlow.alpha = 1;
    });
    rideOutZone.on('pointerout', () => {
      this.rideOutGlow.alpha = 0.8;
    });
    rideOutZone.on('pointerdown', () => {
      this.confirmSelection();
    });
    panelContainer.add(rideOutZone);

    this.rootContainer.add(panelContainer);
  }

  // -------------------------------------------------------------
  // CONTROLS SETUP (Keyboard, Mouse)
  // -------------------------------------------------------------
  private setupControls() {
    // Remove only this scene's handlers when it exits, including interrupted visits.
    const bindings: Array<[string, () => void]> = [];
    const on = (event: string, action: () => void) => {
      this.input.keyboard?.on(event, action); bindings.push([event, action]);
    };
    this.events.once('shutdown', () => bindings.forEach(([event, action]) => this.input.keyboard?.off(event, action)));
    // Arrow navigation
    on('keydown-LEFT', () => this.moveSelection(-1));
    on('keydown-A', () => this.moveSelection(-1));
    on('keydown-RIGHT', () => this.moveSelection(1));
    on('keydown-D', () => this.moveSelection(1));

    // Direct number selection (1: Steve, 2: Billy, 3: Bob, 4: Cormano)
    on('keydown-ONE', () => this.selectIndex(0, true));
    on('keydown-TWO', () => this.selectIndex(1, true));
    on('keydown-THREE', () => this.selectIndex(2, true));
    on('keydown-FOUR', () => this.selectIndex(3, true));

    // Confirmation keys
    on('keydown-ENTER', () => this.confirmSelection());
    on('keydown-SPACE', () => this.confirmSelection());
  }

  private moveSelection(dir: number) {
    if (this.isConfirmed) return;
    let next = this.selectedIndex + dir;
    if (next < 0) next = this.characterKeys.length - 1;
    if (next >= this.characterKeys.length) next = 0;
    this.selectIndex(next, true);
  }

  // -------------------------------------------------------------
  // SELECT CHARACTER INDEX
  // -------------------------------------------------------------
  private selectIndex(idx: number, playSound: boolean = true) {
    this.selectedIndex = idx;
    const charKey = this.characterKeys[idx];

    if (playSound) {
      // Efeito de carregando a arma ao selecionar o jogador
      sounds.playGunReload();
      // Toca a voz do jogador (cessando imediatamente a anterior)
      sounds.playHeroVoice(charKey);
    }

    const cardWidth = 300;
    const cardHeight = 465;
    const cardBaseY = -32;

    this.cardContainers.forEach((container, i) => {
      const isSelected = i === idx;
      const glow = this.cardGlows[i];
      const selFrame = this.cardSelectedFrames[i];
      const tagGfx = this.tagGraphics[i];
      const tagText = this.tagTexts[i];
      const poster = this.cardPosters[i];

      this.lockOverlays[i]?.setVisible(!statsManager.isCharacterUnlocked(this.characterKeys[i]));
      glow.clear();
      tagGfx.clear();

      if (isSelected) {
        // Selected card: elevated (-12px) and highlighted
        this.tweens.killTweensOf(container);
        this.tweens.add({
          targets: container,
          y: cardBaseY - 12,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 180,
          ease: 'Back.easeOut',
        });

        // Golden glowing neon aura & crisp double border
        glow.lineStyle(8, 0xffa000, 0.65);
        glow.strokeRoundedRect(-cardWidth / 2 - 4, -cardHeight / 2 - 4, cardWidth + 8, cardHeight + 8, 10);
        glow.lineStyle(3, 0xfff066, 1.0);
        glow.strokeRoundedRect(-cardWidth / 2 - 1, -cardHeight / 2 - 1, cardWidth + 2, cardHeight + 2, 8);

        // Corner golden rivets
        glow.fillStyle(0xfff066, 1.0);
        [-cardWidth / 2 + 12, cardWidth / 2 - 12].forEach((rx) => {
          [-cardHeight / 2 + 12, cardHeight / 2 - 12].forEach((ry) => {
            glow.fillCircle(rx, ry, 3.5);
          });
        });

        // Ornate frame visible
        selFrame.setVisible(true);
        selFrame.setAlpha(0.9);

        // Poster full brightness
        poster.setAlpha(statsManager.isCharacterUnlocked(this.characterKeys[i]) ? 1 : .6);

        // 1UP READY Tag in bright arcade red & gold
        this.tagContainers[i].setVisible(true);
        tagGfx.fillStyle(0xc12a20, 1.0);
        tagGfx.fillRoundedRect(-68, -13, 136, 26, 6);
        tagGfx.lineStyle(2, 0xffe066, 1.0);
        tagGfx.strokeRoundedRect(-68, -13, 136, 26, 6);

        tagText.setText(statsManager.isCharacterUnlocked(this.characterKeys[i]) ? '★ 1UP READY ★' : '★ LOCKED ★');
        tagText.setColor('#ffe066');
        tagText.setFontSize('11px');

        // Bring selected card to top of display list
        this.rootContainer.bringToTop(container);
      } else {
        // Unselected card: base Y, slight subdued tint
        this.tweens.killTweensOf(container);
        this.tweens.add({
          targets: container,
          y: cardBaseY,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 150,
          ease: 'Power1',
        });

        selFrame.setVisible(false);
        poster.setAlpha(statsManager.isCharacterUnlocked(this.characterKeys[i]) ? .92 : .45);

        // Hide tag container on unselected card (the poster paper already displays vintage 1UP)
        this.tagContainers[i].setVisible(false);
      }
    });

    // Update Bottom Panel info with character data
    const selectedChar = CHARACTERS[charKey];

    // Character title with primary color accent
    this.styleLabel.setText(`${HERO_STYLE[charKey].name} · ${HERO_STYLE[charKey].description}`);
    this.infoNameTitle.setText(selectedChar.name);
    this.infoSubtitle.setText(`— ${selectedChar.title}`);
    this.infoSubtitle.setX(this.infoNameTitle.x + this.infoNameTitle.width + 18);
    this.infoWeaponVal.setText(selectedChar.subtitle);
    this.infoTraitVal.setText(selectedChar.specialBonus);
    this.infoQuote.setText(selectedChar.quote);
    const unlocked = statsManager.isCharacterUnlocked(charKey);
    const price = charKey === 'bob' || charKey === 'cormano' ? ECONOMY.characters[charKey] : 0;
    this.rideLabel.setText(unlocked ? 'PRESS ENTER\nTO RIDE OUT!' : `UNLOCK ${selectedChar.name}\n$${price.toLocaleString()}`);
    this.rideLabel.setAlpha(unlocked || statsManager.getStats().bank >= price ? 1 : .45);
    this.bankHud.refresh();

    // Update live 32-bit animated hero sprite
    const textureKey = this.textures.exists(`hero_${charKey}`) ? `hero_${charKey}` : `player_${charKey}`;
    this.heroPreviewSprite.setTexture(textureKey, PREVIEW_FRAMES[charKey][0]);
    if (this.anims.exists(`select_preview_${charKey}`)) {
      this.heroPreviewSprite.play(`select_preview_${charKey}`);
    }


  }

  // -------------------------------------------------------------
  // CONFIRM CHARACTER & RIDE OUT TRANSITION
  // -------------------------------------------------------------
  private confirmSelection() {
    if (this.isConfirmed) return;
    const charKey = this.characterKeys[this.selectedIndex];
    const selectedChar = CHARACTERS[charKey];
    if (!statsManager.isCharacterUnlocked(charKey)) {
      const result = statsManager.buyCharacter(charKey);
      if (result === 'bought') {
        sounds.playLevelUp(); this.selectIndex(this.selectedIndex, false);
        this.infoQuote.setText(`${selectedChar.name} UNLOCKED — YOUR NEXT RIDE AWAITS!`);
        this.tweens.add({ targets:this.cardSelectedFrames[this.selectedIndex], alpha:.25, duration:180, yoyo:true, repeat:2 });
      } else this.infoQuote.setText(result === 'save-failed' ? 'COULD NOT SAVE PURCHASE. YOUR BANK WAS NOT CHARGED.' : 'NOT ENOUGH BANK GOLD. KEEP RIDING, PARTNER!');
      return;
    }
    this.isConfirmed = true;

    // Som de tiro ao selecionar o jogador (pistol-shot.mp3) e voz do herói
    sounds.playPistolShot();
    sounds.playHeroVoice(charKey);

    // Camera flash (arcade yellow/white burst)
    this.cameras.main.flash(200, 255, 245, 210);

    // Card triumph pulse tween
    const cont = this.cardContainers[this.selectedIndex];
    this.tweens.add({
      targets: cont,
      scaleX: 1.1,
      scaleY: 1.1,
      y: -50,
      duration: 140,
      yoyo: true,
      repeat: 2,
      ease: 'Quad.easeInOut',
    });

    // Hero sprite shooting recoil
    this.tweens.add({
      targets: this.heroPreviewSprite,
      x: 273,
      duration: 80,
      yoyo: true,
      repeat: 3,
    });

    // Ride Out button flash
    if (this.rideOutTween) {
      this.rideOutTween.stop();
    }
    this.rideOutGlow.alpha = 1;

    // Fade to black and start WantedScene (cartaz do boss) direto, sem tela de stage
    this.cameras.main.fade(520, 0, 0, 0);
    this.time.delayedCall(560, () => {

      this.scene.start('WantedScene', { character: selectedChar, stage: 1, difficulty: this.difficulty });
    });
  }

  // -------------------------------------------------------------
  // RESPONSIVE SCALING HANDLER
  // -------------------------------------------------------------
}
