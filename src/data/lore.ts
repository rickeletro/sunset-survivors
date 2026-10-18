export interface LoreSlide {
  title: string;
  subtitle: string;
  body: string[];
  highlight: string;
}

export const OPENING_STORY: LoreSlide[] = [
  {
    title: 'THE DUSTY FRONTIER - 1881',
    subtitle: 'THE SANTA FE CORRUPTION',
    body: [
      'In the scorching summer of 1881, the American frontier was engulfed in blood and greed.',
      'A shadowy syndicate of railroad barons and corrupt cattle rings hired the ruthless outlaw baron SIMON GREEDWELL to seize land by any means necessary.',
      'Small homesteads were burned to ash, gold shipments hijacked, and local sheriffs bribed or gunned down in cold blood.',
    ],
    highlight: '"Greed rules the rails... until lead answers."',
  },
  {
    title: 'THE FOUR OUTCASTS',
    subtitle: 'SWORN UNDER THE CRIMSON SUN',
    body: [
      'Four fearless bounty hunters, each scarred by Greedwell’s reign of terror, crossed paths in a bullet-riddled desert tavern:',
      '• STEVE: The quickdraw gambler seeking justice for his torched border ranch.',
      '• BILLY: The frontier tracker who swore an oath to break Greedwell’s syndicate.',
      '• BOB: The sharpshooter seeking vengeance for his brother ambushed on the Santa Fe line.',
      '• CORMANO: The legendary Mexican vigilante avenging his fallen village with twin barrels.',
    ],
    highlight: 'Four gunslingers. One collective debt of blood.',
  },
  {
    title: 'THE BOUNTY OF A LIFETIME',
    subtitle: 'WANTED: DEAD OR ALIVE',
    body: [
      'The Governor placed an unprecedented $10,000 bounty on Simon Greedwell’s head.',
      'Greedwell has mobilized his entire mercenary army across the canyon pass.',
      'Hordes of cutthroats, dynamite throwers, and desert bandits now stand between the hunters and their ultimate target.',
    ],
    highlight: 'SURVIVE THE HORDE. CLAIM THE REWARD.',
  },
];
