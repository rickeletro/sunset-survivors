import { normalizeDifficulty, type DifficultyId } from './difficulty';
export interface RankingEntry {
  runId: string; name: string; score: number; kills: number; bounty: number;
  stage: number; level: number; seconds: number; character: string; difficulty: DifficultyId;
}
interface Storage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
type Request = (url: string, init?: RequestInit) => Promise<{ok: boolean; json(): Promise<unknown>}>;
export const PUBLIC_RANKING_API = 'https://sunset-survivors-ranking.rickeletro.workers.dev/api/rankings';
export function rankingEndpoint(apiUrl: string | undefined, production: boolean): string {
  return apiUrl?.trim() || (production ? PUBLIC_RANKING_API : '/api/rankings');
}
export const RANKING_ENDPOINT = rankingEndpoint(import.meta.env.VITE_RANKING_API_URL, import.meta.env.PROD);
const KEY = 'sunset_rankings_v1', PENDING_KEY = 'sunset_ranking_pending_v1';
export function rankingName(value: string): string {
  return value.normalize('NFKC').replace(/[^\p{L}\p{N} ._'’-]/gu, '').trim().replace(/\s+/g, ' ').slice(0, 18);
}
export function runScore(bounty: number, kills: number): number { return Math.max(0, Math.floor(bounty)) * 10 + Math.max(0, Math.floor(kills)) * 50; }
function validEntries(value: unknown): RankingEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(e => e && typeof e.runId === 'string' && typeof e.name === 'string' && rankingName(e.name) && ['score','kills','bounty','stage','level','seconds'].every(k => Number.isFinite(e[k]) && e[k] >= 0)).map(e => ({ ...e, name: rankingName(e.name), difficulty: normalizeDifficulty(e.difficulty) }));
}
export class RankingManager {
  private entries: RankingEntry[] = [];
  private pending: RankingEntry[] = [];
  private syncing?: Promise<boolean>;
  constructor(private storage: () => Storage = () => globalThis.localStorage,
    private request: Request | undefined = typeof window !== 'undefined' && typeof fetch === 'function' ? fetch.bind(globalThis) : undefined,
    private endpoint=RANKING_ENDPOINT) {
    try { this.entries = validEntries(JSON.parse(this.storage().getItem(KEY) ?? '[]')).slice(0,100); } catch { /* Session fallback. */ }
    try {
      const raw=this.storage().getItem(PENDING_KEY);
      // Migrate the previous local-only board once. Synced caches never become new submissions.
      this.pending=raw===null ? this.entries.map(e=>({...e})) : validEntries(JSON.parse(raw));
    } catch { this.pending=this.entries.map(e=>({...e})); }
  }
  list(mode?: DifficultyId): RankingEntry[] {
    return this.entries.filter(e => !mode || e.difficulty === mode).sort((a,b) => b.score-a.score || b.stage-a.stage || b.kills-a.kills || b.seconds-a.seconds || a.runId.localeCompare(b.runId)).map(e => ({ ...e }));
  }
  private persist() {
    try { this.storage().setItem(PENDING_KEY,JSON.stringify(this.pending)); this.storage().setItem(KEY,JSON.stringify(this.entries)); } catch { /* Session fallback. */ }
  }
  submit(entry: RankingEntry): boolean {
    const name = rankingName(entry.name);
    if (!name || !entry.runId || [...this.entries,...this.pending].some(e => e.runId === entry.runId) || !['score','kills','bounty','stage','level','seconds'].every(k => Number.isFinite(entry[k as keyof RankingEntry]) && Number(entry[k as keyof RankingEntry]) >= 0)) return false;
    const saved={ ...entry, name, difficulty: normalizeDifficulty(entry.difficulty) };
    this.entries.push(saved); this.pending.push(saved);
    this.entries = this.list().slice(0, 100); this.persist();
    void this.sync();
    return true;
  }
  /** Serializes submissions and refreshes; only server-acknowledged IDs leave the durable retry queue. */
  sync(): Promise<boolean> {
    if (!this.request) return Promise.resolve(false);
    if (this.syncing) return this.syncing;
    this.syncing=this.synchronize().finally(()=>{ this.syncing=undefined; });
    return this.syncing;
  }
  private async synchronize(): Promise<boolean> {
    try {
      while (this.pending.length) {
        const batch=this.pending.slice(0,100);
        const response=await this.request!(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entries:batch}),signal:AbortSignal.timeout(8000)});
        if (!response.ok) return false;
        const result=await response.json() as {accepted?:unknown};
        if (!Array.isArray(result.accepted) || !batch.every(e=>(result.accepted as unknown[]).includes(e.runId))) return false;
        const accepted=new Set(batch.map(e=>e.runId)); this.pending=this.pending.filter(e=>!accepted.has(e.runId)); this.persist();
      }
      const response=await this.request!(this.endpoint,{cache:'no-store',signal:AbortSignal.timeout(8000)});
      if (!response.ok) return false;
      const result=await response.json() as {entries?:unknown};
      if (!Array.isArray(result.entries)) return false;
      const merged=new Map(validEntries(result.entries).map(e=>[e.runId,e]));
      for (const entry of this.pending) if (!merged.has(entry.runId)) merged.set(entry.runId,entry);
      this.entries=[...merged.values()]; this.entries=this.list().slice(0,100); this.persist();
      return this.pending.length ? this.synchronize() : true;
    } catch { return false; }
  }
}
export const rankings = new RankingManager();

// Retry durable pending results when connectivity returns, without polling during combat.
if (typeof window !== 'undefined') {
  const reconnect=()=>{ void rankings.sync(); };
  window.addEventListener('online',reconnect);
  import.meta.hot?.dispose(()=>window.removeEventListener('online',reconnect));
}
