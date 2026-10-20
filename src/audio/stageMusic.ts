import manifest from './musicManifest.json';
export const MUSIC_MANIFEST = manifest;
export function stageMusicSource(stage: number): string {
  return manifest.stages.find(track => track.stage === stage)?.file ?? manifest.fallback;
}
