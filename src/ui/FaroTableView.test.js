import { expect, it, vi } from 'vitest';
import { FaroTableView } from './FaroTableView';
import { FaroTable } from '../data/faro';
const h = vi.hoisted(() => ({ bindings: {}, nodes: [], buttons: [] }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playCards: vi.fn(), playShuffle: vi.fn(), playCoin: vi.fn() } }));
vi.mock('./layout/pulpSceneKit', () => ({
  pulpWood: vi.fn(), pulpPaper: vi.fn(),
  pulpText: (_s, root, _x, _y, text) => { const n = { text, x: _x, y: _y, setText(t) { this.text = t; return this; }, setWordWrapWidth() { return this; } }; root.add(n); h.nodes.push(n); return n; },
  pulpButton: (_s, _r, _x, _y, text, click) => { const n = { text, click, setText(t) { this.text = t; return this; } }; h.buttons.push(n); return n; },
  bindPulpKeys: (_s, keys) => { h.bindings = keys; },
}));
vi.mock('./components/FaroCard', () => ({ playingCard: (s, r, x, y) => { const n = s.add.container(x, y); r.add(n); return n; } }));
function fixture(bankroll = 100) {
  h.nodes = []; h.buttons = []; h.bindings = {};
  const all = [], pending = [];
  const node = (x = 0, y = 0) => {
    const n = { x, y, children: [], handlers: {}, data: {}, add(v) { this.children.push(v); return this; }, getAt(i) { return this.children[i]; },
      setPosition(x, y) { Object.assign(this, { x, y }); return this; }, setData(k, v) { this.data[k] = v; return this; }, getData(k) { return this.data[k]; },
      on(k, f) { this.handlers[k] = f; return this; } };
    for (const k of ['setSize', 'setInteractive', 'setAlpha', 'setVisible', 'setScale', 'destroy']) n[k] = vi.fn(() => n);
    all.push(n); return n;
  };
  const g = {}; for (const k of ['fillStyle', 'fillRect', 'fillCircle', 'lineStyle', 'strokeRect', 'strokeCircle', 'lineBetween', 'strokeRoundedRect', 'setPosition', 'setVisible']) g[k] = () => g;
  const scene = { textures: { exists: () => false }, add: { container: node, graphics: () => g }, input: { setDraggable: vi.fn() },
    tweens: { add: options => { if (options.onComplete) pending.push(options.onComplete); } }, cameras: { main: { flash: vi.fn() } },
    time: { delayedCall: (_ms, callback) => pending.push(callback) } };
  const table = new FaroTable(bankroll, [{ rank: 2, suit: 0 }, { rank: 7, suit: 1 }, { rank: 2, suit: 1 }, { rank: 7, suit: 2 }]);
  const exit = vi.fn(); new FaroTableView(scene, node(), table, { type: 'weapon', id: 'shotgun', name: 'Shotgun', description: 'Upgrade shotgun' }, exit);
  return { table, exit, all, reveal: () => { while (pending.length) pending.shift()(); } };
}
it('blocks repeated deals and exit during animation, then settles real winnings exactly once', () => {
  const { table, exit, reveal } = fixture(200);
  h.bindings.F(); h.bindings.F(); h.bindings.ENTER(); expect(table.balance).toBe(240); expect(table.wonItem).toBe(true);
  h.bindings.ENTER(); h.bindings.ESC(); expect(table.remainingCards).toBe(2); expect(exit).not.toHaveBeenCalled();
  reveal(); expect(h.nodes.some(n => n.text.includes('PRIZE WON'))).toBe(true);
  h.bindings.ESC(); h.bindings.ESC(); expect(exit).toHaveBeenCalledOnce(); expect(table.close().bountyDelta).toBe(40);
});
it('stacks dragged coins, rejects oversized stacks without debiting, and locks pending bets', () => {
  const { all, table, reveal } = fixture(); const coin = all.find(n => n.handlers.drop); const seven = all.find(n => n.data.faroRank === 7);
  coin.handlers.drop(null, seven); coin.handlers.drop(null, seven); expect(table.balance).toBe(100);
  h.bindings.ENTER(); expect(table.balance).toBe(104); expect(table.wonItem).toBe(false);
  coin.handlers.drop(null, seven); expect(table.balance).toBe(104); reveal();
});
it('supports copper and refunds an unconfirmed stack when leaving', () => {
  const { all, table, exit } = fixture(); const coin = all.find(n => n.handlers.drop);
  coin.handlers.drop(null, all.find(n => n.data.faroRank === 7)); h.bindings.C(); h.bindings.ESC();
  expect(exit).toHaveBeenCalledOnce(); expect(table.close().bountyDelta).toBe(0);
});
it('rejects an oversized drag stack without charging money', () => {
  const { all, table, reveal } = fixture(); const chips = all.filter(n => n.handlers.drop), seven = all.find(n => n.data.faroRank === 7);
  chips[2].handlers.drop(null, seven); chips[0].handlers.drop(null, seven);
  expect(table.balance).toBe(100); expect(h.nodes.some(n => n.text.includes('Bet limit $20'))).toBe(true);
  h.bindings.ENTER(); reveal(); expect(table.close().bountyDelta).toBe(2);
});

it('withdraws a live unmatched wager between turns without a second charge', () => {
  const { all, table, reveal } = fixture();
  table.cards = [{ rank: 2, suit: 0 }, { rank: 3, suit: 0 }, { rank: 7, suit: 1 }, { rank: 5, suit: 1 }];
  all.filter(n => n.handlers.drop)[1].handlers.drop(null, all.find(n => n.data.faroRank === 7));
  h.bindings.ENTER(); reveal(); expect(table.balance).toBe(90); expect(table.activeBet.stake).toBe(10);
  h.bindings.BACKSPACE(); expect(table.balance).toBe(100); expect(table.activeBet).toBeUndefined();
});

it('opens rules only on request, blocks betting behind the poster and closes it before exiting', () => {
  const { table, exit } = fixture();
  expect(h.nodes.filter(n => n.y > 460)).toHaveLength(0);
  h.buttons.find(b => b.text === 'TUTORIAL').click();
  expect(h.nodes.some(n => n.text === 'HOW TO PLAY FARO')).toBe(true);
  h.bindings.ENTER(); h.bindings.F(); h.bindings.BACKSPACE(); expect(table.balance).toBe(100);
  h.bindings.ESC(); expect(exit).not.toHaveBeenCalled(); h.bindings.ESC(); expect(exit).toHaveBeenCalledOnce();
});
