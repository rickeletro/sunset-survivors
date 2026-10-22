import { createMenuRoot } from '../ui/layout/menuLayout';
import { preloadPulp, pulpBackdrop, pulpPaper, pulpButton, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { OPENING_STORY } from '../data/lore';
import { THEME } from '../ui/theme/tokens';

export class StoryScene extends Phaser.Scene {
  private finishing = false;
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

  preload() { preloadPulp(this); }

  create() {
    this.finishing = false;
    const root = createMenuRoot(this);
    pulpBackdrop(this, root, false);
    pulpPaper(this, root, 0, 0, 1140, 820);
    this.titleText = this.add.text(0, -340, '', { fontFamily: THEME.typography.westernFont, fontSize: '34px', color: '#a51e16' }).setOrigin(0.5);
    this.subtitleText = this.add.text(0, -278, '', { fontFamily: THEME.typography.pixelFont, fontSize: '14px', color: '#603719' }).setOrigin(0.5);
    this.bodyText = this.add.text(-470, -210, '', { fontFamily: THEME.typography.narrativeFont, fontSize: '24px', color: '#120b08', lineSpacing: 9, wordWrap: { width: 940 } });
    this.quoteText = this.add.text(0, 260, '', { fontFamily: THEME.typography.narrativeFont, fontSize: '26px', fontStyle: 'italic', color: '#a51e16', wordWrap: { width: 940 }, align: 'center' }).setOrigin(0.5);
    root.add([this.titleText, this.subtitleText, this.bodyText, this.quoteText]);
    const handleNext = () => {
      if (this.finishing) return;
      if (this.isTyping) this.completeTypewriter();
      else if (this.currentSlide < OPENING_STORY.length - 1) { sounds.playRevolver(); this.showSlide(this.currentSlide + 1); }
      else this.finishStory();
    };
    const readingZone = this.add.zone(0, -30, 1010, 620).setInteractive();
    readingZone.on('pointerdown', handleNext); root.add(readingZone);
    pulpButton(this, root, 0, 350, 'CONTINUE [ENTER]', handleNext, 530);
    pulpButton(this, root, 570, -458, 'SKIP', () => this.finishStory(), 260);
    bindPulpKeys(this, { SPACE: handleNext, ENTER: handleNext, ESC: () => this.finishStory() });
    this.events.once('shutdown', () => this.typewriterTimer?.remove());
    this.showSlide(0);
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
    if (this.finishing) return;
    this.finishing = true;
    sounds.playRicochet();
    this.cameras.main.fade(400, 0, 0, 0);
    this.time.delayedCall(450, () => {
      this.scene.start('CharacterSelectScene');
    });
  }
}
