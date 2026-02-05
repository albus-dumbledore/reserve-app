import tracks from '@/data/audio.json';
import type { AudioTrack } from './types';

export const audioTracks = tracks as AudioTrack[];

export function getTrackById(id: string): AudioTrack | null {
  return audioTracks.find((track) => track.id === id) ?? null;
}

export function pickTrack(seed: string): AudioTrack {
  if (audioTracks.length === 0) {
    return {
      id: 'silence',
      title: 'Silence',
      file: '',
      attribution: 'No audio available.'
    };
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % audioTracks.length;
  return audioTracks[index];
}
