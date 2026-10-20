import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { OPENING_STORY } from '../data/lore';
import { THEME } from '../ui/theme/tokens';

export class StoryScene extends Phaser.Scene {
  private currentSlide: number = 0;
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private quoteText!: Phaser.GameObjects.Text;
  private fullText: string = '';
  private displayedLength: number = 0;
  private isTyping: boolean = false;

  constructor() {
    super('StoryScene');
  }

  create() {
    const { width, height } = this.scale;

    // Dark Desert Saloon Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0f08, 0x1a0f08, 0x0a0503, 0x0a0503, 1);
    bg.fillRect(0, 0, width, height);

    // Weathered Western Parchment Card
    const cardWidth = Math.min(width * 0.88, 860);
    const cardHeight = Math.min(height * 0.82, 540);
    const cardX = (width - cardWidth) / 2;
    const cardY = (height - cardHeight) / 2;

    const parchment = this.add.graphics();
    // Shadow
    parchment.fillStyle(0x000000, 0.6);
    parchment.fillRoundedRect(cardX + 6, cardY + 6, cardWidth, cardHeight, 8);
    // Outer border
    parchment.fillStyle(0x452b14, 1);
    parchment.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, 8);
    // Inner parchment
    parchment.fillStyle(0xe8c48a, 1);
    parchment.fillRoundedRect(cardX + 4, cardY + 4, cardWidth - 8, cardHeight - 8, 6);
    // Decorative inner frame
    parchment.lineStyle(2, 0x8b5a2b, 0.8);
    parchment.strokeRect(cardX + 16, cardY + 16, cardWidth - 32, cardHeight - 32);

    // Corner rivet dots
    parchment.fillStyle(0x452b14, 1);
    const corners = [
      [cardX + 24, cardY + 24],
      [cardX + cardWidth - 24, cardY + 24],
      [cardX + 24, cardY + cardHeight - 24],
      [cardX + cardWidth - 24, cardY + cardHeight - 24],
    ];
    corners.forEach(([cx, cy]) => {
      parchment.fillCircle(cx, cy, 4);
    });

    // Header Banner
    this.titleText = this.add.text(width / 2, cardY + 50, '', {
      fontFamily: THEME.typography.westernFont,
      fontSize: '28px',
      color: THEME.colors.reward.base,
      stroke: '#452b14',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.subtitleText = this.add.text(width / 2, cardY + 95, '', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '12px',
      color: '#78350f',
    }).setOrigin(0.5);

    // Body Text with typewriter
    this.bodyText = this.add.text(cardX + 40, cardY + 140, '', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '13px',
      color: '#2b1d0c',
      lineSpacing: 12,
      wordWrap: { width: cardWidth - 80 },
    });

    // Quote / Callout
    this.quoteText = this.add.text(width / 2, cardY + cardHeight - 85, '', {
      fontFamily: THEME.typography.westernFont,
      fontSize: '20px',
      color: THEME.colors.greedwell.base,
      align: 'center',
    }).setOrigin(0.5);

    // Continue & Skip Controls
    this.add.text(width / 2, cardY + cardHeight - 36, 'CLICK OR PRESS ENTER TO CONTINUE ▶', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '11px',
      color: '#78350f',
    }).setOrigin(0.5);

    // Skip Button in top right
    const skipBtn = this.add.text(width - 40, 28, '[ PULAR / SKIP ]', {
      fontFamily: THEME.typography.pixelFont,
      fontSize: '12px',
      color: '#f5c518',
      backgroundColor: '#2b1d0c',
      padding: { x: 10, y: 6 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerdown', () => this.finishStory());

    this.showSlide(0);

    // Advance on Click or Keys
    const handleNext = () => {
      if (this.isTyping) {
        // Complete current text immediately
        this.completeTypewriter();
      } else {
        if (this.currentSlide < OPENING_STORY.length - 1) {
          sounds.playRevolver();
          this.showSlide(this.currentSlide + 1);
        } else {
          this.finishStory();
        }
      }
    };

    this.input.on('pointerdown', handleNext);
    this.input.keyboard?.on('keydown-SPACE', handleNext);
    this.input.keyboard?.on('keydown-ENTER', handleNext);
  }

  private showSlide(index: number) {
    this.currentSlide = index;
    const slide = OPENING_STORY[index];

    this.titleText.setText(slide.title);
    this.subtitleText.setText(slide.subtitle);
    this.quoteText.setText(slide.highlight);

    this.fullText = slide.body.join('\n\n');
    this.displayedLength = 0;
    this.bodyText.setText('');
    this.isTyping = true;

    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
    }

    this.typewriterTimer = this.time.addEvent({
      delay: 20,
      callback: () => {
        if (this.displayedLength < this.fullText.length) {
          this.displayedLength++;
          this.bodyText.setText(this.fullText.substring(0, this.displayedLength));
        } else {
          this.isTyping = false;
          this.typewriterTimer?.remove();
        }
      },
      loop: true,
    });
  }

  private completeTypewriter() {
    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
    }
    this.bodyText.setText(this.fullText);
    this.isTyping = false;
  }

  private finishStory() {
    sounds.playRicochet();
    this.cameras.main.fade(400, 0, 0, 0);
    this.time.delayedCall(450, () => {
      this.scene.start('CharacterSelectScene');
    });
  }
}
