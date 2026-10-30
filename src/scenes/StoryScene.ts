import { createMenuRoot } from '../ui/layout/menuLayout';
import { preloadPulp, pulpBackdrop, pulpPaper, pulpButton, bindPulpKeys } from '../ui/layout/pulpSceneKit';
import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager';
import { OPENING_STORY } from '../data/lore';
import { THEME } from '../ui/theme/tokens';
import { t } from '../i18n';

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
    pulpButton(this, root, 0, 350, t('lore.continueBtn'), handleNext, 530);
    pulpButton(this, root, 570, -458, t('lore.skipBtn'), () => this.finishStory(), 260);
    bindPulpKeys(this, { SPACE: handleNext, ENTER: handleNext, ESC: () => this.finishStory() });
    this.events.once('shutdown', () => this.typewriterTimer?.remove());
    this.showSlide(0);
  }

  private getSlide(index: number) {
    if (index === 0) {
      return {
        title: t('lore.slide1Title'),
        subtitle: t('lore.slide1Subtitle'),
        body: [t('lore.slide1Body1'), t('lore.slide1Body2'), t('lore.slide1Body3')],
        highlight: t('lore.slide1Highlight'),
      };
    } else if (index === 1) {
      return {
        title: t('lore.slide2Title'),
        subtitle: t('lore.slide2Subtitle'),
        body: [t('lore.slide2Intro'), t('lore.slide2Steve'), t('lore.slide2Billy'), t('lore.slide2Bob'), t('lore.slide2Cormano')],
        highlight: t('lore.slide2Highlight'),
      };
    }
    return {
      title: t('lore.slide3Title'),
      subtitle: t('lore.slide3Subtitle'),
      body: [t('lore.slide3Body1'), t('lore.slide3Body2'), t('lore.slide3Body3')],
      highlight: t('lore.slide3Highlight'),
    };
  }

  private showSlide(index: number) {
    this.currentSlide = index;
    const slide = this.getSlide(index);

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
