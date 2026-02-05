import quotes from '@/data/quotes.json';
import type { Quote } from './types';

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailyQuote(date = new Date()): Quote {
  const list = quotes as Quote[];
  if (list.length === 0) {
    return { text: 'Welcome back to the room.', source: 'Reservé' };
  }
  const key = getLocalDateKey(date);
  const index = hashString(key) % list.length;
  return list[index];
}
