import { preloadImages } from '../assets/registry';
import { createMenuRoot } from '../ui/layout/menuLayout';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { CHARACTERS } from '../data/characters';
import { THEME } from '../ui/theme/tokens';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex: number = 0;
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
  private infoWeaponVal!: Phaser.GameObjects.Text;
  private infoTraitVal!: Phaser.GameObjects.Text;
  private infoQuote!: Phaser.GameObjects.Text;
  private heroPreviewSprite!: Phaser.GameObjects.Sprite;
  private heroMuzzleFlash!: Phaser.GameObjects.Graphics;
  private rideOutGlow!: Phaser.GameObjects.Graphics;
  private rideOutTween?: Phaser.Tweens.Tween;

  private isConfirmed: boolean = false;

  constructor() {
    super('CharacterSelectScene');
  }

  preload() {
    // Safety check: ensure all select assets are loaded if scene launched standalone
    if (!this.textures.exists('select_saloon_backdrop')) {
      preloadImages(this, ['select_saloon_backdrop']);
    }
    if (!this.textures.exists('bottom_panel_clean')) {
      preloadImages(this, ['bottom_panel_clean']);
    }
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

    // 1. Dark letterbox screen background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // 2. Reference Resolution Root Container (1536 x 1024)

    const REF_W = THEME.layout.referenceWidth;
    const REF_H = THEME.layout.referenceHeight;
    this.rootContainer = createMenuRoot(this);

    // 3. Saloon Backdrop Artwork (Authentic 1880s Saloon Wall, Header & Lantern)
    if (this.textures.exists('select_saloon_backdrop')) {
      const backdrop = this.add.image(0, 0, 'select_saloon_backdrop').setDisplaySize(REF_W, REF_H);
      this.rootContainer.add(backdrop);
    } else {
      // Fallback procedural wooden saloon wall
      const wallGfx = this.add.graphics();
      wallGfx.fillStyle(0x23140a, 1);
      wallGfx.fillRect(-REF_W / 2, -REF_H / 2, REF_W, REF_H);
      this.rootContainer.add(wallGfx);
    }

    // Subtle atmospheric amber flicker on the saloon hanging lantern (left corner)
    const lanternGlow = this.add.graphics();
    lanternGlow.fillStyle(0xffaa22, 0.12);
    lanternGlow.fillCircle(-688, -360, 90);
    this.rootContainer.add(lanternGlow);

    this.tweens.add({
      targets: lanternGlow,
      alpha: 0.22,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

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

      // Card Drop Shadow
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.45);
      shadow.fillEllipse(0, cardHeight / 2 + 10, cardWidth - 20, 26);
      container.add(shadow);

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

    // Saloon Wood & Parchment Background Image
    if (this.textures.exists('bottom_panel_clean')) {
      const panelImg = this.add.image(0, 0, 'bottom_panel_clean').setDisplaySize(panelW, panelH);
      panelContainer.add(panelImg);
    } else {
      // Fallback styled parchment panel
      const fallbackGfx = this.add.graphics();
      fallbackGfx.fillStyle(0x1a0f08, 0.95);
      fallbackGfx.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
      fallbackGfx.lineStyle(4, 0x8b5a2b, 1);
      fallbackGfx.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
      panelContainer.add(fallbackGfx);
    }

    // 1. Character Name & Title Header (Rye / Western Woodcut Font)
    this.infoNameTitle = this.add.text(-635, -80, 'STEVE — THE QUICKDRAW GAMBLER', {
      fontFamily: THEME.typography.westernFont,
      fontSize: '32px',
      color: '#b91c1c',
      stroke: '#3b0b0b',
      strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 2, color: 'rgba(0,0,0,0.5)', blur: 2, fill: true },
    });
    panelContainer.add(this.infoNameTitle);

    // 2. Starter Weapon Row
    const weaponLabel = this.add.text(-635, -28, '★ STARTER WEAPON:', {
      fontFamily: '"Roboto Slab", serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#8b1e15',
    });
    panelContainer.add(weaponLabel);

    this.infoWeaponVal = this.add.text(-425, -28, '', {
      fontFamily: '"Roboto Slab", serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#21120b',
    });
    panelContainer.add(this.infoWeaponVal);

    // 3. Special Trait Row
    const traitLabel = this.add.text(-635, 12, '★ SPECIAL TRAIT:', {
      fontFamily: '"Roboto Slab", serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#8b1e15',
    });
    panelContainer.add(traitLabel);

    this.infoTraitVal = this.add.text(-450, 12, '', {
      fontFamily: '"Roboto Slab", serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#21120b',
    });
    panelContainer.add(this.infoTraitVal);

    // 4. Quote Row (Rich Vintage Italic)
    this.infoQuote = this.add.text(-635, 52, '', {
      fontFamily: THEME.typography.westernFont,
      fontSize: '22px',
      fontStyle: 'italic',
      color: '#702d12',
    });
    panelContainer.add(this.infoQuote);

    // 5. Hero Boot Shadow
    const shadowGfx = this.add.graphics();
    shadowGfx.fillStyle(0x000000, 0.4);
    shadowGfx.fillEllipse(220, 82, 100, 22);
    panelContainer.add(shadowGfx);

    // 6. Live 32-bit Animated Neo Geo Hero Sprite
    const initialKey = this.textures.exists('hero_steve') ? 'hero_steve' : 'player_steve';
    this.heroPreviewSprite = this.add.sprite(220, 10, initialKey, 0);
    this.heroPreviewSprite.setScale(1.48);
    this.cameras.main.setRoundPixels(true);
    if (this.anims.exists('steve_run')) {
      this.heroPreviewSprite.play('steve_run');
    }
    panelContainer.add(this.heroPreviewSprite);

    // Hero muzzle flare spark when shooting/selected
    this.heroMuzzleFlash = this.add.graphics();
    panelContainer.add(this.heroMuzzleFlash);

    // 7. Right Side "PRESS ENTER TO RIDE OUT!" Button
    // Positioned over the right button plaque
    const btnCenterX = 512;
    const btnCenterY = 0;
    const btnW = 270;
    const btnH = 120;

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
    // Arrow navigation
    this.input.keyboard?.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-A', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-D', () => this.moveSelection(1));

    // Direct number selection (1: Steve, 2: Billy, 3: Bob, 4: Cormano)
    this.input.keyboard?.on('keydown-ONE', () => this.selectIndex(0, true));
    this.input.keyboard?.on('keydown-TWO', () => this.selectIndex(1, true));
    this.input.keyboard?.on('keydown-THREE', () => this.selectIndex(2, true));
    this.input.keyboard?.on('keydown-FOUR', () => this.selectIndex(3, true));

    // Confirmation keys
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmSelection());
    this.input.keyboard?.on('keydown-SPACE', () => this.confirmSelection());
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
        poster.setAlpha(1.0);

        // 1UP READY Tag in bright arcade red & gold
        this.tagContainers[i].setVisible(true);
        tagGfx.fillStyle(0xc12a20, 1.0);
        tagGfx.fillRoundedRect(-68, -13, 136, 26, 6);
        tagGfx.lineStyle(2, 0xffe066, 1.0);
        tagGfx.strokeRoundedRect(-68, -13, 136, 26, 6);

        tagText.setText('★ 1UP READY ★');
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
        poster.setAlpha(0.92);

        // Hide tag container on unselected card (the poster paper already displays vintage 1UP)
        this.tagContainers[i].setVisible(false);
      }
    });

    // Update Bottom Panel info with character data
    const selectedChar = CHARACTERS[charKey];

    // Character title with primary color accent
    this.infoNameTitle.setText(`${selectedChar.name} — ${selectedChar.title}`);
    this.infoWeaponVal.setText(selectedChar.subtitle);
    this.infoTraitVal.setText(selectedChar.specialBonus);
    this.infoQuote.setText(selectedChar.quote);

    // Update live 32-bit animated hero sprite
    const textureKey = this.textures.exists(`hero_${charKey}`) ? `hero_${charKey}` : `player_${charKey}`;
    this.heroPreviewSprite.setTexture(textureKey, 0);
    if (this.anims.exists(`${charKey}_run`)) {
      this.heroPreviewSprite.play(`${charKey}_run`);
    }

    // Flash muzzle burst effect on gun change
    this.heroMuzzleFlash.clear();
    this.heroMuzzleFlash.fillStyle(0xfff066, 0.9);
    this.heroMuzzleFlash.fillCircle(270, 0, 10);
    this.heroMuzzleFlash.fillStyle(0xff4400, 0.6);
    this.heroMuzzleFlash.fillCircle(270, 0, 16);

    this.tweens.add({
      targets: this.heroMuzzleFlash,
      alpha: 0,
      duration: 180,
      ease: 'Power2',
      onComplete: () => {
        this.heroMuzzleFlash.clear();
        this.heroMuzzleFlash.alpha = 1;
      },
    });
  }

  // -------------------------------------------------------------
  // CONFIRM CHARACTER & RIDE OUT TRANSITION
  // -------------------------------------------------------------
  private confirmSelection() {
    if (this.isConfirmed) return;
    this.isConfirmed = true;

    const charKey = this.characterKeys[this.selectedIndex];
    const selectedChar = CHARACTERS[charKey];

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
      x: 230,
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

      this.scene.start('WantedScene', { character: selectedChar, stage: 1 });
    });
  }

  // -------------------------------------------------------------
  // RESPONSIVE SCALING HANDLER
  // -------------------------------------------------------------
}
