import config from '@/data/tribe.json';
import { getEdition } from './edition';
import type { TribeCircle, TribeConfig } from './types';

export function getTribeConfig(): TribeConfig {
  return config as TribeConfig;
}

export function getCircles(): TribeCircle[] {
  const edition = getEdition();
  const tribeConfig = getTribeConfig();
  return edition.books.map((book) => ({
    id: `circle-${book.id}`,
    bookId: book.id,
    title: book.title,
    author: book.author,
    capacity: tribeConfig.default_capacity,
    prompt: tribeConfig.weekly_prompt
  }));
}
