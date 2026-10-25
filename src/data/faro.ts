/** Flat Faro / copper rules. Chips exchange for the run's bounty at face value. */
export interface FaroCard { rank: number; suit: number; }
export type FaroSide = 'player' | 'banker';
export type FaroOutcome = 'win' | 'lose' | 'split' | 'push';
export interface FaroDeal { banker: FaroCard; player: FaroCard; outcome: FaroOutcome; }
export interface FaroSettlement { bountyDelta: number; wonItem: boolean; }
export const FARO_STAKES = [2, 10, 20] as const;
export const FARO_MIN_STAKE = 2;
export const FARO_ITEM_STAKE = 10;
export const FARO_MAX_BETS = 3;
export const faroRank = (rank: number): string => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][rank - 1] ?? '?';
const evenFloor = (value: number) => Math.floor(value / 2) * 2;
export function faroBudget(bounty: number) {
  const bankroll = Number.isFinite(bounty) ? Math.max(0, Math.floor(bounty)) : 0;
  return { bankroll, maxStake: Math.min(50, Math.max(2, evenFloor(bankroll * 0.2))), lossLimit: Math.min(bankroll, Math.max(2, evenFloor(bankroll * 0.4))) };
}
export function faroDeck(random = Math.random): FaroCard[] {
  const cards = Array.from({ length: 52 }, (_, i) => ({ rank: i % 13 + 1, suit: Math.floor(i / 13) }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export class FaroTable {
  readonly initialBounty: number;
  readonly maxStake: number;
  readonly lossLimit: number;
  readonly soda?: FaroCard;
  private cards: FaroCard[];
  private purse: number;
  private bet?: { rank: number; side: FaroSide; stake: number };
  private bets = 0;
  private item = false;
  private settlement?: FaroSettlement;
  lastDeal?: FaroDeal;
  constructor(bounty: number, deck?: readonly FaroCard[]) {
    const budget = faroBudget(bounty);
    this.initialBounty = budget.bankroll; this.purse = budget.bankroll;
    this.maxStake = budget.maxStake; this.lossLimit = budget.lossLimit;
    this.cards = (deck ?? faroDeck()).map(card => ({ ...card }));
    // Custom decks are deterministic fixtures; real shoes expose the soda before betting.
    this.soda = deck ? undefined : this.cards.shift();
  }
  get balance(): number { return this.purse; }
  get availableStake(): number {
    const losses = Math.max(0, this.initialBounty - this.purse);
    return evenFloor(Math.max(0, Math.min(this.purse, this.maxStake, this.lossLimit - losses)));
  }
  get remainingCards(): number { return this.cards.length; }
  get remainingBets(): number { return FARO_MAX_BETS - this.bets; }
  get wonItem(): boolean { return this.item; }
  get activeBet() { return this.bet ? { ...this.bet } : undefined; }
  get finished(): boolean { return !!this.settlement || (!this.bet && (this.bets >= FARO_MAX_BETS || this.cards.length < 2 || this.availableStake < FARO_MIN_STAKE)); }
  rankRemaining(rank: number): number { return this.cards.filter(card => card.rank === rank).length; }
  canWager(stake: number): boolean {
    return !this.finished && !this.bet && Number.isSafeInteger(stake) && stake >= FARO_MIN_STAKE && stake % 2 === 0 && stake <= this.availableStake;
  }
  placeBet(rank: number, side: FaroSide, stake: number): boolean {
    if (!this.canWager(stake) || !Number.isInteger(rank) || rank < 1 || rank > 13 ||
      !['player', 'banker'].includes(side) || !this.rankRemaining(rank)) return false;
    this.purse -= stake; this.bet = { rank, side, stake }; this.bets++;
    return true;
  }
  deal(): FaroDeal | undefined {
    if (this.settlement || !this.bet) return undefined;
    if (this.cards.length < 2) { this.refund(); return undefined; }
    const banker = this.cards.shift()!, player = this.cards.shift()!, bet = this.bet;
    const bankMatch = banker.rank === bet.rank, playerMatch = player.rank === bet.rank;
    const outcome: FaroOutcome = bankMatch && playerMatch ? 'split' : !bankMatch && !playerMatch ? 'push'
      : (bet.side === 'player' ? playerMatch : bankMatch) ? 'win' : 'lose';
    if (outcome === 'win') { this.purse += bet.stake * 2; if (bet.stake >= FARO_ITEM_STAKE) this.item = true; }
    if (outcome === 'split') this.purse += bet.stake / 2;
    if (outcome !== 'push') this.bet = undefined;
    else if (this.cards.length < 2) this.refund();
    this.lastDeal = { banker, player, outcome };
    return { ...this.lastDeal, banker: { ...banker }, player: { ...player } };
  }
  /** Bets may be withdrawn between turns; a dealt pair is always settled first. */
  withdrawBet(): void { if (!this.settlement) this.refund(); }
  private refund(): void { if (this.bet) this.purse += this.bet.stake; this.bet = undefined; }
  close(): FaroSettlement {
    if (!this.settlement) { this.refund(); this.settlement = { bountyDelta: this.purse - this.initialBounty, wonItem: this.item }; }
    return { ...this.settlement };
  }
}
